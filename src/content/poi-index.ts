/**
 * Spatial index over data/pois.json (docs/DECISIONS.md D14).
 * Pure TypeScript; no DOM, Leaflet or React.
 */
import type { PoiFile, PoiNode } from './pois-loader.ts'

export interface PoiBounds {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface PoiIndex {
  cellSize: number
  /** Nodes bucketed by `${cellX}:${cellY}` of floor(x / cellSize), floor(y / cellSize). */
  cells: Map<string, PoiNode[]>
  typeToGroup: Map<string, string>
  nodes: PoiNode[]
  byId: Map<string, PoiNode>
}

export const POI_INDEX_CELL_PX = 256

function cellKey(cellX: number, cellY: number): string {
  return `${cellX}:${cellY}`
}

function groupEnabled(enabledGroups: Record<string, boolean>, groupId: string): boolean {
  return enabledGroups[groupId] === true
}

function inBounds(node: PoiNode, bounds: PoiBounds): boolean {
  return (
    node.x >= bounds.x0 &&
    node.x <= bounds.x1 &&
    node.y >= bounds.y0 &&
    node.y <= bounds.y1
  )
}

export function buildPoiIndex(file: PoiFile, cellSize = POI_INDEX_CELL_PX): PoiIndex {
  const cells = new Map<string, PoiNode[]>()
  const typeToGroup = new Map<string, string>()
  const byId = new Map<string, PoiNode>()
  for (const group of file.groups) {
    for (const type of group.types) {
      typeToGroup.set(type.id, group.id)
    }
  }
  for (const node of file.nodes) {
    const key = cellKey(Math.floor(node.x / cellSize), Math.floor(node.y / cellSize))
    const bucket = cells.get(key)
    if (bucket) bucket.push(node)
    else cells.set(key, [node])
    byId.set(node.id, node)
  }
  return {
    cellSize,
    cells,
    typeToGroup,
    nodes: file.nodes,
    byId,
  }
}

/** Every node inside `bounds` whose group is enabled; visits only the cells the bounds touch. Order: by cell, then file order. */
export function visiblePois(
  index: PoiIndex,
  enabledGroups: Record<string, boolean>,
  bounds: PoiBounds,
): PoiNode[] {
  const { cellSize, cells } = index
  const minX = Math.floor(bounds.x0 / cellSize)
  const maxX = Math.floor(bounds.x1 / cellSize)
  const minY = Math.floor(bounds.y0 / cellSize)
  const maxY = Math.floor(bounds.y1 / cellSize)
  const out: PoiNode[] = []
  for (let cellY = minY; cellY <= maxY; cellY++) {
    for (let cellX = minX; cellX <= maxX; cellX++) {
      const bucket = cells.get(cellKey(cellX, cellY))
      if (!bucket) continue
      for (const node of bucket) {
        if (!inBounds(node, bounds)) continue
        const groupId = index.typeToGroup.get(node.type)
        if (groupId === undefined || !groupEnabled(enabledGroups, groupId)) continue
        out.push(node)
      }
    }
  }
  return out
}

export interface PoiCluster {
  cellX: number
  cellY: number
  x: number
  y: number
  count: number
  groupId: string
}

/** Counts per cluster cell of `cellSize` canonical px over `bounds`, enabled groups only. Empty cells are omitted. */
export function clusterPois(
  index: PoiIndex,
  enabledGroups: Record<string, boolean>,
  bounds: PoiBounds,
  cellSize: number,
): PoiCluster[] {
  const buckets = new Map<string, PoiCluster & { groupCounts: Map<string, number> }>()
  for (const node of visiblePois(index, enabledGroups, bounds)) {
    const groupId = index.typeToGroup.get(node.type)
    if (groupId === undefined) continue
    const cellX = Math.floor(node.x / cellSize)
    const cellY = Math.floor(node.y / cellSize)
    const key = cellKey(cellX, cellY)
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = {
        cellX,
        cellY,
        x: (cellX + 0.5) * cellSize,
        y: (cellY + 0.5) * cellSize,
        count: 0,
        groupId,
        groupCounts: new Map(),
      }
      buckets.set(key, bucket)
    }
    bucket.count += 1
    const next = (bucket.groupCounts.get(groupId) ?? 0) + 1
    bucket.groupCounts.set(groupId, next)
    if (next > (bucket.groupCounts.get(bucket.groupId) ?? 0)) {
      bucket.groupId = groupId
    }
  }
  const clusters: PoiCluster[] = []
  for (const bucket of buckets.values()) {
    clusters.push({
      cellX: bucket.cellX,
      cellY: bucket.cellY,
      x: bucket.x,
      y: bucket.y,
      count: bucket.count,
      groupId: bucket.groupId,
    })
  }
  return clusters
}

/** Nearest node of `typeId` to `pt` (Euclidean, canonical px), or null. */
export function nearestPoiOfType(
  index: PoiIndex,
  typeId: string,
  pt: { x: number; y: number },
): PoiNode | null {
  let best: PoiNode | null = null
  let bestDist = Infinity
  for (const node of index.nodes) {
    if (node.type !== typeId) continue
    const dx = node.x - pt.x
    const dy = node.y - pt.y
    const dist = dx * dx + dy * dy
    if (dist < bestDist) {
      best = node
      bestDist = dist
    }
  }
  return best
}

/** Group id for a node, or null when its type is undeclared. */
export function poiGroupOf(index: PoiIndex, node: PoiNode): string | null {
  return index.typeToGroup.get(node.type) ?? null
}

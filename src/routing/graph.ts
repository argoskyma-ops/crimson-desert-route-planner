import { CONNECTOR_MAX, CONNECTOR_RADIUS_PX } from '../config/travel'
import { cumulativePolylineLengths, dist } from './geometry'
import { SegmentSpatialIndex } from './spatial-index'
import type { SpatialSegment } from './spatial-index'
import type { Pt, RoadClass, RoadNode, RoadsFile } from './types'
import type { WaterMask } from './water-mask'

export interface GraphEdge {
  id: string
  from: string
  to: string
  class: RoadClass
  points: readonly Pt[]
  segmentLengths: readonly number[]
  cumulativeLengths: readonly number[]
  lengthPx: number
}

export interface GraphArc {
  /** Absent for graph-only dead-end connectors. */
  edgeId?: string
  toNodeId: string
  fromOffset: number
  toOffset: number
}

export interface RoadGraph {
  readonly roads: RoadsFile
  readonly nodeById: ReadonlyMap<string, RoadNode>
  readonly edgeById: ReadonlyMap<string, GraphEdge>
  readonly adjacency: ReadonlyMap<string, readonly GraphArc[]>
  /** Undirected dead-end connector pairs; graph-only, not written back to `roads`. */
  readonly connectorCount: number
  /** D10 land/water raster, or null when no mask is loaded. `findRoute` reads it. */
  readonly water: WaterMask | null
  edgesNear(point: Pt, radius: number): SpatialSegment[]
}

export interface BuildGraphOptions {
  /** When false, skip D6 dead-end connectors. Default true. */
  connectors?: boolean
  /** D10: when given, dead-end connectors that cross water are skipped. */
  water?: WaterMask | null
}

export function buildGraph(roads: RoadsFile, options: BuildGraphOptions = {}): RoadGraph {
  const nodeById = new Map<string, RoadNode>()
  for (const node of roads.nodes) {
    if (nodeById.has(node.id)) throw new Error(`Duplicate road node id: "${node.id}"`)
    nodeById.set(node.id, node)
  }

  const edgeById = new Map<string, GraphEdge>()
  const adjacency = new Map<string, GraphArc[]>()
  const spatialSegments: SpatialSegment[] = []
  for (const node of roads.nodes) adjacency.set(node.id, [])

  for (const source of roads.edges) {
    if (edgeById.has(source.id)) throw new Error(`Duplicate road edge id: "${source.id}"`)
    if (!nodeById.has(source.from)) {
      throw new Error(`Road edge "${source.id}" references missing from node "${source.from}"`)
    }
    if (!nodeById.has(source.to)) {
      throw new Error(`Road edge "${source.id}" references missing to node "${source.to}"`)
    }

    const points = source.points.map(([x, y]) => ({ x, y }))
    const cumulativeLengths = cumulativePolylineLengths(points)
    const segmentLengths = cumulativeLengths.slice(1).map((length, index) => length - cumulativeLengths[index])
    const lengthPx = cumulativeLengths.at(-1) ?? 0
    const edge: GraphEdge = {
      id: source.id,
      from: source.from,
      to: source.to,
      class: source.class,
      points,
      segmentLengths,
      cumulativeLengths,
      lengthPx,
    }
    edgeById.set(edge.id, edge)
    adjacency.get(edge.from)?.push({
      edgeId: edge.id,
      toNodeId: edge.to,
      fromOffset: 0,
      toOffset: edge.lengthPx,
    })
    adjacency.get(edge.to)?.push({
      edgeId: edge.id,
      toNodeId: edge.from,
      fromOffset: edge.lengthPx,
      toOffset: 0,
    })

    for (let segmentIndex = 0; segmentIndex < points.length - 1; segmentIndex += 1) {
      spatialSegments.push({ edgeId: edge.id, segmentIndex, a: points[segmentIndex], b: points[segmentIndex + 1] })
    }
  }

  const spatialIndex = new SegmentSpatialIndex(spatialSegments)
  const water = options.water ?? null
  const connectorCount = options.connectors === false
    ? 0
    : addDeadEndConnectors(roads.nodes, adjacency, water)
  return {
    roads,
    nodeById,
    edgeById,
    adjacency,
    connectorCount,
    water,
    edgesNear: (point, radius) => spatialIndex.segmentsNear(point, radius),
  }
}

function addDeadEndConnectors(
  nodes: readonly RoadNode[],
  adjacency: Map<string, GraphArc[]>,
  water: WaterMask | null,
): number {
  const sources = nodes.filter((node) => (adjacency.get(node.id)?.length ?? 0) === 1)
  if (sources.length === 0) return 0

  const components = new UnionFind(nodes.map((node) => node.id))
  for (const [fromId, arcs] of adjacency) {
    for (const arc of arcs) components.union(fromId, arc.toNodeId)
  }

  let connectorCount = 0
  for (const node of sources) {
    const adjacent = new Set<string>()
    for (const arc of adjacency.get(node.id) ?? []) {
      if (arc.edgeId !== undefined) adjacent.add(arc.toNodeId)
    }

    const fromRoot = components.find(node.id)
    const candidates: { id: string; node: RoadNode; distance: number; otherComponent: boolean }[] = []
    for (const other of nodes) {
      if (other.id === node.id || adjacent.has(other.id)) continue
      const distance = dist(node, other)
      if (distance > CONNECTOR_RADIUS_PX) continue
      candidates.push({
        id: other.id,
        node: other,
        distance,
        otherComponent: components.find(other.id) !== fromRoot,
      })
    }

    candidates.sort((left, right) => {
      if (left.otherComponent !== right.otherComponent) return left.otherComponent ? -1 : 1
      if (left.distance !== right.distance) return left.distance - right.distance
      return left.id.localeCompare(right.id)
    })

    // D10: a connector may not jump a river. Skipped candidates free their slot
    // for the next-best dry one, so a dead end still reaches its land neighbours.
    const selected: typeof candidates = []
    for (const candidate of candidates) {
      if (selected.length >= CONNECTOR_MAX) break
      if (water?.crosses(node, candidate.node)) continue
      selected.push(candidate)
    }

    for (const candidate of selected) {
      if (hasConnector(adjacency, node.id, candidate.id)) continue
      adjacency.get(node.id)?.push(connectorArc(candidate.id))
      adjacency.get(candidate.id)?.push(connectorArc(node.id))
      connectorCount += 1
    }
  }
  return connectorCount
}

function connectorArc(toNodeId: string): GraphArc {
  return { toNodeId, fromOffset: 0, toOffset: 0 }
}

function hasConnector(
  adjacency: ReadonlyMap<string, readonly GraphArc[]>,
  fromId: string,
  toId: string,
): boolean {
  return (adjacency.get(fromId) ?? []).some((arc) => arc.toNodeId === toId && arc.edgeId === undefined)
}

class UnionFind {
  private readonly parent = new Map<string, string>()

  constructor(ids: readonly string[]) {
    for (const id of ids) this.parent.set(id, id)
  }

  find(id: string): string {
    let current = id
    while (this.parent.get(current) !== current) {
      const next = this.parent.get(current)
      if (next === undefined) return current
      current = next
    }
    let walk = id
    while (walk !== current) {
      const next = this.parent.get(walk) ?? walk
      this.parent.set(walk, current)
      walk = next
    }
    return current
  }

  union(a: string, b: string): void {
    const left = this.find(a)
    const right = this.find(b)
    if (left !== right) this.parent.set(left, right)
  }
}

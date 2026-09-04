import { dist, projectToSegment } from '../routing/geometry'
import type { Pt, RoadClass, RoadEdge, RoadNode, RoadsFile } from '../routing/types'

/** Distance in image px at which two points are treated as the same vertex. */
export const COORD_EPS = 1e-6

export type DraftNodeSnap = { nodeId: string }
export type DraftEdgeSnap = { edgeId: string; segmentIndex: number; t: number }
export type DraftSnap = DraftNodeSnap | DraftEdgeSnap

export interface DraftPoint {
  pt: Pt
  snap?: DraftSnap
}

export function isNodeSnap(snap: DraftSnap): snap is DraftNodeSnap {
  return 'nodeId' in snap
}

function imageSizeOf(roads: RoadsFile): [number, number] {
  return [roads.imageSize[0], roads.imageSize[1]]
}

function copyPoint(pair: readonly [number, number]): [number, number] {
  return [pair[0], pair[1]]
}

function asPt(pair: readonly [number, number]): Pt {
  return { x: pair[0], y: pair[1] }
}

function near(a: Pt, b: Pt, eps = COORD_EPS): boolean {
  return dist(a, b) <= eps
}

function dropConsecutiveDuplicates(points: [number, number][]): [number, number][] {
  const out: [number, number][] = []
  for (const pair of points) {
    const prev = out.at(-1)
    if (!prev || !near(asPt(prev), asPt(pair))) out.push(copyPoint(pair))
  }
  return out
}

function interpolate(a: readonly [number, number], b: readonly [number, number], t: number): [number, number] {
  const clamped = Math.max(0, Math.min(1, t))
  return [a[0] + clamped * (b[0] - a[0]), a[1] + clamped * (b[1] - a[1])]
}

function nodeById(roads: RoadsFile, id: string): RoadNode | undefined {
  return roads.nodes.find((node) => node.id === id)
}

/** Next id of the form `${prefix}${n}` scanning nodes and edges. Empty graph → `${prefix}1`. */
export function nextId(roads: RoadsFile, prefix: string): string {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`^${escaped}(\\d+)$`)
  let max = 0
  for (const id of [...roads.nodes.map((n) => n.id), ...roads.edges.map((e) => e.id)]) {
    const match = re.exec(id)
    if (match) max = Math.max(max, Number(match[1]))
  }
  return `${prefix}${max + 1}`
}

/** Append a node. Does not mutate `roads`. */
export function addNode(roads: RoadsFile, pt: Pt): RoadsFile {
  const id = nextId(roads, 'n')
  return {
    version: 1,
    imageSize: imageSizeOf(roads),
    nodes: [...roads.nodes, { id, x: pt.x, y: pt.y }],
    edges: roads.edges,
  }
}

/**
 * Append an undirected edge. `points[0]` must match `from` and the last point must
 * match `to` (within COORD_EPS); endpoints are then rewritten to the exact node coords.
 */
export function addEdge(
  roads: RoadsFile,
  fromId: string,
  toId: string,
  cls: RoadClass,
  points: readonly [number, number][],
): RoadsFile {
  const from = nodeById(roads, fromId)
  const to = nodeById(roads, toId)
  if (!from) throw new Error(`addEdge: unknown from node "${fromId}"`)
  if (!to) throw new Error(`addEdge: unknown to node "${toId}"`)
  if (points.length < 2) throw new Error('addEdge: points must have at least 2 vertices')

  const first = asPt(points[0])
  const last = asPt(points[points.length - 1])
  if (!near(first, from)) {
    throw new Error('addEdge: first point must match from node coordinates')
  }
  if (!near(last, to)) {
    throw new Error('addEdge: last point must match to node coordinates')
  }

  const snapped: [number, number][] = points.map((pair, index) => {
    if (index === 0) return [from.x, from.y]
    if (index === points.length - 1) return [to.x, to.y]
    return copyPoint(pair)
  })

  const edge: RoadEdge = {
    id: nextId(roads, 'e'),
    from: fromId,
    to: toId,
    class: cls,
    points: snapped,
  }
  return {
    version: 1,
    imageSize: imageSizeOf(roads),
    nodes: roads.nodes,
    edges: [...roads.edges, edge],
  }
}

export function findEdge(roads: RoadsFile, id: string): RoadEdge | undefined {
  return roads.edges.find((edge) => edge.id === id)
}

/**
 * Insert a node at `points[segmentIndex] + t * segment` and replace the edge with
 * two edges of the same class. Splitting at an existing endpoint returns that node
 * and leaves `roads` unchanged.
 */
export function splitEdgeAt(
  roads: RoadsFile,
  edgeId: string,
  segmentIndex: number,
  t: number,
): { roads: RoadsFile; nodeId: string } {
  const edge = findEdge(roads, edgeId)
  if (!edge) throw new Error(`splitEdgeAt: unknown edge "${edgeId}"`)
  if (segmentIndex < 0 || segmentIndex >= edge.points.length - 1) {
    throw new Error(`splitEdgeAt: segmentIndex ${segmentIndex} is out of range on "${edgeId}"`)
  }

  const from = nodeById(roads, edge.from)
  const to = nodeById(roads, edge.to)
  if (!from || !to) throw new Error(`splitEdgeAt: edge "${edgeId}" references a missing node`)

  const a = edge.points[segmentIndex]
  const b = edge.points[segmentIndex + 1]
  const splitPt = interpolate(a, b, t)
  const splitAsPt = asPt(splitPt)

  if (near(splitAsPt, from)) return { roads, nodeId: from.id }
  if (near(splitAsPt, to)) return { roads, nodeId: to.id }

  const left = dropConsecutiveDuplicates([
    ...edge.points.slice(0, segmentIndex + 1).map(copyPoint),
    splitPt,
  ])
  const right = dropConsecutiveDuplicates([
    splitPt,
    ...edge.points.slice(segmentIndex + 1).map(copyPoint),
  ])
  if (left.length < 2 || right.length < 2) {
    return { roads, nodeId: near(splitAsPt, from) ? from.id : to.id }
  }
  left[0] = [from.x, from.y]
  left[left.length - 1] = copyPoint(splitPt)
  right[0] = copyPoint(splitPt)
  right[right.length - 1] = [to.x, to.y]

  const nodeId = nextId(roads, 'n')
  const leftId = nextId(roads, 'e')
  const rightId = nextId({
    ...roads,
    edges: [...roads.edges, { id: leftId, from: edge.from, to: nodeId, class: edge.class, points: left }],
  }, 'e')
  return {
    nodeId,
    roads: {
      version: 1,
      imageSize: imageSizeOf(roads),
      nodes: [...roads.nodes, { id: nodeId, x: splitPt[0], y: splitPt[1] }],
      edges: [
        ...roads.edges.filter((item) => item.id !== edgeId),
        { id: leftId, from: edge.from, to: nodeId, class: edge.class, points: left },
        { id: rightId, from: nodeId, to: edge.to, class: edge.class, points: right },
      ],
    },
  }
}

export function deleteEdge(roads: RoadsFile, edgeId: string): RoadsFile {
  if (!findEdge(roads, edgeId)) throw new Error(`deleteEdge: unknown edge "${edgeId}"`)
  return {
    version: 1,
    imageSize: imageSizeOf(roads),
    nodes: roads.nodes,
    edges: roads.edges.filter((edge) => edge.id !== edgeId),
  }
}

export function setEdgeClass(roads: RoadsFile, edgeId: string, cls: RoadClass): RoadsFile {
  const edge = findEdge(roads, edgeId)
  if (!edge) throw new Error(`setEdgeClass: unknown edge "${edgeId}"`)
  if (edge.class === cls) return roads
  return {
    version: 1,
    imageSize: imageSizeOf(roads),
    nodes: roads.nodes,
    edges: roads.edges.map((item) => (item.id === edgeId ? { ...item, class: cls } : item)),
  }
}

/** Move a node and the matching endpoint of every incident edge. */
export function moveNode(roads: RoadsFile, nodeId: string, pt: Pt): RoadsFile {
  if (!nodeById(roads, nodeId)) throw new Error(`moveNode: unknown node "${nodeId}"`)
  return {
    version: 1,
    imageSize: imageSizeOf(roads),
    nodes: roads.nodes.map((node) => (node.id === nodeId ? { ...node, x: pt.x, y: pt.y } : node)),
    edges: roads.edges.map((edge) => {
      const touchFrom = edge.from === nodeId
      const touchTo = edge.to === nodeId
      if (!touchFrom && !touchTo) return edge
      const points = edge.points.map(copyPoint)
      if (touchFrom) points[0] = [pt.x, pt.y]
      if (touchTo) points[points.length - 1] = [pt.x, pt.y]
      return { ...edge, points }
    }),
  }
}

export function removeOrphanNodes(roads: RoadsFile): RoadsFile {
  const used = new Set<string>()
  for (const edge of roads.edges) {
    used.add(edge.from)
    used.add(edge.to)
  }
  const nodes = roads.nodes.filter((node) => used.has(node.id))
  if (nodes.length === roads.nodes.length) return roads
  return {
    version: 1,
    imageSize: imageSizeOf(roads),
    nodes,
    edges: roads.edges,
  }
}

function nearestEdgeProjection(
  roads: RoadsFile,
  pt: Pt,
): { edgeId: string; segmentIndex: number; t: number } | null {
  let best: { edgeId: string; segmentIndex: number; t: number; distance: number } | null = null
  for (const edge of roads.edges) {
    for (let index = 0; index < edge.points.length - 1; index += 1) {
      const projection = projectToSegment(pt, asPt(edge.points[index]), asPt(edge.points[index + 1]))
      if (
        !best ||
        projection.distance < best.distance ||
        (projection.distance === best.distance && edge.id < best.edgeId)
      ) {
        best = { edgeId: edge.id, segmentIndex: index, t: projection.t, distance: projection.distance }
      }
    }
  }
  return best
}

function splitAtSnap(
  roads: RoadsFile,
  snap: DraftEdgeSnap,
  fallback: Pt,
): { roads: RoadsFile; nodeId: string } {
  if (findEdge(roads, snap.edgeId)) {
    return splitEdgeAt(roads, snap.edgeId, snap.segmentIndex, snap.t)
  }
  const hit = nearestEdgeProjection(roads, fallback)
  if (hit) return splitEdgeAt(roads, hit.edgeId, hit.segmentIndex, hit.t)
  const nodeId = nextId(roads, 'n')
  return { roads: addNode(roads, fallback), nodeId }
}

function resolveEndpoint(
  roads: RoadsFile,
  draft: DraftPoint,
): { roads: RoadsFile; nodeId: string; pt: Pt } {
  const snap = draft.snap
  if (snap && isNodeSnap(snap)) {
    const node = nodeById(roads, snap.nodeId)
    if (node) return { roads, nodeId: node.id, pt: { x: node.x, y: node.y } }
  }
  if (snap && !isNodeSnap(snap)) {
    const split = splitAtSnap(roads, snap, draft.pt)
    const node = nodeById(split.roads, split.nodeId)
    if (node) return { roads: split.roads, nodeId: node.id, pt: { x: node.x, y: node.y } }
  }
  const nodeId = nextId(roads, 'n')
  return { roads: addNode(roads, draft.pt), nodeId, pt: { x: draft.pt.x, y: draft.pt.y } }
}

/**
 * Turn a draw-tool draft into graph edits: endpoint snaps reuse/split nodes,
 * unsnapped endpoints create nodes, interior vertices stay polyline points.
 */
export function commitDraft(roads: RoadsFile, draft: readonly DraftPoint[], cls: RoadClass): RoadsFile {
  if (draft.length < 2) return roads

  let length = 0
  for (let index = 1; index < draft.length; index += 1) {
    length += dist(draft[index - 1].pt, draft[index].pt)
  }
  if (length <= COORD_EPS) return roads

  const start = resolveEndpoint(roads, draft[0])
  const end = resolveEndpoint(start.roads, draft[draft.length - 1])

  const points: [number, number][] = [[start.pt.x, start.pt.y]]
  for (let index = 1; index < draft.length - 1; index += 1) {
    points.push([draft[index].pt.x, draft[index].pt.y])
  }
  points.push([end.pt.x, end.pt.y])
  const simplified = dropConsecutiveDuplicates(points)
  if (simplified.length < 2) return end.roads

  return addEdge(end.roads, start.nodeId, end.nodeId, cls, simplified)
}

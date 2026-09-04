import { cumulativePolylineLengths } from './geometry'
import { SegmentSpatialIndex } from './spatial-index'
import type { SpatialSegment } from './spatial-index'
import type { Pt, RoadClass, RoadNode, RoadsFile } from './types'

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
  edgeId: string
  toNodeId: string
  fromOffset: number
  toOffset: number
}

export interface RoadGraph {
  readonly roads: RoadsFile
  readonly nodeById: ReadonlyMap<string, RoadNode>
  readonly edgeById: ReadonlyMap<string, GraphEdge>
  readonly adjacency: ReadonlyMap<string, readonly GraphArc[]>
  edgesNear(point: Pt, radius: number): SpatialSegment[]
}

export function buildGraph(roads: RoadsFile): RoadGraph {
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
  return {
    roads,
    nodeById,
    edgeById,
    adjacency,
    edgesNear: (point, radius) => spatialIndex.segmentsNear(point, radius),
  }
}

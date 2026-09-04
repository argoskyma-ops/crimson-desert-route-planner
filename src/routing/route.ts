/**
 * Routing builds a query-local augmented graph: every snap is a virtual split point
 * on its road edge, pin hops are off-road arcs, and A* chooses among those arcs plus
 * the always-present direct off-road arc. The immutable base graph is never modified.
 */
import { secondsFor } from '../config/travel'
import { astar, travelTimeHeuristic } from './astar'
import type { AStarArc } from './astar'
import { dist, slicePolyline } from './geometry'
import type { GraphEdge, RoadGraph } from './graph'
import { snapToRoads } from './snap'
import type { Pt, Route, RouteLeg, RouteOptions, SnapCandidate } from './types'

const SOURCE = 'pin:a'
const TARGET = 'pin:b'
const OFFSET_EPSILON = 1e-8

interface SplitPoint {
  id: string
  edgeId: string
  offset: number
  point: Pt
}

interface RoadStep {
  kind: 'road'
  edgeId: string
  fromOffset: number
  toOffset: number
}

interface OffroadStep {
  kind: 'offroad'
  from: Pt
  to: Pt
}

type RouteStep = RoadStep | OffroadStep

interface QuerySplits {
  byEdge: ReadonlyMap<string, readonly SplitPoint[]>
  byId: ReadonlyMap<string, SplitPoint>
  candidateIds: ReadonlyMap<SnapCandidate, string>
}

export function findRoute(graph: RoadGraph, a: Pt, b: Pt, opts: RouteOptions): Route {
  const aCandidates = snapToRoads(graph, a)
  const bCandidates = snapToRoads(graph, b)
  const splits = makeSplits(graph, [...aCandidates, ...bCandidates])
  const sourceArcs = aCandidates.flatMap((candidate) => {
    const id = splits.candidateIds.get(candidate)
    return id ? [offroadArc(id, a, candidate.point, opts.mode)] : []
  })
  sourceArcs.push(offroadArc(TARGET, a, b, opts.mode))
  const targetArcsBySplit = new Map<string, AStarArc<string, RouteStep>[]>()
  for (const candidate of bCandidates) {
    const id = splits.candidateIds.get(candidate)
    if (!id) continue
    const arcs = targetArcsBySplit.get(id) ?? []
    arcs.push(offroadArc(TARGET, candidate.point, b, opts.mode))
    targetArcsBySplit.set(id, arcs)
  }

  const pointForNode = (node: string): Pt => {
    if (node === SOURCE) return a
    if (node === TARGET) return b
    const split = splits.byId.get(node)
    if (split) return split.point
    const base = graph.nodeById.get(baseNodeId(node))
    return base ? { x: base.x, y: base.y } : b
  }

  const result = astar<string, RouteStep>(
    SOURCE,
    TARGET,
    (node) => queryNeighbors(graph, splits, targetArcsBySplit, sourceArcs, node, opts.mode),
    (node) => travelTimeHeuristic(pointForNode(node), b, opts.mode),
  )
  const legs = stepsToLegs(graph, result?.steps ?? [{ kind: 'offroad', from: a, to: b }], opts.mode)
  return {
    mode: opts.mode,
    legs,
    totalPx: legs.reduce((sum, leg) => sum + leg.lengthPx, 0),
    totalSeconds: legs.reduce((sum, leg) => sum + leg.seconds, 0),
  }
}

function makeSplits(graph: RoadGraph, candidates: readonly SnapCandidate[]): QuerySplits {
  const byEdge = new Map<string, SplitPoint[]>()
  const byId = new Map<string, SplitPoint>()
  const candidateIds = new Map<SnapCandidate, string>()

  for (const candidate of candidates) {
    const edge = graph.edgeById.get(candidate.edgeId)
    if (!edge) continue
    const offset = edge.cumulativeLengths[candidate.segmentIndex]
      + (edge.segmentLengths[candidate.segmentIndex] ?? 0) * candidate.t
    const edgeSplits = byEdge.get(edge.id) ?? []
    let split = edgeSplits.find((entry) => Math.abs(entry.offset - offset) <= OFFSET_EPSILON)
    if (!split) {
      split = { id: `split:${byId.size}`, edgeId: edge.id, offset, point: candidate.point }
      edgeSplits.push(split)
      byEdge.set(edge.id, edgeSplits)
      byId.set(split.id, split)
    }
    candidateIds.set(candidate, split.id)
  }
  for (const edgeSplits of byEdge.values()) edgeSplits.sort((left, right) => left.offset - right.offset)
  return { byEdge, byId, candidateIds }
}

function queryNeighbors(
  graph: RoadGraph,
  splits: QuerySplits,
  targetArcsBySplit: ReadonlyMap<string, readonly AStarArc<string, RouteStep>[]>,
  sourceArcs: readonly AStarArc<string, RouteStep>[],
  node: string,
  mode: RouteOptions['mode'],
): AStarArc<string, RouteStep>[] {
  if (node === SOURCE) return [...sourceArcs]
  if (node === TARGET) return []
  const split = splits.byId.get(node)
  if (split) {
    const edge = graph.edgeById.get(split.edgeId)
    if (!edge) return []
    const edgeSplits = splits.byEdge.get(split.edgeId) ?? []
    const index = edgeSplits.indexOf(split)
    const previous = index > 0 ? edgeSplits[index - 1] : undefined
    const next = index < edgeSplits.length - 1 ? edgeSplits[index + 1] : undefined
    const arcs = [...(targetArcsBySplit.get(node) ?? [])]
    arcs.push(roadArc(edge, split.offset, previous?.offset ?? 0, previous?.id ?? baseId(edge.from), mode))
    arcs.push(roadArc(edge, split.offset, next?.offset ?? edge.lengthPx, next?.id ?? baseId(edge.to), mode))
    return arcs
  }

  const id = baseNodeId(node)
  const arcs: AStarArc<string, RouteStep>[] = []
  for (const baseArc of graph.adjacency.get(id) ?? []) {
    const edge = graph.edgeById.get(baseArc.edgeId)
    if (!edge) continue
    const edgeSplits = splits.byEdge.get(edge.id)
    if (!edgeSplits || edgeSplits.length === 0) {
      arcs.push(roadArc(edge, baseArc.fromOffset, baseArc.toOffset, baseId(baseArc.toNodeId), mode))
      continue
    }
    const fromStart = baseArc.fromOffset === 0
    const nearest = fromStart ? edgeSplits[0] : edgeSplits[edgeSplits.length - 1]
    arcs.push(roadArc(edge, baseArc.fromOffset, nearest.offset, nearest.id, mode))
  }
  return arcs
}

function roadArc(
  edge: GraphEdge,
  fromOffset: number,
  toOffset: number,
  to: string,
  mode: RouteOptions['mode'],
): AStarArc<string, RouteStep> {
  const length = Math.abs(toOffset - fromOffset)
  return {
    to,
    cost: secondsFor(length, mode, edge.class),
    step: { kind: 'road', edgeId: edge.id, fromOffset, toOffset },
  }
}

function offroadArc(
  to: string,
  from: Pt,
  destination: Pt,
  mode: RouteOptions['mode'],
): AStarArc<string, RouteStep> {
  return {
    to,
    cost: secondsFor(dist(from, destination), mode, 'offroad'),
    step: { kind: 'offroad', from, to: destination },
  }
}

function stepsToLegs(graph: RoadGraph, steps: readonly RouteStep[], mode: RouteOptions['mode']): RouteLeg[] {
  const merged: RouteStep[] = []
  for (const step of steps) {
    const previous = merged.at(-1)
    if (
      step.kind === 'road'
      && previous?.kind === 'road'
      && previous.edgeId === step.edgeId
      && Math.abs(previous.toOffset - step.fromOffset) <= OFFSET_EPSILON
    ) {
      previous.toOffset = step.toOffset
    } else {
      merged.push({ ...step })
    }
  }

  return merged.flatMap((step): RouteLeg[] => {
    if (step.kind === 'offroad') {
      const lengthPx = dist(step.from, step.to)
      if (lengthPx <= OFFSET_EPSILON) return []
      return [{ class: 'offroad', points: [{ ...step.from }, { ...step.to }], lengthPx, seconds: secondsFor(lengthPx, mode, 'offroad') }]
    }
    const edge = graph.edgeById.get(step.edgeId)
    if (!edge) return []
    const lengthPx = Math.abs(step.toOffset - step.fromOffset)
    if (lengthPx <= OFFSET_EPSILON) return []
    return [{
      class: edge.class,
      points: slicePolyline(edge.points, edge.cumulativeLengths, step.fromOffset, step.toOffset),
      lengthPx,
      seconds: secondsFor(lengthPx, mode, edge.class),
      edgeId: edge.id,
    }]
  })
}

function baseId(nodeId: string): string {
  return `base:${nodeId}`
}

function baseNodeId(queryId: string): string {
  return queryId.startsWith('base:') ? queryId.slice(5) : queryId
}

import { SNAP_CANDIDATES, SNAP_RADIUS_PX } from '../config/travel'
import { projectToSegment } from './geometry'
import type { RoadGraph } from './graph'
import type { Pt, SnapCandidate } from './types'

export function snapToRoads(
  graph: RoadGraph,
  point: Pt,
  k = SNAP_CANDIDATES,
  radius = SNAP_RADIUS_PX,
): SnapCandidate[] {
  if (k <= 0 || radius < 0) return []
  const nearestByEdge = new Map<string, SnapCandidate>()

  for (const segment of graph.edgesNear(point, radius)) {
    const projection = projectToSegment(point, segment.a, segment.b)
    const candidate: SnapCandidate = {
      edgeId: segment.edgeId,
      segmentIndex: segment.segmentIndex,
      t: projection.t,
      point: projection.point,
      distancePx: projection.distance,
    }
    const previous = nearestByEdge.get(segment.edgeId)
    if (!previous || candidate.distancePx < previous.distancePx) nearestByEdge.set(segment.edgeId, candidate)
  }

  return [...nearestByEdge.values()]
    .sort((left, right) => left.distancePx - right.distancePx || left.edgeId.localeCompare(right.edgeId))
    .slice(0, Math.floor(k))
}

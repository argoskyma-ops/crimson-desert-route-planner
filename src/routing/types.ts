/**
 * Shared data contracts for the road graph and routing results.
 * Coordinates are native image pixels of data/map/source.jpg (x right, y down).
 * See docs/DECISIONS.md D3, D5 and D6.
 */

export type RoadClass = 'main' | 'sub' | 'offroad'
export const ROAD_CLASSES: readonly RoadClass[] = ['main', 'sub', 'offroad']

export type Mode = 'horse' | 'foot'
export const MODES: readonly Mode[] = ['horse', 'foot']

export interface Pt {
  x: number
  y: number
}

export interface RoadNode {
  id: string
  x: number
  y: number
}

export interface RoadEdge {
  id: string
  from: string
  to: string
  class: RoadClass
  /** Polyline in image pixels; first point equals `from`, last equals `to`. */
  points: [number, number][]
}

export interface RoadsFile {
  version: 1
  imageSize: [number, number]
  nodes: RoadNode[]
  edges: RoadEdge[]
}

export interface RouteLeg {
  class: RoadClass
  points: Pt[]
  lengthPx: number
  seconds: number
  /** Set when the leg follows a road edge; absent for off-road hops. */
  edgeId?: string
}

export interface Route {
  mode: Mode
  legs: RouteLeg[]
  totalPx: number
  totalSeconds: number
}

export interface RouteOptions {
  mode: Mode
}

/** A pin projected onto the road network. */
export interface SnapCandidate {
  edgeId: string
  /** Index of the segment within the edge's points (segment i runs points[i] -> points[i+1]). */
  segmentIndex: number
  /** Fraction along that segment, 0..1. */
  t: number
  point: Pt
  distancePx: number
}

import { projectToSegment } from './geometry'
import type { Pt } from './types'

export const DEFAULT_GRID_CELL_SIZE = 64

export interface SpatialSegment {
  edgeId: string
  segmentIndex: number
  a: Pt
  b: Pt
}

function cellKey(x: number, y: number): string {
  return `${x},${y}`
}

/** Uniform-grid index whose radius query returns segments intersecting the search circle. */
export class SegmentSpatialIndex {
  readonly cellSize: number
  private readonly segments: readonly SpatialSegment[]
  private readonly cells = new Map<string, number[]>()

  constructor(segments: readonly SpatialSegment[], cellSize = DEFAULT_GRID_CELL_SIZE) {
    if (!(cellSize > 0)) throw new Error('Spatial index cell size must be greater than zero')
    this.cellSize = cellSize
    this.segments = segments

    for (let id = 0; id < segments.length; id += 1) {
      const segment = segments[id]
      const minCellX = this.cell(segment.a.x < segment.b.x ? segment.a.x : segment.b.x)
      const maxCellX = this.cell(segment.a.x > segment.b.x ? segment.a.x : segment.b.x)
      const minCellY = this.cell(segment.a.y < segment.b.y ? segment.a.y : segment.b.y)
      const maxCellY = this.cell(segment.a.y > segment.b.y ? segment.a.y : segment.b.y)
      for (let x = minCellX; x <= maxCellX; x += 1) {
        for (let y = minCellY; y <= maxCellY; y += 1) {
          const key = cellKey(x, y)
          const ids = this.cells.get(key)
          if (ids) ids.push(id)
          else this.cells.set(key, [id])
        }
      }
    }
  }

  segmentsNear(point: Pt, radius: number): SpatialSegment[] {
    if (radius < 0 || !Number.isFinite(radius)) return []
    const minCellX = this.cell(point.x - radius)
    const maxCellX = this.cell(point.x + radius)
    const minCellY = this.cell(point.y - radius)
    const maxCellY = this.cell(point.y + radius)
    const seen = new Set<number>()
    const result: SpatialSegment[] = []

    for (let x = minCellX; x <= maxCellX; x += 1) {
      for (let y = minCellY; y <= maxCellY; y += 1) {
        for (const id of this.cells.get(cellKey(x, y)) ?? []) {
          if (seen.has(id)) continue
          seen.add(id)
          const segment = this.segments[id]
          if (projectToSegment(point, segment.a, segment.b).distance <= radius) result.push(segment)
        }
      }
    }
    return result
  }

  private cell(value: number): number {
    return Math.floor(value / this.cellSize)
  }
}

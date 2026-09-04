import { describe, expect, it } from 'vitest'
import {
  cumulativePolylineLengths,
  dist,
  pointAtPolylineOffset,
  polylineLength,
  projectToSegment,
  slicePolyline,
} from './geometry'

describe('routing geometry', () => {
  it('computes point and polyline distances', () => {
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    expect(polylineLength([{ x: 0, y: 0 }, { x: 3, y: 4 }, { x: 6, y: 4 }])).toBe(8)
    expect(polylineLength([])).toBe(0)
  })

  it('projects onto a segment and clamps to its endpoints', () => {
    expect(projectToSegment({ x: 4, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toEqual({
      point: { x: 4, y: 0 },
      t: 0.4,
      distance: 3,
    })
    expect(projectToSegment({ x: -2, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toEqual({
      point: { x: 0, y: 0 },
      t: 0,
      distance: 2,
    })
    expect(projectToSegment({ x: 4, y: 6 }, { x: 1, y: 2 }, { x: 1, y: 2 })).toEqual({
      point: { x: 1, y: 2 },
      t: 0,
      distance: 5,
    })
  })

  it('slices a polyline by cumulative offset in either direction', () => {
    const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }]
    const cumulative = cumulativePolylineLengths(points)
    expect(pointAtPolylineOffset(points, cumulative, 15)).toEqual({ x: 10, y: 5 })
    expect(slicePolyline(points, cumulative, 5, 15)).toEqual([
      { x: 5, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ])
    expect(slicePolyline(points, cumulative, 15, 5)).toEqual([
      { x: 10, y: 5 },
      { x: 10, y: 0 },
      { x: 5, y: 0 },
    ])
  })
})

import type { Pt } from './types'

const EPSILON = 1e-9

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function polylineLength(points: readonly Pt[]): number {
  let length = 0
  for (let index = 1; index < points.length; index += 1) {
    length += dist(points[index - 1], points[index])
  }
  return length
}

export function projectToSegment(
  p: Pt,
  a: Pt,
  b: Pt,
): { point: Pt; t: number; distance: number } {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  const unclampedT = lengthSquared === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared
  const t = Math.max(0, Math.min(1, unclampedT))
  const point = { x: a.x + t * dx, y: a.y + t * dy }
  return { point, t, distance: dist(p, point) }
}

export function cumulativePolylineLengths(points: readonly Pt[]): number[] {
  const cumulative = Array.from({ length: points.length }, () => 0)
  for (let index = 1; index < points.length; index += 1) {
    cumulative[index] = cumulative[index - 1] + dist(points[index - 1], points[index])
  }
  return cumulative
}

export function interpolate(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

export function pointAtPolylineOffset(
  points: readonly Pt[],
  cumulativeLengths: readonly number[],
  offset: number,
): Pt | undefined {
  if (points.length === 0) return undefined
  if (points.length === 1) return { ...points[0] }

  const total = cumulativeLengths.at(-1) ?? 0
  const clamped = Math.max(0, Math.min(total, offset))
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = cumulativeLengths[index]
    const end = cumulativeLengths[index + 1]
    if (clamped <= end || index === points.length - 2) {
      const segmentLength = end - start
      const t = segmentLength <= EPSILON ? 0 : (clamped - start) / segmentLength
      return interpolate(points[index], points[index + 1], t)
    }
  }
  return { ...points[points.length - 1] }
}

/** Returns the section between two cumulative offsets, oriented start to end. */
export function slicePolyline(
  points: readonly Pt[],
  cumulativeLengths: readonly number[],
  startOffset: number,
  endOffset: number,
): Pt[] {
  if (points.length === 0) return []
  if (points.length === 1) return [{ ...points[0] }]

  const reverse = startOffset > endOffset
  const low = reverse ? endOffset : startOffset
  const high = reverse ? startOffset : endOffset
  const start = pointAtPolylineOffset(points, cumulativeLengths, low)
  const end = pointAtPolylineOffset(points, cumulativeLengths, high)
  if (!start || !end) return []

  const result = [start]
  for (let index = 1; index < points.length - 1; index += 1) {
    const offset = cumulativeLengths[index]
    if (offset > low + EPSILON && offset < high - EPSILON) result.push({ ...points[index] })
  }
  if (dist(result.at(-1) ?? start, end) > EPSILON || result.length === 1) result.push(end)
  return reverse ? result.reverse() : result
}

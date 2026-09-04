/**
 * The one tunable file for the speed model. See docs/DECISIONS.md D7.
 * Every number here is an ASSUMPTION until checked in-game.
 */
import type { Mode, RoadClass } from '../routing/types'

/**
 * Pywel is roughly 9.5 km across (secondary sources). The in-game full map frame
 * spans 5178 px on the old PowerPyx image, which is 0.97 canonical px per px on
 * the th.gl pyramid (D1), so the frame is about 5023 canonical px wide.
 */
export const METERS_PER_PIXEL = 9500 / 5023

/**
 * Travel speed in metres per second, per mode and road class.
 * Roads win whenever the road path is shorter than (main speed / offroad speed)
 * times the straight line.
 */
export const SPEED_MPS: Record<Mode, Record<RoadClass, number>> = {
  horse: { main: 11, sub: 9, offroad: 4 },
  foot: { main: 5.5, sub: 5.0, offroad: 2.8 },
}

/** Pin snapping: how far (image px) a pin may be from a road before it is off-road only. */
export const SNAP_RADIUS_PX = 300
/** Number of nearest road projections considered per pin. */
export const SNAP_CANDIDATES = 4
/** Dead-end connectors (D6): radius in image px for off-road arcs from degree-1 nodes. */
export const CONNECTOR_RADIUS_PX = 200
/** Dead-end connectors: max off-road arcs per degree-1 node. */
export const CONNECTOR_MAX = 3

/**
 * Water mask (D10). `data/water-mask.png` is greyscale, 255 = water, at half the
 * map resolution. A straight segment counts as crossing water only when at least
 * WATER_CROSS_MIN_SAMPLES consecutive samples land on water, so a single noisy
 * mask pixel does not block a connector or a pin-to-road leg.
 */
export const WATER_CROSS_MIN_SAMPLES = 2
/** Water mask: spacing between samples along a segment, in mask pixels. */
export const WATER_SAMPLE_STEP_MASK_PX = 1
/** Water mask: greyscale value at or above which a decoded pixel counts as water. */
export const WATER_THRESHOLD = 128

export const MODE_LABELS: Record<Mode, string> = { horse: 'Horse', foot: 'On foot' }
export const CLASS_LABELS: Record<RoadClass, string> = {
  main: 'Main road',
  sub: 'Sub road',
  offroad: 'Off-road',
}
/** Casing drawn under road pieces flagged `bridge` in the roads overlay (D5). */
export const BRIDGE_COLOR = '#4f8cff'
/** Route / overlay colours per class (also used by the legend). */
export const CLASS_COLORS: Record<RoadClass, string> = {
  main: '#ff7a1a',
  sub: '#ffd23f',
  offroad: '#9ca3af',
}

export function secondsFor(lengthPx: number, mode: Mode, cls: RoadClass): number {
  return (lengthPx * METERS_PER_PIXEL) / SPEED_MPS[mode][cls]
}

export function fastestSpeed(mode: Mode): number {
  return Math.max(...Object.values(SPEED_MPS[mode]))
}

/**
 * Land/water raster used to keep off-road travel out of rivers and the sea.
 * See docs/DECISIONS.md D10.
 *
 * The mask is a coarse grid over the map image: `scale` is mask pixels per
 * image pixel (0.5 for the committed half-resolution `data/water-mask.png`).
 * Pure and dependency-free (no DOM, no fs) so it runs in Node tests.
 */
import {
  WATER_CROSS_MIN_SAMPLES,
  WATER_SAMPLE_STEP_MASK_PX,
  WATER_THRESHOLD,
} from '../config/travel'
import type { Pt } from './types'

export interface WaterMaskInit {
  /** Mask width in mask pixels. */
  width: number
  /** Mask height in mask pixels. */
  height: number
  /** Mask pixels per image pixel. */
  scale: number
  /** One byte per mask pixel, row-major; non-zero means water. */
  data: Uint8Array
}

export class WaterMask {
  readonly width: number
  readonly height: number
  readonly scale: number
  readonly data: Uint8Array

  constructor(init: WaterMaskInit) {
    const { width, height, scale, data } = init
    if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
      throw new Error('WaterMask: width and height must be positive integers')
    }
    if (!Number.isFinite(scale) || scale <= 0) {
      throw new Error('WaterMask: scale must be a positive number')
    }
    if (data.length !== width * height) {
      throw new Error(`WaterMask: expected ${width * height} bytes, got ${data.length}`)
    }
    this.width = width
    this.height = height
    this.scale = scale
    this.data = data
  }

  /** True when the image-pixel point falls on a water mask pixel. Outside the mask is land. */
  isWater(pt: Pt): boolean {
    return this.isWaterMaskPoint(pt.x * this.scale, pt.y * this.scale)
  }

  /**
   * True when the straight segment a->b passes through water: sampled every
   * `WATER_SAMPLE_STEP_MASK_PX` mask pixels, at least `WATER_CROSS_MIN_SAMPLES`
   * consecutive samples must be water, so one noisy pixel does not count.
   */
  crosses(a: Pt, b: Pt): boolean {
    const ax = a.x * this.scale
    const ay = a.y * this.scale
    const dx = b.x * this.scale - ax
    const dy = b.y * this.scale - ay
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / WATER_SAMPLE_STEP_MASK_PX))
    let run = 0
    for (let index = 0; index <= steps; index += 1) {
      const t = index / steps
      if (this.isWaterMaskPoint(ax + dx * t, ay + dy * t)) {
        run += 1
        if (run >= WATER_CROSS_MIN_SAMPLES) return true
      } else {
        run = 0
      }
    }
    return false
  }

  private isWaterMaskPoint(maskX: number, maskY: number): boolean {
    const x = Math.floor(maskX)
    const y = Math.floor(maskY)
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false
    return this.data[y * this.width + x] !== 0
  }
}

/**
 * Pack decoded RGBA bytes into one 0/1 byte per pixel using the red channel
 * (the mask is greyscale, so any channel would do). Shared by the browser
 * loader and the Node test helper.
 */
export function waterBitsFromRgba(
  rgba: ArrayLike<number>,
  pixelCount: number,
  threshold: number = WATER_THRESHOLD,
): Uint8Array {
  if (rgba.length < pixelCount * 4) {
    throw new Error(`Water mask: expected ${pixelCount * 4} RGBA bytes, got ${rgba.length}`)
  }
  const bits = new Uint8Array(pixelCount)
  for (let index = 0; index < pixelCount; index += 1) {
    bits[index] = rgba[index * 4] >= threshold ? 1 : 0
  }
  return bits
}

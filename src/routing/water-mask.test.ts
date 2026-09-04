import { describe, expect, it } from 'vitest'
import { WATER_CROSS_MIN_SAMPLES } from '../config/travel'
import { WaterMask, waterBitsFromRgba } from './water-mask'

/**
 * `width` x `height` mask (scale 0.5, so one mask pixel covers 2 x 2 image px)
 * whose water columns are the half-open ranges in `waterColumns`.
 */
function columnMask(
  width: number,
  height: number,
  waterColumns: readonly number[],
  scale = 0.5,
): WaterMask {
  const data = new Uint8Array(width * height)
  for (let y = 0; y < height; y += 1) {
    for (const x of waterColumns) data[y * width + x] = 1
  }
  return new WaterMask({ width, height, scale, data })
}

describe('WaterMask', () => {
  it('reads water and land in image pixels through the scale', () => {
    const mask = columnMask(8, 8, [3, 4])

    // Mask columns 3 and 4 cover image x 6..9 at scale 0.5.
    expect(mask.isWater({ x: 6, y: 8 })).toBe(true)
    expect(mask.isWater({ x: 9, y: 8 })).toBe(true)
    expect(mask.isWater({ x: 5, y: 8 })).toBe(false)
    expect(mask.isWater({ x: 10, y: 8 })).toBe(false)
  })

  it('treats points outside the mask as land', () => {
    const mask = columnMask(8, 8, [3, 4])
    expect(mask.isWater({ x: -1, y: 8 })).toBe(false)
    expect(mask.isWater({ x: 8, y: -20 })).toBe(false)
    expect(mask.isWater({ x: 10_000, y: 8 })).toBe(false)
    expect(mask.crosses({ x: -100, y: -100 }, { x: -10, y: -100 })).toBe(false)
  })

  it('honours a scale other than one half', () => {
    const quarter = columnMask(8, 8, [3, 4], 0.25)
    // At scale 0.25 mask column 3 covers image x 12..15.
    expect(quarter.isWater({ x: 12, y: 16 })).toBe(true)
    expect(quarter.isWater({ x: 11, y: 16 })).toBe(false)
    expect(quarter.crosses({ x: 0, y: 16 }, { x: 32, y: 16 })).toBe(true)

    const full = columnMask(8, 8, [3, 4], 1)
    expect(full.isWater({ x: 3, y: 4 })).toBe(true)
    expect(full.isWater({ x: 6, y: 4 })).toBe(false)
  })

  it('reports a segment that runs through a river', () => {
    const mask = columnMask(8, 8, [3, 4])
    expect(mask.crosses({ x: 0, y: 8 }, { x: 16, y: 8 })).toBe(true)
  })

  it('reports no crossing for a segment that stays on land', () => {
    const mask = columnMask(8, 8, [3, 4])
    expect(mask.crosses({ x: 10, y: 0 }, { x: 15, y: 15 })).toBe(false)
  })

  it('ignores a single noisy water pixel but not two consecutive ones', () => {
    expect(WATER_CROSS_MIN_SAMPLES).toBe(2)
    const speck = columnMask(8, 8, [4])
    const river = columnMask(8, 8, [4, 5])
    const a = { x: 0, y: 8 }
    const b = { x: 16, y: 8 }

    expect(speck.isWater({ x: 8, y: 8 })).toBe(true)
    expect(speck.crosses(a, b)).toBe(false)
    expect(river.crosses(a, b)).toBe(true)
  })

  it('rejects a malformed mask', () => {
    expect(() => new WaterMask({ width: 0, height: 4, scale: 0.5, data: new Uint8Array(0) }))
      .toThrow('width and height must be positive integers')
    expect(() => new WaterMask({ width: 4, height: 4, scale: 0, data: new Uint8Array(16) }))
      .toThrow('scale must be a positive number')
    expect(() => new WaterMask({ width: 4, height: 4, scale: 0.5, data: new Uint8Array(4) }))
      .toThrow('expected 16 bytes, got 4')
  })
})

describe('waterBitsFromRgba', () => {
  it('packs the red channel into one bit per pixel', () => {
    const rgba = new Uint8Array([
      255, 255, 255, 255,
      0, 0, 0, 255,
      128, 128, 128, 255,
      127, 127, 127, 255,
    ])
    expect([...waterBitsFromRgba(rgba, 4)]).toEqual([1, 0, 1, 0])
    expect(() => waterBitsFromRgba(rgba, 5)).toThrow('expected 20 RGBA bytes, got 16')
  })
})

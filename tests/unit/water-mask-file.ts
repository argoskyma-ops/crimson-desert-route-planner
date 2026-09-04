/**
 * Node-side loader for `data/water-mask.png` (the browser uses
 * `src/lib/water-mask-loader.ts` instead). Returns null when the file is
 * missing so data-backed tests can skip gracefully.
 */
import { existsSync, readFileSync } from 'node:fs'
import { PNG } from 'pngjs'
import { WaterMask, waterBitsFromRgba } from '../../src/routing/water-mask'

export const WATER_MASK_PATH = 'data/water-mask.png'
/** The committed mask is half the map resolution. */
export const DEFAULT_WATER_MASK_SCALE = 0.5

export function loadWaterMaskFile(
  path: string = WATER_MASK_PATH,
  imageWidth?: number,
): WaterMask | null {
  if (!existsSync(path)) return null
  const png = PNG.sync.read(readFileSync(path))
  const scale = imageWidth && imageWidth > 0 ? png.width / imageWidth : DEFAULT_WATER_MASK_SCALE
  return new WaterMask({
    width: png.width,
    height: png.height,
    scale,
    data: waterBitsFromRgba(png.data, png.width * png.height),
  })
}

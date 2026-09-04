import { WaterMask, waterBitsFromRgba } from '../routing/water-mask'

export const WATER_MASK_URL = '/data/water-mask.png'
/** The committed mask is half the map resolution; used when the image size is unknown. */
export const DEFAULT_WATER_MASK_SCALE = 0.5

interface DecodedMask {
  width: number
  height: number
  data: ArrayLike<number>
}

/**
 * Fetch and decode `/data/water-mask.png` into a `WaterMask`.
 * A missing file (404) or a decode failure logs one warning and returns
 * `undefined`; the app then routes without water awareness.
 */
export async function loadWaterMask(
  imageSize?: readonly [number, number],
  url: string = WATER_MASK_URL,
): Promise<WaterMask | undefined> {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const decoded = await decodeMask(blob)
    const imageWidth = imageSize?.[0] ?? 0
    const scale = imageWidth > 0 ? decoded.width / imageWidth : DEFAULT_WATER_MASK_SCALE
    return new WaterMask({
      width: decoded.width,
      height: decoded.height,
      scale,
      data: waterBitsFromRgba(decoded.data, decoded.width * decoded.height),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`Water mask unavailable (${message}); routing will ignore water.`)
    return undefined
  }
}

async function decodeMask(blob: Blob): Promise<DecodedMask> {
  if (typeof createImageBitmap === 'function' && typeof OffscreenCanvas === 'function') {
    const bitmap = await createImageBitmap(blob)
    try {
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('no 2d context')
      ctx.drawImage(bitmap, 0, 0)
      const image = ctx.getImageData(0, 0, bitmap.width, bitmap.height)
      return { width: image.width, height: image.height, data: image.data }
    } finally {
      bitmap.close()
    }
  }
  return decodeWithImageElement(blob)
}

/** Fallback for browsers without OffscreenCanvas: an `Image` onto a DOM canvas. */
function decodeWithImageElement(blob: Blob): Promise<DecodedMask> {
  return new Promise<DecodedMask>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob)
    const image = new Image()
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) throw new Error('no 2d context')
        ctx.drawImage(image, 0, 0)
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
        resolve({ width: canvas.width, height: canvas.height, data: data.data })
      } catch (err) {
        reject(err instanceof Error ? err : new Error('image decode failed'))
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('image decode failed'))
    }
    image.src = objectUrl
  })
}

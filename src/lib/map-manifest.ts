/**
 * Tile pyramid manifest written by scripts/fetch-tiles.py. See docs/DECISIONS.md D1/D4.
 *
 * `width`/`height` are the canonical coordinate space (D3): the pixel grid of the
 * pyramid at `canonicalZoom`. Tiles above that zoom hold more than one CSS pixel per
 * canonical pixel. `bounds` is the explored window (Pywel) in canonical pixels; the
 * map fits and pans to it. `tileOrder` is the path order under `/data/map/tiles/`.
 */
export interface MapManifest {
  width: number
  height: number
  tileSize: number
  minZoom: number
  maxNativeZoom: number
  /** Zoom whose pixel grid is the canonical space; defaults to `maxNativeZoom`. */
  canonicalZoom: number
  format: 'jpg' | 'webp'
  tileOrder: 'zxy' | 'zyx'
  /** [x0, y0, x1, y1] in canonical pixels; defaults to the whole image. */
  bounds: [number, number, number, number]
  source: string
}

function isTuple4(value: unknown): value is [number, number, number, number] {
  return Array.isArray(value) && value.length === 4 && value.every((v) => typeof v === 'number')
}

/** Validate the raw JSON and fill the optional fields with their defaults. */
export function parseMapManifest(value: unknown): MapManifest | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  if (
    typeof v.width !== 'number' ||
    typeof v.height !== 'number' ||
    typeof v.tileSize !== 'number' ||
    typeof v.minZoom !== 'number' ||
    typeof v.maxNativeZoom !== 'number' ||
    (v.format !== 'jpg' && v.format !== 'webp') ||
    typeof v.source !== 'string'
  ) {
    return null
  }
  const canonicalZoom = typeof v.canonicalZoom === 'number' ? v.canonicalZoom : v.maxNativeZoom
  const tileOrder = v.tileOrder === 'zyx' ? 'zyx' : 'zxy'
  const bounds: [number, number, number, number] = isTuple4(v.bounds)
    ? v.bounds
    : [0, 0, v.width, v.height]
  return {
    width: v.width,
    height: v.height,
    tileSize: v.tileSize,
    minZoom: v.minZoom,
    maxNativeZoom: v.maxNativeZoom,
    canonicalZoom,
    format: v.format,
    tileOrder,
    bounds,
    source: v.source,
  }
}

/** Fetch `/data/map/manifest.json`. Returns null on 404 or parse/shape error. */
export async function loadMapManifest(): Promise<MapManifest | null> {
  try {
    const res = await fetch('/data/map/manifest.json')
    if (!res.ok) return null
    const data: unknown = await res.json()
    return parseMapManifest(data)
  } catch {
    return null
  }
}

/** Leaflet URL template for the pyramid. */
export function tileUrlTemplate(manifest: MapManifest): string {
  const order = manifest.tileOrder === 'zyx' ? '{z}/{y}/{x}' : '{z}/{x}/{y}'
  return `/data/map/tiles/${order}.${manifest.format}`
}

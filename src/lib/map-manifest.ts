/** Tile pyramid manifest written by scripts/build-tiles.py. See docs/DECISIONS.md D4. */
export interface MapManifest {
  width: number
  height: number
  tileSize: number
  minZoom: number
  maxNativeZoom: number
  format: 'jpg'
  source: string
}

function isMapManifest(value: unknown): value is MapManifest {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.width === 'number' &&
    typeof v.height === 'number' &&
    typeof v.tileSize === 'number' &&
    typeof v.minZoom === 'number' &&
    typeof v.maxNativeZoom === 'number' &&
    v.format === 'jpg' &&
    typeof v.source === 'string'
  )
}

/** Fetch `/data/map/manifest.json`. Returns null on 404 or parse/shape error. */
export async function loadMapManifest(): Promise<MapManifest | null> {
  try {
    const res = await fetch('/data/map/manifest.json')
    if (!res.ok) return null
    const data: unknown = await res.json()
    return isMapManifest(data) ? data : null
  } catch {
    return null
  }
}

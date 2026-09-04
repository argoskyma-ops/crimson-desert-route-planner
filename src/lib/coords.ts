import L from 'leaflet'
import type { Pt } from '../routing/types'

/**
 * Pixel CRS for canonical image coordinates (x right, y down). See D3.
 * At zoom == canonicalZoom, one canonical pixel == one CSS pixel; at the
 * pyramid's higher native zooms a canonical pixel spans several CSS pixels.
 */
export function makePixelCrs(canonicalZoom: number): L.CRS {
  const s = 1 / 2 ** canonicalZoom
  return L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(s, 0, s, 0),
  })
}

/** Image pixel -> Leaflet latlng (`L.latLng(y, x)`). */
export function toLatLng(pt: Pt): L.LatLng {
  return L.latLng(pt.y, pt.x)
}

/** Leaflet latlng -> image pixel. */
export function fromLatLng(ll: L.LatLng): Pt {
  return { x: ll.lng, y: ll.lat }
}

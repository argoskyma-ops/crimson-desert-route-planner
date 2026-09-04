import L from 'leaflet'
import type { Pt } from '../routing/types'

/**
 * Pixel CRS for native image coordinates (x right, y down). See D3.
 * At zoom == maxNativeZoom, one image pixel == one CSS pixel.
 */
export function makePixelCrs(maxNativeZoom: number): L.CRS {
  const s = 1 / 2 ** maxNativeZoom
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

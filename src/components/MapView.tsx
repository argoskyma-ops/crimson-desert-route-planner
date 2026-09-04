import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { makePixelCrs } from '../lib/coords'
import { loadMapManifest } from '../lib/map-manifest'
import { mapRef, useAppStore } from '../store'

const MISSING_TILES_MESSAGE =
  'Map tiles not found. Run scripts/fetch-map.sh then .venv/bin/python scripts/build-tiles.py'

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const setManifest = useAppStore((s) => s.setManifest)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let cancelled = false
    let map: L.Map | null = null

    void (async () => {
      const loaded = await loadMapManifest()
      if (cancelled) return
      setManifest(loaded)
      if (!loaded) {
        setMissing(true)
        return
      }

      const { width, height, tileSize, maxNativeZoom } = loaded
      const bounds = L.latLngBounds([0, 0], [height, width])
      const padX = width * 0.1
      const padY = height * 0.1
      const maxBounds = L.latLngBounds(
        [-padY, -padX],
        [height + padY, width + padX],
      )

      map = L.map(el, {
        crs: makePixelCrs(maxNativeZoom),
        preferCanvas: true,
        zoomControl: false,
        attributionControl: false,
        zoomSnap: 0.25,
        maxZoom: maxNativeZoom + 2,
        maxBounds,
      })
      L.control.zoom({ position: 'bottomright' }).addTo(map)
      map.fitBounds(bounds)
      map.setMinZoom(map.getZoom())

      L.tileLayer('/data/map/tiles/{z}/{x}/{y}.jpg', {
        tileSize,
        minZoom: 0,
        maxNativeZoom,
        maxZoom: maxNativeZoom + 2,
        bounds,
        noWrap: true,
      }).addTo(map)

      // Instance is also at mapRef.current in ../store for T2/T4/T6.
      mapRef.current = map
    })()

    return () => {
      cancelled = true
      mapRef.current = null
      map?.remove()
    }
  }, [setManifest])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {missing ? (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <p className="max-w-md text-center text-sm text-neutral-400">
            {MISSING_TILES_MESSAGE}
          </p>
        </div>
      ) : null}
    </div>
  )
}

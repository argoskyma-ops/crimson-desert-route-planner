import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { CLASS_COLORS } from '../config/travel'
import { fromLatLng, makePixelCrs, toLatLng } from '../lib/coords'
import { loadMapManifest } from '../lib/map-manifest'
import { makePinIcon } from '../lib/pin-icons'
import { ROAD_CLASSES, type Pt, type RoadClass, type RouteLeg } from '../routing/types'
import { mapRef, useAppStore } from '../store'

const MISSING_TILES_MESSAGE =
  'Map tiles not found. Run scripts/fetch-map.sh then .venv/bin/python scripts/build-tiles.py'

function clampToImage(pt: Pt, width: number, height: number): Pt {
  return {
    x: Math.min(Math.max(0, pt.x), width),
    y: Math.min(Math.max(0, pt.y), height),
  }
}

function addRouteLeg(group: L.LayerGroup, renderer: L.Renderer, leg: RouteLeg) {
  if (leg.points.length < 2) return
  const latlngs = leg.points.map(toLatLng)
  const dashed = leg.class === 'offroad' ? { dashArray: '6 8' } : {}
  L.polyline(latlngs, {
    color: '#ffffff',
    weight: 8,
    opacity: 0.9,
    interactive: false,
    renderer,
    ...dashed,
  }).addTo(group)
  L.polyline(latlngs, {
    color: CLASS_COLORS[leg.class],
    weight: 4,
    opacity: 1,
    interactive: false,
    renderer,
    ...dashed,
  }).addTo(group)
}

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<{ a: L.Marker | null; b: L.Marker | null }>({
    a: null,
    b: null,
  })
  const routeLayerRef = useRef<L.LayerGroup | null>(null)
  const roadsLayerRef = useRef<L.LayerGroup | null>(null)
  const rendererRef = useRef<L.Renderer | null>(null)
  const setManifest = useAppStore((s) => s.setManifest)
  const pinA = useAppStore((s) => s.pins.a)
  const pinB = useAppStore((s) => s.pins.b)
  const route = useAppStore((s) => s.route)
  const roads = useAppStore((s) => s.roads)
  const showRoads = useAppStore((s) => s.showRoads)
  const [missing, setMissing] = useState(false)
  const [mapReady, setMapReady] = useState(false)

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

      rendererRef.current = map.getRenderer(L.polyline([[0, 0], [1, 0]]))
      roadsLayerRef.current = L.layerGroup().addTo(map)
      routeLayerRef.current = L.layerGroup().addTo(map)

      map.on('click', (e: L.LeafletMouseEvent) => {
        const { editor, placePin, manifest } = useAppStore.getState()
        if (editor.active || !manifest) return
        placePin(clampToImage(fromLatLng(e.latlng), manifest.width, manifest.height))
      })

      mapRef.current = map
      setMapReady(true)
    })()

    return () => {
      cancelled = true
      setMapReady(false)
      markersRef.current.a?.remove()
      markersRef.current.b?.remove()
      markersRef.current = { a: null, b: null }
      routeLayerRef.current = null
      roadsLayerRef.current = null
      rendererRef.current = null
      mapRef.current = null
      map?.remove()
    }
  }, [setManifest])

  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current
    if (!map) return
    const manifest = useAppStore.getState().manifest
    if (!manifest) return

    const sync = (which: 'a' | 'b', pt: Pt | null) => {
      const markers = markersRef.current
      if (pt === null) {
        markers[which]?.remove()
        markers[which] = null
        return
      }
      const latlng = toLatLng(pt)
      if (!markers[which]) {
        const marker = L.marker(latlng, {
          icon: makePinIcon(which === 'a' ? 'A' : 'B'),
          draggable: true,
          autoPan: true,
        })
        marker.on('dragend', () => {
          const { setPin, manifest: m } = useAppStore.getState()
          if (!m) return
          const clamped = clampToImage(fromLatLng(marker.getLatLng()), m.width, m.height)
          marker.setLatLng(toLatLng(clamped))
          setPin(which, clamped)
        })
        marker.addTo(map)
        markers[which] = marker
      } else {
        markers[which].setLatLng(latlng)
      }
    }

    sync('a', pinA)
    sync('b', pinB)
  }, [mapReady, pinA, pinB])

  useEffect(() => {
    if (!mapReady) return
    const group = routeLayerRef.current
    const renderer = rendererRef.current
    if (!group || !renderer) return
    group.clearLayers()
    if (!route) return
    for (const leg of route.legs) {
      addRouteLeg(group, renderer, leg)
    }
  }, [mapReady, route])

  useEffect(() => {
    if (!mapReady) return
    const group = roadsLayerRef.current
    const renderer = rendererRef.current
    if (!group || !renderer) return
    group.clearLayers()
    if (!showRoads || !roads) return

    const latlngsByClass: Record<RoadClass, L.LatLng[][]> = {
      main: [],
      sub: [],
      offroad: [],
    }
    for (const edge of roads.edges) {
      if (edge.points.length < 2) continue
      latlngsByClass[edge.class].push(edge.points.map(([x, y]) => toLatLng({ x, y })))
    }
    for (const cls of ROAD_CLASSES) {
      const lines = latlngsByClass[cls]
      if (lines.length === 0) continue
      L.polyline(lines, {
        color: CLASS_COLORS[cls],
        weight: 2,
        opacity: 0.6,
        interactive: false,
        renderer,
      }).addTo(group)
    }
  }, [mapReady, roads, showRoads])

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

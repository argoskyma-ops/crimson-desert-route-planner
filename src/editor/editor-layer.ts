import L from 'leaflet'
import { CLASS_COLORS } from '../config/travel'
import { findEdge, type DraftPoint } from './graph-edit'
import { fromLatLng, toLatLng } from '../lib/coords'
import { snapToRoads } from '../routing/snap'
import type { Pt } from '../routing/types'
import { useAppStore } from '../store'

/** D8: tap within 12 CSS px of a node snaps to it. */
export const NODE_SNAP_CSS_PX = 12
/** D8: tap within 10 CSS px of an edge projects onto it (and splits on finish). */
export const EDGE_SNAP_CSS_PX = 10

const VERTEX_RADIUS = 4
const SNAP_RADIUS = 8
const NODE_HANDLE_PX = 22
const INTERIOR_VERTEX_RADIUS = 3

function cssPixelsPerImagePixel(map: L.Map): number {
  const origin = map.latLngToContainerPoint(toLatLng({ x: 0, y: 0 }))
  const oneX = map.latLngToContainerPoint(toLatLng({ x: 1, y: 0 }))
  return origin.distanceTo(oneX)
}

function clampToManifest(pt: Pt): Pt {
  const manifest = useAppStore.getState().manifest
  if (!manifest) return pt
  return {
    x: Math.min(Math.max(0, pt.x), manifest.width),
    y: Math.min(Math.max(0, pt.y), manifest.height),
  }
}

function nearestNode(map: L.Map, pt: Pt, maxCss: number): { id: string; pt: Pt } | null {
  const { roads } = useAppStore.getState()
  if (!roads) return null
  const clickCss = map.latLngToContainerPoint(toLatLng(pt))
  let best: { id: string; pt: Pt; distance: number } | null = null
  for (const node of roads.nodes) {
    const distance = clickCss.distanceTo(map.latLngToContainerPoint(toLatLng(node)))
    if (distance > maxCss) continue
    if (!best || distance < best.distance || (distance === best.distance && node.id < best.id)) {
      best = { id: node.id, pt: { x: node.x, y: node.y }, distance }
    }
  }
  return best ? { id: best.id, pt: best.pt } : null
}

interface EdgeHit {
  edgeId: string
  segmentIndex: number
  t: number
  point: Pt
}

function nearestEdge(map: L.Map, pt: Pt, maxCss: number): EdgeHit | null {
  const { graph } = useAppStore.getState()
  if (!graph) return null
  const scale = cssPixelsPerImagePixel(map)
  if (!(scale > 0)) return null
  const clickCss = map.latLngToContainerPoint(toLatLng(pt))
  const candidates = snapToRoads(graph, pt, 4, maxCss / scale)
  let best: (EdgeHit & { distance: number }) | null = null
  for (const candidate of candidates) {
    const distance = clickCss.distanceTo(map.latLngToContainerPoint(toLatLng(candidate.point)))
    if (distance > maxCss) continue
    if (
      !best ||
      distance < best.distance ||
      (distance === best.distance && candidate.edgeId < best.edgeId)
    ) {
      best = {
        edgeId: candidate.edgeId,
        segmentIndex: candidate.segmentIndex,
        t: candidate.t,
        point: candidate.point,
        distance,
      }
    }
  }
  if (!best) return null
  return { edgeId: best.edgeId, segmentIndex: best.segmentIndex, t: best.t, point: best.point }
}

/** Node snap wins, else edge projection, else the raw (clamped) point. */
export function snapDraftPoint(map: L.Map, raw: Pt): DraftPoint {
  const pt = clampToManifest(raw)
  const node = nearestNode(map, pt, NODE_SNAP_CSS_PX)
  if (node) return { pt: node.pt, snap: { nodeId: node.id } }
  const edge = nearestEdge(map, pt, EDGE_SNAP_CSS_PX)
  if (edge) {
    return {
      pt: edge.point,
      snap: { edgeId: edge.edgeId, segmentIndex: edge.segmentIndex, t: edge.t },
    }
  }
  return { pt }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/**
 * Leaflet draw/select overlay. MapView attaches this while `editor.active` is true
 * so pin-placement stays on the map click handler (which no-ops in editor mode).
 */
export function attachEditorLayer(map: L.Map): () => void {
  const group = L.layerGroup().addTo(map)
  const renderer = map.getRenderer(L.polyline([[0, 0], [1, 0]]))
  const hadDoubleClickZoom = map.doubleClickZoom.enabled()
  map.doubleClickZoom.disable()

  let hover: DraftPoint | null = null
  let draggingNode = false

  const syncCursor = () => {
    const { editor } = useAppStore.getState()
    map.getContainer().style.cursor = editor.tool === 'draw' ? 'crosshair' : 'pointer'
  }

  const redraw = () => {
    if (draggingNode) return
    group.clearLayers()
    const { editor, roads } = useAppStore.getState()
    const color = CLASS_COLORS[editor.newEdgeClass]

    if (editor.selectedEdgeId && roads) {
      const edge = findEdge(roads, editor.selectedEdgeId)
      if (edge && edge.points.length >= 2) {
        const latlngs = edge.points.map(([x, y]) => toLatLng({ x, y }))
        L.polyline(latlngs, {
          color: '#ffffff',
          weight: 8,
          opacity: 0.9,
          interactive: false,
          renderer,
        }).addTo(group)
        L.polyline(latlngs, {
          color: CLASS_COLORS[edge.class],
          weight: 4,
          opacity: 1,
          interactive: false,
          renderer,
        }).addTo(group)

        if (editor.tool === 'select') {
          for (let index = 1; index < edge.points.length - 1; index += 1) {
            const [x, y] = edge.points[index]
            L.circleMarker(toLatLng({ x, y }), {
              radius: INTERIOR_VERTEX_RADIUS,
              color: '#ffffff',
              weight: 1,
              fillColor: CLASS_COLORS[edge.class],
              fillOpacity: 1,
              interactive: false,
              renderer,
            }).addTo(group)
          }

          const seen = new Set<string>()
          for (const nodeId of [edge.from, edge.to]) {
            if (seen.has(nodeId)) continue
            seen.add(nodeId)
            const node = roads.nodes.find((item) => item.id === nodeId)
            if (!node) continue
            const marker = L.marker(toLatLng({ x: node.x, y: node.y }), {
              draggable: true,
              autoPan: true,
              keyboard: false,
              zIndexOffset: 1200,
              icon: L.divIcon({
                className: '',
                iconSize: [NODE_HANDLE_PX, NODE_HANDLE_PX],
                iconAnchor: [NODE_HANDLE_PX / 2, NODE_HANDLE_PX / 2],
                html: `<div style="width:${NODE_HANDLE_PX}px;height:${NODE_HANDLE_PX}px;box-sizing:border-box;border-radius:9999px;border:2px solid #fff;background:#fbbf24"></div>`,
              }),
            })
            marker.on('click', (ev) => {
              L.DomEvent.stop(ev)
            })
            marker.on('dragstart', () => {
              draggingNode = true
            })
            marker.on('dragend', () => {
              const pt = clampToManifest(fromLatLng(marker.getLatLng()))
              marker.setLatLng(toLatLng(pt))
              draggingNode = false
              useAppStore.getState().moveNode(node.id, pt)
            })
            marker.addTo(group)
            const el = marker.getElement()
            if (el) L.DomEvent.disableClickPropagation(el)
          }
        }
      }
    }

    const draft = editor.draftPoints
    if (draft.length >= 2) {
      L.polyline(
        draft.map((point) => toLatLng(point.pt)),
        { color, weight: 4, opacity: 1, interactive: false, renderer },
      ).addTo(group)
    }
    for (let index = 0; index < draft.length; index += 1) {
      const point = draft[index]
      const highlight = Boolean(point.snap) && index === draft.length - 1
      L.circleMarker(toLatLng(point.pt), {
        radius: highlight ? SNAP_RADIUS : VERTEX_RADIUS,
        color: '#ffffff',
        weight: 1,
        fillColor: color,
        fillOpacity: 1,
        interactive: false,
        renderer,
      }).addTo(group)
    }

    if (editor.tool === 'draw' && hover) {
      const last = draft.at(-1)
      if (last) {
        L.polyline([toLatLng(last.pt), toLatLng(hover.pt)], {
          color,
          weight: 3,
          opacity: 0.55,
          dashArray: '4 6',
          interactive: false,
          renderer,
        }).addTo(group)
      }
      L.circleMarker(toLatLng(hover.pt), {
        radius: hover.snap ? SNAP_RADIUS : VERTEX_RADIUS,
        color: '#ffffff',
        weight: 2,
        fillColor: color,
        fillOpacity: hover.snap ? 0.9 : 0.35,
        interactive: false,
        renderer,
      }).addTo(group)
    }
  }

  const onClick = (e: L.LeafletMouseEvent) => {
    const { editor, addDraftPoint, selectEdge } = useAppStore.getState()
    if (!editor.active) return
    if (editor.tool === 'draw') {
      addDraftPoint(snapDraftPoint(map, fromLatLng(e.latlng)))
      hover = null
      redraw()
      return
    }
    const pt = clampToManifest(fromLatLng(e.latlng))
    const edge = nearestEdge(map, pt, EDGE_SNAP_CSS_PX)
    selectEdge(edge?.edgeId ?? null)
  }

  const onMove = (e: L.LeafletMouseEvent) => {
    const { editor } = useAppStore.getState()
    if (!editor.active || editor.tool !== 'draw') {
      if (hover) {
        hover = null
        redraw()
      }
      return
    }
    hover = snapDraftPoint(map, fromLatLng(e.latlng))
    redraw()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (isTypingTarget(e.target)) return
    const { editor, finishDraft, cancelDraft, undoDraftPoint, selectEdge } = useAppStore.getState()
    if (!editor.active) return
    if (e.key === 'Enter') {
      e.preventDefault()
      finishDraft()
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      if (editor.draftPoints.length > 0) cancelDraft()
      else selectEdge(null)
      return
    }
    if (e.key === 'Backspace') {
      e.preventDefault()
      undoDraftPoint()
    }
  }

  map.on('click', onClick)
  map.on('mousemove', onMove)
  window.addEventListener('keydown', onKeyDown)
  const unsub = useAppStore.subscribe(() => {
    syncCursor()
    redraw()
  })
  syncCursor()
  redraw()

  return () => {
    unsub()
    map.off('click', onClick)
    map.off('mousemove', onMove)
    window.removeEventListener('keydown', onKeyDown)
    group.remove()
    map.getContainer().style.cursor = ''
    if (hadDoubleClickZoom) map.doubleClickZoom.enable()
  }
}

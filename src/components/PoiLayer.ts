import L from 'leaflet'
import {
  isPoiCheckable,
  poiGroupColor,
  poiProgressKey,
  POI_CLUSTER_BELOW_ZOOM,
  POI_CLUSTER_CELL_CSS_PX,
  POI_DISC_RADIUS_CSS_PX,
  POI_FOCUS_RADIUS_CSS_PX,
  POI_HIT_RADIUS_CSS_PX,
} from '../config/pois'
import {
  clusterPois,
  poiGroupOf,
  visiblePois,
  type PoiCluster,
  type PoiIndex,
} from '../content/poi-index'
import type { PoiFile, PoiNode } from '../content/pois-loader'
import { fromLatLng, toLatLng } from '../lib/coords'
import { useAppStore } from '../store'

const BADGE_SIDE_CSS_PX = 38

type ClusterCache = {
  zoom: number
  groups: Record<string, boolean>
  index: PoiIndex
  cellSize: number
  clusters: PoiCluster[]
}

type PoiLayer = {
  clusterCache: ClusterCache | null
  collectedSet: Set<string>
  lastCollected: string[] | null
  filled: Map<string, PoiNode[]>
  hollow: Map<string, PoiNode[]>
  ctx: CanvasRenderingContext2D | null
  lastDpr: number
  lastCssWidth: number
  lastCssHeight: number
}

let activeLayer: PoiLayer | null = null

function cssPixelsPerImagePixel(map: L.Map): number {
  const origin = map.project(toLatLng({ x: 0, y: 0 }))
  const oneX = map.project(toLatLng({ x: 1, y: 0 }))
  return oneX.x - origin.x
}

function formatClusterCount(count: number): string {
  if (count < 1000) return String(count)
  const tenths = Math.round(count / 100) / 10
  return Number.isInteger(tenths) ? `${tenths}k` : `${tenths.toFixed(1)}k`
}

function labelsFor(index: PoiIndex | null, node: PoiNode): { typeLabel: string; groupLabel: string } {
  const found = index?.labels.get(node.type)
  if (found) return { typeLabel: found.type, groupLabel: found.group }
  return { typeLabel: node.type, groupLabel: '' }
}

function ensureClusterCache(
  layer: PoiLayer,
  pois: PoiFile,
  poiIndex: PoiIndex,
  poiGroups: Record<string, boolean>,
  zoom: number,
  cellSize: number,
): PoiCluster[] {
  const cache = layer.clusterCache
  if (
    cache &&
    cache.zoom === zoom &&
    cache.groups === poiGroups &&
    cache.index === poiIndex &&
    cache.cellSize === cellSize
  ) {
    return cache.clusters
  }
  const clusters = clusterPois(
    poiIndex,
    poiGroups,
    { x0: 0, y0: 0, x1: pois.imageSize[0], y1: pois.imageSize[1] },
    cellSize,
  )
  layer.clusterCache = { zoom, groups: poiGroups, index: poiIndex, cellSize, clusters }
  return clusters
}

function clearBucketLists(buckets: Map<string, PoiNode[]>): void {
  for (const list of buckets.values()) list.length = 0
}

let poiPopup: L.Popup | null = null
let poiPopupNodeId: string | null = null

export function isPoiPopupOpen(): boolean {
  return poiPopup !== null
}

export function closePoiPopup(map: L.Map): void {
  const popup = poiPopup
  poiPopup = null
  poiPopupNodeId = null
  if (popup) {
    map.closePopup(popup)
  }
  if (useAppStore.getState().focusedPoiId !== null) {
    useAppStore.getState().focusPoi(null)
  }
}

function buildPopupContent(node: PoiNode): HTMLElement {
  const { poiIndex, progress, toggleCollectedDone } = useAppStore.getState()
  const { typeLabel, groupLabel } = labelsFor(poiIndex, node)
  const groupId = poiIndex ? poiGroupOf(poiIndex, node) : null
  const checkable = groupId !== null && isPoiCheckable(node.type, groupId)
  const key = poiProgressKey(node.id)

  const root = document.createElement('div')
  root.style.minWidth = '11rem'

  const title = document.createElement('strong')
  title.textContent = node.name ?? typeLabel
  root.appendChild(title)

  const line = document.createElement('div')
  line.textContent = node.name ? `${typeLabel} · ${groupLabel}` : groupLabel
  line.style.marginTop = '2px'
  line.style.fontSize = '12px'
  line.style.color = '#525252'
  root.appendChild(line)

  if (checkable) {
    const button = document.createElement('button')
    button.type = 'button'
    const collected = progress.collected.includes(key)
    button.textContent = collected ? 'Collected ✓' : 'Mark collected'
    button.setAttribute('aria-pressed', collected ? 'true' : 'false')
    button.style.display = 'block'
    button.style.width = '100%'
    button.style.minHeight = '44px'
    button.style.marginTop = '8px'
    button.style.borderRadius = '8px'
    button.style.border = '1px solid rgba(255,255,255,0.1)'
    button.style.background = '#262626'
    button.style.color = '#f5f5f5'
    button.style.fontSize = '14px'
    button.style.fontWeight = '500'
    button.style.cursor = 'pointer'
    L.DomEvent.on(button, 'click', (event) => {
      L.DomEvent.stop(event)
      toggleCollectedDone(key)
      const now = useAppStore.getState().progress.collected.includes(key)
      button.textContent = now ? 'Collected ✓' : 'Mark collected'
      button.setAttribute('aria-pressed', now ? 'true' : 'false')
    })
    root.appendChild(button)
  }

  return root
}

export function openPoiPopup(map: L.Map, node: PoiNode): void {
  if (poiPopupNodeId === node.id && poiPopup) {
    useAppStore.getState().focusPoi(node.id)
    return
  }
  closePoiPopup(map)

  const popup = L.popup({ maxWidth: 260, autoPan: true, closeOnClick: false })
  popup.setLatLng(toLatLng(node))
  popup.setContent(buildPopupContent(node))
  popup.on('remove', () => {
    if (poiPopup !== popup) return
    poiPopup = null
    poiPopupNodeId = null
    useAppStore.getState().focusPoi(null)
  })
  poiPopup = popup
  poiPopupNodeId = node.id
  popup.openOn(map)
  useAppStore.getState().focusPoi(node.id)
}

export function poiHitTest(map: L.Map, latlng: L.LatLng): PoiNode | null {
  if (map.getZoom() < POI_CLUSTER_BELOW_ZOOM) return null
  const { poiIndex, poiGroups, pois, editor } = useAppStore.getState()
  if (!poiIndex || !pois || editor.active) return null
  const scale = cssPixelsPerImagePixel(map)
  if (!(scale > 0)) return null
  const pt = fromLatLng(latlng)
  const pad = POI_HIT_RADIUS_CSS_PX / scale
  const candidates = visiblePois(poiIndex, poiGroups, {
    x0: pt.x - pad,
    y0: pt.y - pad,
    x1: pt.x + pad,
    y1: pt.y + pad,
  })
  const click = map.latLngToContainerPoint(latlng)
  let best: PoiNode | null = null
  let bestDist = POI_HIT_RADIUS_CSS_PX
  for (const node of candidates) {
    const dist = click.distanceTo(map.latLngToContainerPoint(toLatLng(node)))
    if (dist <= bestDist) {
      best = node
      bestDist = dist
    }
  }
  return best
}

export function poiClusterHitTest(map: L.Map, latlng: L.LatLng): { x: number; y: number } | null {
  if (map.getZoom() >= POI_CLUSTER_BELOW_ZOOM) return null
  const layer = activeLayer
  if (!layer) return null
  const { poiIndex, poiGroups, pois, editor } = useAppStore.getState()
  if (!poiIndex || !pois || editor.active) return null
  const scale = cssPixelsPerImagePixel(map)
  if (!(scale > 0)) return null
  const cellSize = POI_CLUSTER_CELL_CSS_PX / scale
  const clusters = ensureClusterCache(layer, pois, poiIndex, poiGroups, map.getZoom(), cellSize)
  const click = map.latLngToContainerPoint(latlng)
  let best: { x: number; y: number } | null = null
  let bestDist = POI_HIT_RADIUS_CSS_PX
  for (const cluster of clusters) {
    const dist = click.distanceTo(map.latLngToContainerPoint(toLatLng(cluster)))
    if (dist <= bestDist) {
      best = { x: cluster.x, y: cluster.y }
      bestDist = dist
    }
  }
  return best
}

function drawDiscs(
  ctx: CanvasRenderingContext2D,
  nodes: PoiNode[],
  topLeft: { x: number; y: number },
  scale: number,
  fill: string,
  stroke: string,
  radius: number,
): void {
  if (nodes.length === 0) return
  ctx.beginPath()
  for (const node of nodes) {
    const sx = (node.x - topLeft.x) * scale
    const sy = (node.y - topLeft.y) * scale
    ctx.moveTo(sx + radius, sy)
    ctx.arc(sx, sy, radius, 0, Math.PI * 2)
  }
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = stroke
  ctx.lineWidth = 1
  ctx.stroke()
}

function paint(
  ctx: CanvasRenderingContext2D,
  map: L.Map,
  size: L.Point,
  layer: PoiLayer,
): void {
  ctx.clearRect(0, 0, size.x, size.y)
  const { pois, poiIndex, poiGroups, focusedPoiId, progress, editor } = useAppStore.getState()
  if (!pois || !poiIndex || editor.active) return
  const scale = cssPixelsPerImagePixel(map)
  if (!(scale > 0)) return

  const topLeft = fromLatLng(map.containerPointToLatLng([0, 0]))
  const bottomRight = fromLatLng(map.containerPointToLatLng(size))
  const x0 = Math.min(topLeft.x, bottomRight.x)
  const y0 = Math.min(topLeft.y, bottomRight.y)
  const x1 = Math.max(topLeft.x, bottomRight.x)
  const y1 = Math.max(topLeft.y, bottomRight.y)
  const zoom = map.getZoom()

  if (zoom < POI_CLUSTER_BELOW_ZOOM) {
    const cellSize = POI_CLUSTER_CELL_CSS_PX / scale
    const pad = cellSize
    const clusters = ensureClusterCache(layer, pois, poiIndex, poiGroups, zoom, cellSize)
    const side = BADGE_SIDE_CSS_PX
    const radius = Math.min(6, side * 0.2)
    ctx.font = 'bold 11px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const cluster of clusters) {
      if (
        cluster.x < x0 - pad ||
        cluster.x > x1 + pad ||
        cluster.y < y0 - pad ||
        cluster.y > y1 + pad
      ) {
        continue
      }
      const sx = (cluster.x - topLeft.x) * scale
      const sy = (cluster.y - topLeft.y) * scale
      const color = poiGroupColor(cluster.groupId)
      ctx.beginPath()
      ctx.roundRect(sx - side / 2, sy - side / 2, side, side, radius)
      ctx.globalAlpha = 0.35
      ctx.fillStyle = color
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.stroke()
      const label = formatClusterCount(cluster.count)
      ctx.lineJoin = 'round'
      ctx.lineWidth = 3
      ctx.strokeStyle = 'rgba(0,0,0,0.75)'
      ctx.strokeText(label, sx, sy)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(label, sx, sy)
    }
    return
  }

  if (layer.lastCollected !== progress.collected) {
    layer.lastCollected = progress.collected
    layer.collectedSet = new Set(progress.collected)
  }
  const collected = layer.collectedSet
  const filled = layer.filled
  const hollow = layer.hollow
  clearBucketLists(filled)
  clearBucketLists(hollow)

  const pad = POI_FOCUS_RADIUS_CSS_PX / scale
  const nodes = visiblePois(poiIndex, poiGroups, {
    x0: x0 - pad,
    y0: y0 - pad,
    x1: x1 + pad,
    y1: y1 + pad,
  })
  let focused: PoiNode | null = null
  let focusedGroup: string | null = null
  for (const node of nodes) {
    const groupId = poiGroupOf(poiIndex, node)
    if (groupId === null) continue
    if (node.id === focusedPoiId) {
      focused = node
      focusedGroup = groupId
      continue
    }
    const checkable = isPoiCheckable(node.type, groupId)
    const isCollected = checkable && collected.has(poiProgressKey(node.id))
    const bucket = isCollected ? hollow : filled
    const list = bucket.get(groupId)
    if (list) list.push(node)
    else bucket.set(groupId, [node])
  }

  const groupOrder = pois.groups.map((group) => group.id)
  for (const groupId of groupOrder) {
    const color = poiGroupColor(groupId)
    drawDiscs(
      ctx,
      filled.get(groupId) ?? [],
      topLeft,
      scale,
      color,
      'rgba(0,0,0,0.6)',
      POI_DISC_RADIUS_CSS_PX,
    )
    drawDiscs(
      ctx,
      hollow.get(groupId) ?? [],
      topLeft,
      scale,
      'rgba(0,0,0,0.35)',
      color,
      POI_DISC_RADIUS_CSS_PX,
    )
  }

  if (focused && focusedGroup) {
    const sx = (focused.x - topLeft.x) * scale
    const sy = (focused.y - topLeft.y) * scale
    const color = poiGroupColor(focusedGroup)
    const isCollected =
      isPoiCheckable(focused.type, focusedGroup) && collected.has(poiProgressKey(focused.id))
    ctx.beginPath()
    ctx.arc(sx, sy, POI_FOCUS_RADIUS_CSS_PX, 0, Math.PI * 2)
    ctx.fillStyle = isCollected ? 'rgba(0,0,0,0.35)' : color
    ctx.fill()
    ctx.strokeStyle = isCollected ? color : 'rgba(0,0,0,0.6)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(sx, sy, POI_FOCUS_RADIUS_CSS_PX, 0, Math.PI * 2)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()
  }
}

/**
 * Canvas POI overlay. MapView attaches this once the map is ready; the layer
 * reads the store itself and never creates a DOM marker per node.
 */
export function attachPoiLayer(map: L.Map): () => void {
  let pane = map.getPane('pois')
  if (!pane) {
    pane = map.createPane('pois')
    pane.style.zIndex = '440'
  }

  const canvas = document.createElement('canvas')
  canvas.className = 'leaflet-zoom-hide'
  canvas.style.pointerEvents = 'none'
  canvas.style.position = 'absolute'
  canvas.style.left = '0'
  canvas.style.top = '0'
  pane.appendChild(canvas)

  const layer: PoiLayer = {
    clusterCache: null,
    collectedSet: new Set(),
    lastCollected: null,
    filled: new Map(),
    hollow: new Map(),
    ctx: null,
    lastDpr: 0,
    lastCssWidth: 0,
    lastCssHeight: 0,
  }
  activeLayer = layer

  let raf = 0
  let disposed = false

  const ensureSize = (): { ctx: CanvasRenderingContext2D; size: L.Point } | null => {
    const size = map.getSize()
    const dpr = window.devicePixelRatio || 1
    if (
      layer.ctx &&
      layer.lastDpr === dpr &&
      layer.lastCssWidth === size.x &&
      layer.lastCssHeight === size.y
    ) {
      return { ctx: layer.ctx, size }
    }
    const width = Math.round(size.x * dpr)
    const height = Math.round(size.y * dpr)
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    canvas.style.width = `${size.x}px`
    canvas.style.height = `${size.y}px`
    const ctx = layer.ctx ?? canvas.getContext('2d')
    if (!ctx) return null
    layer.ctx = ctx
    layer.lastDpr = dpr
    layer.lastCssWidth = size.x
    layer.lastCssHeight = size.y
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return { ctx, size }
  }

  const draw = () => {
    if (disposed) return
    const ready = ensureSize()
    if (!ready) return
    paint(ready.ctx, map, ready.size, layer)
  }

  const requestRedraw = () => {
    if (raf !== 0 || disposed) return
    raf = requestAnimationFrame(() => {
      raf = 0
      draw()
    })
  }

  const repositionAndRedraw = () => {
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]))
    requestRedraw()
  }

  const onResize = () => {
    ensureSize()
    repositionAndRedraw()
  }

  const unsub = useAppStore.subscribe((state, prev) => {
    if (
      state.pois === prev.pois &&
      state.poiIndex === prev.poiIndex &&
      state.poiGroups === prev.poiGroups &&
      state.focusedPoiId === prev.focusedPoiId &&
      state.progress.collected === prev.progress.collected &&
      state.editor.active === prev.editor.active
    ) {
      return
    }
    if (state.editor.active || state.pois === null || state.poiIndex === null) {
      closePoiPopup(map)
      requestRedraw()
      return
    }
    if (state.poiGroups !== prev.poiGroups && state.focusedPoiId !== null) {
      const node = state.poiIndex.byId.get(state.focusedPoiId)
      const groupId = node ? poiGroupOf(state.poiIndex, node) : null
      if (groupId === null || state.poiGroups[groupId] !== true) {
        closePoiPopup(map)
      }
    }
    if (state.focusedPoiId === null && isPoiPopupOpen()) {
      closePoiPopup(map)
    }
    if (state.focusedPoiId !== prev.focusedPoiId && state.focusedPoiId !== null) {
      if (poiPopupNodeId !== state.focusedPoiId) {
        const node = state.poiIndex.byId.get(state.focusedPoiId)
        if (node) openPoiPopup(map, node)
      }
    }
    requestRedraw()
  })

  map.on('move', repositionAndRedraw)
  map.on('zoomend', repositionAndRedraw)
  map.on('viewreset', repositionAndRedraw)
  map.on('resize', onResize)
  const initial = useAppStore.getState()
  if (initial.focusedPoiId && initial.poiIndex) {
    const node = initial.poiIndex.byId.get(initial.focusedPoiId)
    if (node) openPoiPopup(map, node)
  }
  repositionAndRedraw()

  return () => {
    disposed = true
    unsub()
    map.off('move', repositionAndRedraw)
    map.off('zoomend', repositionAndRedraw)
    map.off('viewreset', repositionAndRedraw)
    map.off('resize', onResize)
    if (raf !== 0) cancelAnimationFrame(raf)
    closePoiPopup(map)
    canvas.remove()
    if (activeLayer === layer) activeLayer = null
  }
}

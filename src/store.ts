import type { Map as LeafletMap } from 'leaflet'
import { create } from 'zustand'
import type { MapManifest } from './lib/map-manifest'
import { emptyRoads } from './lib/roads-loader'
import { buildGraph, findRoute, type RoadGraph } from './routing'
import type { Mode, Pt, RoadClass, RoadsFile, Route } from './routing/types'

/**
 * Leaflet map instance created by MapView. T4/T6 read `mapRef.current`.
 * Module-level (not Zustand state) so assigning it does not re-render subscribers.
 * Null when the map is unmounted or the manifest is missing.
 */
export const mapRef: { current: LeafletMap | null } = { current: null }

const FALLBACK_IMAGE_SIZE: [number, number] = [5178, 5240]

function clampPin(pt: Pt, manifest: MapManifest | null): Pt {
  if (!manifest) return pt
  return {
    x: Math.min(Math.max(0, pt.x), manifest.width),
    y: Math.min(Math.max(0, pt.y), manifest.height),
  }
}

function imageSizeFor(s: { manifest: MapManifest | null }): [number, number] {
  return s.manifest ? [s.manifest.width, s.manifest.height] : FALLBACK_IMAGE_SIZE
}

/** Rebuild the A–B route. Editor tasks should call this after graph edits that skip `setRoads`. */
export function recomputeRoute(s: {
  graph: RoadGraph | null
  pins: { a: Pt | null; b: Pt | null }
  mode: Mode
}): Route | null {
  if (s.graph === null || s.pins.a === null || s.pins.b === null) return null
  return findRoute(s.graph, s.pins.a, s.pins.b, { mode: s.mode })
}

function applyRoads(
  s: { manifest: MapManifest | null },
  roads: RoadsFile | null,
  error?: string | null,
): { roads: RoadsFile | null; graph: RoadGraph | null; roadsError: string | null } {
  if (roads === null) {
    return {
      roads: null,
      graph: buildGraph(emptyRoads(imageSizeFor(s))),
      roadsError: error ?? 'No roads.json found',
    }
  }
  try {
    return { roads, graph: buildGraph(roads), roadsError: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to build road graph'
    return {
      roads,
      graph: buildGraph(emptyRoads(roads.imageSize)),
      roadsError: message,
    }
  }
}

export interface EditorState {
  active: boolean
  tool: 'draw' | 'select'
  selectedEdgeId: string | null
  draftPoints: Pt[]
  newEdgeClass: RoadClass
  dirty: boolean
}

interface AppState {
  pins: { a: Pt | null; b: Pt | null }
  mode: Mode
  roads: RoadsFile | null
  graph: RoadGraph | null
  roadsError: string | null
  route: Route | null
  showRoads: boolean
  manifest: MapManifest | null
  editor: EditorState
  setPin: (which: 'a' | 'b', pt: Pt | null) => void
  placePin: (pt: Pt) => void
  clearPins: () => void
  setMode: (mode: Mode) => void
  setRoads: (roads: RoadsFile | null, error?: string | null) => void
  setRoute: (route: Route | null) => void
  toggleShowRoads: () => void
  setManifest: (manifest: MapManifest | null) => void
  setEditor: (partial: Partial<EditorState>) => void
}

const initialEditor: EditorState = {
  active: false,
  tool: 'draw',
  selectedEdgeId: null,
  draftPoints: [],
  newEdgeClass: 'main',
  dirty: false,
}

export const useAppStore = create<AppState>((set) => ({
  pins: { a: null, b: null },
  mode: 'horse',
  roads: null,
  graph: null,
  roadsError: null,
  route: null,
  showRoads: false,
  manifest: null,
  editor: initialEditor,
  setPin: (which, pt) =>
    set((s) => {
      const pins = { ...s.pins, [which]: pt === null ? null : clampPin(pt, s.manifest) }
      return { pins, route: recomputeRoute({ graph: s.graph, pins, mode: s.mode }) }
    }),
  placePin: (pt) =>
    set((s) => {
      const clamped = clampPin(pt, s.manifest)
      const pins =
        s.pins.a === null
          ? { a: clamped, b: s.pins.b }
          : { a: s.pins.a, b: clamped }
      return { pins, route: recomputeRoute({ graph: s.graph, pins, mode: s.mode }) }
    }),
  clearPins: () =>
    set((s) => ({
      pins: { a: null, b: null },
      route: recomputeRoute({ graph: s.graph, pins: { a: null, b: null }, mode: s.mode }),
    })),
  setMode: (mode) =>
    set((s) => {
      if (s.mode === mode) return s
      return { mode, route: recomputeRoute({ graph: s.graph, pins: s.pins, mode }) }
    }),
  setRoads: (roads, error) =>
    set((s) => {
      const next = applyRoads(s, roads, error)
      return { ...next, route: recomputeRoute({ graph: next.graph, pins: s.pins, mode: s.mode }) }
    }),
  setRoute: (route) => set({ route }),
  toggleShowRoads: () => set((s) => ({ showRoads: !s.showRoads })),
  setManifest: (manifest) => set({ manifest }),
  setEditor: (partial) => set((s) => ({ editor: { ...s.editor, ...partial } })),
}))

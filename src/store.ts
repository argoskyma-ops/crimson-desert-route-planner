import type { Map as LeafletMap } from 'leaflet'
import { create } from 'zustand'
import type { MapManifest } from './lib/map-manifest'
import type { Mode, Pt, RoadClass, RoadsFile, Route } from './routing/types'

/**
 * Leaflet map instance created by MapView. T4/T6 read `mapRef.current`.
 * Module-level (not Zustand state) so assigning it does not re-render subscribers.
 * Null when the map is unmounted or the manifest is missing.
 */
export const mapRef: { current: LeafletMap | null } = { current: null }

function clampPin(pt: Pt, manifest: MapManifest | null): Pt {
  if (!manifest) return pt
  return {
    x: Math.min(Math.max(0, pt.x), manifest.width),
    y: Math.min(Math.max(0, pt.y), manifest.height),
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
  route: Route | null
  showRoads: boolean
  manifest: MapManifest | null
  editor: EditorState
  setPin: (which: 'a' | 'b', pt: Pt | null) => void
  placePin: (pt: Pt) => void
  clearPins: () => void
  setMode: (mode: Mode) => void
  setRoads: (roads: RoadsFile | null) => void
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
  route: null,
  showRoads: false,
  manifest: null,
  editor: initialEditor,
  setPin: (which, pt) =>
    set((s) => ({
      pins: { ...s.pins, [which]: pt === null ? null : clampPin(pt, s.manifest) },
    })),
  placePin: (pt) =>
    set((s) => {
      const clamped = clampPin(pt, s.manifest)
      if (s.pins.a === null) return { pins: { a: clamped, b: s.pins.b } }
      return { pins: { a: s.pins.a, b: clamped } }
    }),
  clearPins: () => set({ pins: { a: null, b: null } }),
  setMode: (mode) => set({ mode }),
  setRoads: (roads) => set({ roads }),
  setRoute: (route) => set({ route }),
  toggleShowRoads: () => set((s) => ({ showRoads: !s.showRoads })),
  setManifest: (manifest) => set({ manifest }),
  setEditor: (partial) => set((s) => ({ editor: { ...s.editor, ...partial } })),
}))

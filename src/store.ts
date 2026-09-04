import type { Map as LeafletMap } from 'leaflet'
import { create } from 'zustand'
import {
  commitDraft,
  deleteEdge,
  findEdge,
  setEdgeClass,
  type DraftPoint,
} from './editor/graph-edit'
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

function roadsForEdit(s: { roads: RoadsFile | null; manifest: MapManifest | null }): RoadsFile {
  return s.roads ?? emptyRoads(imageSizeFor(s))
}

export interface EditorState {
  active: boolean
  tool: 'draw' | 'select'
  selectedEdgeId: string | null
  draftPoints: DraftPoint[]
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
  startDraft: () => void
  addDraftPoint: (pt: DraftPoint) => void
  undoDraftPoint: () => void
  finishDraft: () => void
  cancelDraft: () => void
  selectEdge: (id: string | null) => void
  setSelectedClass: (cls: RoadClass) => void
  deleteSelected: () => void
  setTool: (tool: EditorState['tool']) => void
  toggleEditor: () => void
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
  toggleShowRoads: () =>
    set((s) => {
      if (s.editor.active) return { showRoads: true }
      return { showRoads: !s.showRoads }
    }),
  setManifest: (manifest) => set({ manifest }),
  setEditor: (partial) => set((s) => ({ editor: { ...s.editor, ...partial } })),
  startDraft: () =>
    set((s) => ({
      editor: { ...s.editor, tool: 'draw', draftPoints: [], selectedEdgeId: null },
    })),
  addDraftPoint: (pt) =>
    set((s) => {
      if (!s.editor.active) return s
      return {
        editor: {
          ...s.editor,
          tool: 'draw',
          selectedEdgeId: null,
          draftPoints: [...s.editor.draftPoints, pt],
        },
      }
    }),
  undoDraftPoint: () =>
    set((s) => {
      if (s.editor.draftPoints.length === 0) return s
      return { editor: { ...s.editor, draftPoints: s.editor.draftPoints.slice(0, -1) } }
    }),
  finishDraft: () =>
    set((s) => {
      if (s.editor.draftPoints.length < 2) return s
      const base = roadsForEdit(s)
      const nextRoads = commitDraft(base, s.editor.draftPoints, s.editor.newEdgeClass)
      if (nextRoads === base) {
        return { editor: { ...s.editor, draftPoints: [], selectedEdgeId: null } }
      }
      const applied = applyRoads(s, nextRoads)
      return {
        ...applied,
        route: recomputeRoute({ graph: applied.graph, pins: s.pins, mode: s.mode }),
        editor: { ...s.editor, draftPoints: [], selectedEdgeId: null, dirty: true },
      }
    }),
  cancelDraft: () =>
    set((s) => ({
      editor: { ...s.editor, draftPoints: [] },
    })),
  selectEdge: (id) =>
    set((s) => ({
      editor: { ...s.editor, selectedEdgeId: id },
    })),
  setSelectedClass: (cls) =>
    set((s) => {
      let nextRoads = s.roads
      let dirty = s.editor.dirty
      const selectedId = s.editor.selectedEdgeId
      if (s.editor.tool === 'select' && selectedId && nextRoads && findEdge(nextRoads, selectedId)) {
        const updated = setEdgeClass(nextRoads, selectedId, cls)
        if (updated !== nextRoads) {
          nextRoads = updated
          dirty = true
        }
      }
      const editor = { ...s.editor, newEdgeClass: cls, dirty }
      if (nextRoads !== s.roads) {
        const applied = applyRoads(s, nextRoads)
        return {
          ...applied,
          route: recomputeRoute({ graph: applied.graph, pins: s.pins, mode: s.mode }),
          editor,
        }
      }
      return { editor }
    }),
  deleteSelected: () =>
    set((s) => {
      const selectedId = s.editor.selectedEdgeId
      if (!selectedId || !s.roads || !findEdge(s.roads, selectedId)) {
        return { editor: { ...s.editor, selectedEdgeId: null } }
      }
      const nextRoads = deleteEdge(s.roads, selectedId)
      const applied = applyRoads(s, nextRoads)
      return {
        ...applied,
        route: recomputeRoute({ graph: applied.graph, pins: s.pins, mode: s.mode }),
        editor: { ...s.editor, selectedEdgeId: null, dirty: true },
      }
    }),
  setTool: (tool) => set((s) => ({ editor: { ...s.editor, tool } })),
  toggleEditor: () =>
    set((s) => {
      if (s.editor.active) {
        return {
          editor: {
            ...s.editor,
            active: false,
            draftPoints: [],
            selectedEdgeId: null,
          },
        }
      }
      return {
        showRoads: true,
        editor: { ...s.editor, active: true },
      }
    }),
}))

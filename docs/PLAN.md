> Build-time working document from the 2026-09-03 MVP build, kept for history and not maintained.

# Plan

MVP task list. Each task is sized for one external-coder call (Cursor/Grok or Codex),
owns an explicit set of files, and has an acceptance check. Read docs/DECISIONS.md
first; it is the contract. Status was tracked in a root STATE.md, since folded into
docs/NOTES.md.

Global acceptance for every task: `npm run typecheck`, `npm run lint`, `npm run build`
(and `npm test` where tests exist) are clean; only the listed files change; one commit.

## T0. Map pipeline (Claude subagent 2)
Files: `scripts/fetch-map.sh`, `scripts/build-tiles.py`, `SOURCE.md`, `data/map/*` (ignored).
- fetch-map.sh downloads the PowerPyx JPEG to `data/map/source.jpg` (idempotent).
- build-tiles.py implements D4 exactly (tiles + manifest), runs with `.venv/bin/python`.
Accept: `data/map/manifest.json` matches D4; `tiles/5/` has 21x21 tiles; a standalone
Leaflet page using PixelCRS shows the whole map with no gaps at every zoom.

## T1. App shell + map view (Grok)
Files: `vite.config.ts`, `src/App.tsx`, `src/index.css`, `src/lib/coords.ts`,
`src/lib/map-manifest.ts`, `src/components/MapView.tsx`, `src/store.ts`.
- Vite plugin per D4 (dev middleware for `/data/`, build copy into `dist/data/`).
- `coords.ts`: `makePixelCrs(maxNativeZoom)`, `toLatLng`, `fromLatLng`.
- `MapView` fetches the manifest, creates the Leaflet map (D3 bounds/zooms, canvas
  renderer, `zoomControl` bottom-right, `attributionControl` off), tile layer at
  `/data/map/tiles/{z}/{x}/{y}.jpg`. Missing manifest -> friendly message (D4).
- `store.ts`: Zustand store with `pins`, `mode`, `roads`, `route`, `showRoads`,
  `editor` slices and setters (shape in D8/T2/T6). Only the map-related fields need
  to be wired in this task; the rest can be placeholders with correct types.
- Full-screen layout, Tailwind, dark UI chrome.
Accept: `npm run dev` shows the map; pan, pinch/scroll zoom, overzoom to +2 work;
build output contains `dist/data/map/manifest.json`.

## T2. Pins A and B (Grok)
Files: `src/components/MapView.tsx`, `src/components/ControlPanel.tsx`, `src/store.ts`,
`src/lib/pin-icons.ts`, `src/App.tsx`.
- Tap/click on the map: sets A if unset, else B if unset, else moves B. Pins are
  draggable `L.marker`s with `divIcon`s (green "A", red "B"); drag end updates the store.
- Control panel (top-left, floating): Clear button, mode toggle placeholder, route
  summary placeholder. 44 px touch targets.
Accept: place A and B, drag them, Clear removes both; store holds pixel coords.

## T3. Routing module (Codex)
Files: `src/routing/*` except `types.ts` (read-only contract), `src/routing/*.test.ts`.
- `geometry.ts` (distance, polyline length, project point to segment),
  `spatial-index.ts` (uniform grid over edge segments), `graph.ts` (`buildGraph`),
  `snap.ts` (`snapToRoads`), `astar.ts`, `route.ts` (`findRoute`), `index.ts` exports.
- Implements D6 with speeds from `src/config/travel.ts`.
Accept: `npm test` green with unit tests covering: route follows the road when it is
faster; direct off-road wins when the road detour is long; horse vs foot can change the
chosen route; both pins on the same edge; pin far from any road; disconnected graph.

## T4. Route rendering, mode toggle, summary (Grok)
Files: `src/components/MapView.tsx`, `src/components/ControlPanel.tsx`,
`src/components/RouteSummary.tsx`, `src/components/Legend.tsx`, `src/store.ts`,
`src/lib/roads-loader.ts`, `src/App.tsx`.
- Load `/data/roads.json` (validate shape, fall back to an empty graph with a notice),
  `buildGraph` in the store, recompute the route whenever pins/mode/roads change.
- Draw one polyline per leg with `CLASS_COLORS`, white casing beneath, off-road dashed.
  "Show roads" toggle draws the whole graph faintly (canvas renderer).
- Horse / On foot segmented toggle; summary shows total km, ETA (m:ss), per-class km.
Accept: with `data/roads.json` present, A and B produce a visible road-following
route; toggling mode changes ETA (and route when the graph allows it).

## T5. Road extraction (Codex)
Files: `scripts/extract-roads.py`, `data/roads.json`, `data/map/roads-debug.png` (ignored).
- D5 pipeline; prints node/edge/point counts and class histogram; writes a debug
  overlay PNG (mask + skeleton over the map) for eyeballing.
Accept: valid roads.json per D5 (validated by a small check in the script); the
debug overlay shows the major road network traced; rivers and text excluded.

## T6a. Road editor: draw + select (Grok)
Files: `src/editor/graph-edit.ts` (+ test), `src/editor/editor-layer.ts`,
`src/components/EditorPanel.tsx`, `src/components/MapView.tsx`, `src/store.ts`,
`src/App.tsx`.
- Pure functions in `graph-edit.ts`: `addEdge`, `splitEdgeAt`, `deleteEdge`,
  `setEdgeClass`, `moveNode`, `removeOrphanNodes`, id generation. Unit-tested.
- Draw and Select tools per D8, class picker, Finish/Cancel, keyboard Enter/Esc.
Accept: draw a new road that snaps to an existing node and to an existing edge
(splitting it); select an edge, change class, delete; route uses the new road.

## T6b. Road editor: node drag, save, import, export (Grok)
Files: `src/editor/editor-layer.ts`, `src/components/EditorPanel.tsx`,
`vite.config.ts`, `src/lib/roads-io.ts`, `src/store.ts`.
- Drag end nodes of the selected edge. Save (dev endpoint / download), Import,
  Export, dirty marker, beforeunload guard per D8.
Accept: edit, Save, reload the page, edit is still there (dev); Export downloads a
valid file; Import replaces the graph.

## T7. README + polish (Grok)
Files: `README.md`, `docs/NOTES.md`, small UI fixes.
- README: run, build, map pipeline, extraction, how to trace roads, deploy note.
Accept: README matches the scripts and UI; mobile layout checked at 390x844.

## T8. Whole-repo review (Claude subagent 3), then QA (Claude subagent 4)
- Review against PLAN.md and DECISIONS.md; findings fixed via the CLI that wrote them.
- Playwright smoke test committed under `tests/e2e/`, screenshot in `docs/screenshots/`.

## T9. Review fixes (Grok, after docs/REVIEW.md and QA)
Origin check + watcher ignore on the dev save endpoint, interior draft snaps become
junctions, diff-friendly one-line-per-record roads.json, stronger off-road penalty (D7)
with config-derived routing fixtures, curl -f, lint coverage, editor redraw gating.
Accept: REVIEW.md blockers closed; tests/e2e/smoke.py green.

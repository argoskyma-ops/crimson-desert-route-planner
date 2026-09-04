> Build-time working document from the 2026-09-03 MVP build, kept for history and not maintained.

# Review

Whole-repo review against docs/DECISIONS.md (D1–D9) and docs/PLAN.md (T0–T7), 2026-09-03.
Reviewed at commit `34b97bd`; README.md, docs/NOTES.md, index.html, Legend.tsx,
editor-layer.ts and EditorPanel.tsx were read from HEAD (T7 polish was in flight).

## Verdict

Contract-clean and functionally sound — routing, coordinates, tile pipeline, schema and
static build all check out; two blockers (dev-endpoint origin check, editor interior snaps)
plus a short should-fix list before sign-off.

## Blocking

1. **`vite.config.ts:148-152` — `POST /__dev/save-roads` accepts cross-origin requests.**
   The middleware checks only method and pathname. A `fetch('http://localhost:5173/__dev/save-roads',
   {method:'POST', mode:'no-cors', body:'{"version":1,"nodes":[],"edges":[]}'})` from *any* page
   the user has open while `npm run dev` runs is a CORS-simple request (no preflight), reaches the
   handler — which never inspects `Content-Type` — passes `isSaveRoadsPayload`, and truncates
   `data/roads.json`, the only committed copy of the dataset. Body cap (20 MB), fixed destination
   path and dev-only registration are all correct; this is the missing piece.
   Fix: at the top of `handleSaveRoads`, reject unless
   `req.headers['sec-fetch-site'] === 'same-origin'` or `req.headers.origin` matches
   `http(s)://<server.config.server.host||localhost>:<port>`; return 403 otherwise.

2. **`src/editor/graph-edit.ts:307-327` — `commitDraft` discards every interior snap.**
   Only `draft[0]` and `draft[draft.length-1]` go through `resolveEndpoint`; points 1..n-2 are
   copied verbatim into `points` as plain polyline vertices. So a tap that snapped to an existing
   node or split an existing edge mid-draw (`editor-layer.ts:86-98` computes the snap correctly and
   the UI highlights it) produces no shared node and no split — the new road visually crosses the
   old one but is topologically disconnected. D8 states the snap rule for taps generally, not for
   endpoints only, and stitching crossings is the editor's main job against a dataset that is
   136 disconnected components (largest = 307 of 2067 nodes).
   Fix: resolve *every* draft point that carries a `snap`, and emit one `addEdge` per span between
   consecutive resolved nodes (same class) instead of a single edge, threading the updated
   `RoadsFile` through each step as `resolveEndpoint` already does.

## Should fix

- `vite.config.ts:118` — `data/roads.json.tmp` is written next to the dataset but is not in
  `.gitignore`; an interrupted save leaves an untracked file in `data/`. Add `data/*.tmp`.
- `index.html:6` (HEAD) — viewport lacks `viewport-fit=cover`, so the
  `env(safe-area-inset-top)` padding in `ControlPanel.tsx:19` resolves to `0` on notched iPhones
  and the panel sits under the status bar. D2 is phone-first.
- `scripts/fetch-map.sh:20` — `curl -sL` without `-f`: a 403/404 HTML body is written to
  `source.jpg`. The Pillow size check catches it, but the bad file stays and line 16 then skips
  the re-download forever. Add `-f` and `rm -f "${OUT_FILE}"` on failure.
- `src/editor/editor-layer.ts:34-47,269` — `nearestNode` walks all 2067 nodes calling
  `latLngToContainerPoint` on every `mousemove`, and `redraw()` is wired to *every* store change via
  `useAppStore.subscribe` (line 298), including pin drags and route recomputes. Cheap enough on
  desktop, noticeable on a phone. Gate the subscribe on the editor slice, and reuse
  `graph.edgesNear` / a node grid instead of the linear scan.
- `src/config/travel.ts:12-13` — with horse main 11 vs off-road 5.5 m/s, a road detour only pays
  below 2x the straight line. Measured on the committed graph: 0/40 random A-B pairs used any road
  leg, and only 62/200 pairs with A on a road node and B within ~800 px did. That is the D7
  "ASSUMED" caveat biting, but the app will look like it ignores roads until it is tuned.
- `scripts/extract-roads.py:1135` writes minified JSON; `src/lib/roads-io.ts:22` writes 2-space
  pretty JSON. The first editor Save reformats all 441 KB into one giant diff. Pick one.
- `data/roads.json` — 82 self-loop edges (`from === to`, median length 21 px, likely skeleton
  artefacts around icons) and 13 small closed components (≤7 nodes) with no degree-1 node, which
  therefore never receive D6 connectors and are unreachable. Not schema violations; worth a pass
  in the editor.
- `src/store.ts:275-285` — `setTool` silently drops an in-progress draft when switching to Select.
- `package.json:9` — `npm run lint` covers `src scripts tests` but not `vite.config.ts` /
  `vitest.config.ts`, the files with the most Node-facing logic.

## Notes (verified OK)

- **D3 coordinates.** `makePixelCrs` overrides `L.CRS.Simple`'s `-1` y-factor with
  `new L.Transformation(s, 0, s, 0)`, so lat is image y increasing downward, and
  `scale(z)*s = 2**(z-maxNativeZoom)` puts one image pixel on one CSS pixel at native zoom —
  exactly D4's tile scaling. `toLatLng`/`fromLatLng` are `L.latLng(y, x)` throughout; no
  transposed call found anywhere in `src/`.
- **D4 pipeline.** `manifest.json` matches D4 byte for byte; tile counts are 1/4/9/36/121/441
  (z5 = 21x21, per T0's acceptance check). `resolveDataFile` (vite.config.ts:27-46) correctly
  blocks traversal and null bytes; `closeBundle` is guarded on `command === 'build'`.
- **D6/D7 routing** — verified empirically on the committed dataset via `vite-node`: 100 routes,
  1700 leg-to-leg joins, **0** gaps > 1e-6 px, 0 leg-length mismatches, first leg starts at A and
  last ends at B in every case. `buildGraph` 40 ms / 1233 connectors, `findRoute` ≤ 4 ms. Cost is
  time in seconds, the heuristic uses `fastestSpeed(mode)` (admissible), the direct A→B off-road
  arc is always pushed (`route.ts:56`), and split points are query-local — the base graph is never
  mutated.
- **D5 schema** — `data/roads.json`: 2067 nodes / 2648 edges / 12013 points, unique ids, 0 dangling
  refs, 0 non-finite coords, max endpoint-vs-node delta **0.0 px** (limit 0.05), classes
  `{main:154, sub:2494}`, 0 orphan nodes, 0 duplicate edges, all points inside `imageSize`.
- **D8 persistence** — no `localStorage`/`sessionStorage`/`indexedDB` anywhere in `src/`;
  Save/Export/Import + dirty marker + `beforeunload` all present; editor mode disables pin
  placement (`MapView.tsx:113-117` returns early) while pins and route stay drawn.
- **Effects / Leaflet lifecycle** — StrictMode double-invoke is safe: the map-init effect's
  `cancelled` flag returns before `L.map()` is reached on the discarded pass, and
  `attachEditorLayer` returns a disposer that unsubscribes, `map.off`s both handlers, removes the
  window keydown listener, drops its layer group and restores `doubleClickZoom`. No stale closures:
  every Leaflet callback reads `useAppStore.getState()`. Route is recomputed in the store on all
  five paths that mutate `roads` (`setRoads`, `finishDraft`, `setSelectedClass`, `deleteSelected`,
  `moveNode`) as well as on pin and mode changes.
- **Editor integrity** — `deleteEdge` + `removeOrphanNodes` leave no dangling refs; `moveNode`
  rewrites the matching endpoint of every incident edge, so `points[0] == from` /
  `points[last] == to` holds; `splitEdgeAt` allocates the second edge id against a graph that
  already contains the first, so no id collision; `splitAtSnap` re-projects when a snapped edge id
  has been replaced by an earlier split in the same commit.
- **Build is static** — `dist/` contains only `index.html`, `assets/`, two SVGs and
  `data/{roads.json,map/manifest.json,map/tiles/**}`; `saveRoadsDev` short-circuits on
  `import.meta.env.DEV` so production Save falls back to a download. 44 px targets are present on
  every control (`min-h-11` x10 plus the Leaflet zoom-bar CSS override in `index.css:21-27`).

## Checks run

- `npm run typecheck` clean · `npm run lint` clean · `npm test` 38 passed / 6 files ·
  `npm run build` clean, `dist/data/**` copied.
- `python3` structural audit of `data/roads.json` (ids, endpoint equality, classes, NaN,
  components, self-loops, duplicates).
- `npx vite-node` probes: 100 `findRoute` calls over the real graph checking leg continuity,
  per-leg length consistency, A/B anchoring, road-usage share and timing.
- Not verified (no browser session): on-device rendering, touch/pinch behaviour, the phone layout
  at 390x844, and whether removing a dragged node marker inside its own `dragend`
  (`editor-layer.ts:187-192` → store → `group.clearLayers()`) is glitch-free in Leaflet 1.9.

# Decisions

Recorded 2026-09-03 for the MVP build. Change a decision here first, then the code.

## D1. Map source
- **Primary (since 2026-09-03 evening):** The Hidden Gaming Lair's Crimson Desert map tile
  pyramid, `https://cdn.th.gl/crimson-desert/map-tiles/OpenWorld-25391853dd739b8fd7d28d6280f02d15/{z}/{y}/{x}.webp`,
  512 px WebP tiles, zoom 0..6 (64 x 64 tiles = 32768 px square at z6), fetched by
  `scripts/fetch-tiles.py` with no auth or special headers. It is a clean render of the
  whole game world: roads are neutral grey ink, rivers teal, no labels or icons, and
  roads are drawn *over* water so bridges are visible. About 40x the pixels of the
  PowerPyx image. Fan-hosted; no reuse terms stated. Same stance as before: **personal,
  local use only; do not redistribute the tiles; publishing the app is Rennie's call.**
- **Pywel window:** the pyramid covers more land than the in-game full map. The frame of
  the PowerPyx in-game map (the playable Pywel region) sits at canonical
  `x 1120..6143, y 1640..6723` (PowerPyx px * 0.97 + (1120, 1640); found by phase
  correlation of the two water masks, match verified visually). The manifest's `bounds`
  (`[1024, 1544, 6248, 6832]`, that frame plus a margin, snapped to 8 px) is what the map
  fits to, pans within, and what extraction covers. Widen it if the game opens more land.
- **Retired:** PowerPyx full world map JPEG (5178 x 5240; `scripts/fetch-map.sh` +
  `scripts/build-tiles.py`, removed 2026-09-03). Too pixelated when zoomed and the map
  paints rivers over roads, which hid every bridge from extraction. The old tile
  pyramid may still sit in `data/map/tiles-powerpyx/` locally; it is unused.
- **Not used:** MapGenie (tiles 403 to scripts), crimsondesertfire.com (16384 px pyramid,
  same cartography as PowerPyx), Fextralife's 8192 px PNG. See docs/RESEARCH.md.
- Every raster lives under `data/map/` which is gitignored. `SOURCE.md` +
  `scripts/fetch-tiles.py` are committed instead.

## D2. Stack
- Vite 8 + React 19 + TypeScript + Tailwind v4, plain Leaflet 1.9 (no react-leaflet:
  one imperative `MapView` keeps full control of CRS.Simple events and the editor).
- Zustand for app state, Vitest for unit tests, oxlint for lint, Playwright for the
  smoke test. Python 3 (uv venv at `.venv`, Pillow/numpy/scipy/scikit-image/networkx/
  shapely/sknw) for the offline scripts.
- No backend, no accounts. `npm run build` yields a static `dist/` (Cloudflare Pages ready).
- Phone/tablet first: full-screen map, one floating control panel, 44 px touch targets.

## D3. Coordinate system
- The canonical coordinate space is the **zoom-4 pixel grid of the tile pyramid**:
  8192 x 8192, x right, y down, origin top-left, `imageSize = [8192, 8192]`. `roads.json`,
  pins, routes, the water mask and the editor all use it. (Before 2026-09-03 it was the
  5178 x 5240 PowerPyx image; old coordinates convert as `new = old * 0.97 + (1120, 1640)`.)
- Leaflet CRS (`src/lib/coords.ts`):
  `PixelCRS = L.extend({}, L.CRS.Simple, { transformation: new L.Transformation(s, 0, s, 0) })`
  with `s = 1 / 2 ** canonicalZoom` (manifest `canonicalZoom`, 4). Then `L.latLng(y, x)` is
  a canonical pixel; at zoom 4 one canonical pixel == one CSS pixel, and at the pyramid's
  native zooms 5 and 6 a canonical pixel spans 2 and 4 CSS pixels (real detail, not
  overzoom). Helpers `toLatLng(pt)` and `fromLatLng(latlng)`.
- Map bounds: the manifest `bounds` window (Pywel), `maxBounds` padded by 10% of it and
  clipped to the image, `minZoom` = the zoom that fits it, `maxZoom = maxNativeZoom + 2`.
  The tile layer itself is bounded by the whole 8192 x 8192 image so the padding renders.

## D4. Tile pyramid
- `scripts/fetch-tiles.py` downloads the th.gl pyramid unchanged to
  `data/map/tiles/{z}/{y}/{x}.webp` (note the **z/y/x** order; 5461 tiles, ~24 MB) and
  writes `data/map/manifest.json`:
  `{ "width": 8192, "height": 8192, "canonicalZoom": 4, "tileSize": 512, "minZoom": 0,
     "maxNativeZoom": 6, "format": "webp", "tileOrder": "zyx",
     "bounds": [1024, 1544, 6248, 6832], "source": "SOURCE.md" }`.
  Re-running skips tiles that exist. `--composite N` also stitches zoom N to a PNG.
- `src/lib/map-manifest.ts` parses it with defaults for older manifests (`canonicalZoom`
  = `maxNativeZoom`, `tileOrder` = `zxy`, `bounds` = the whole image) and builds the
  Leaflet URL template from `format` + `tileOrder`.
- Serving: the Vite plugin in `vite.config.ts` serves `data/` at `/data/` in dev (jpg,
  png, webp, json) and copies `data/roads.json`, `data/water-mask.png`,
  `data/map/manifest.json` and `data/map/tiles/` into `dist/data/` on build. If the
  manifest is missing the app says "run scripts/fetch-tiles.py".

## D5. Road data
- **Hybrid:** `scripts/extract-roads.py` produces `data/roads.json` from the pyramid
  (stitch the Pywel window at zoom 5 -> grey-ink mask -> optional ridge pass -> skeleton
  -> junction graph -> prune -> split at water -> simplify -> classify by width -> divide
  coordinates by 2). The in-app editor fixes and extends it. `data/roads.json` is committed;
  it is the dataset. `scripts/review-tiles.py` renders labelled review tiles of the graph
  over the map for visual sweeps.
- Schema `roads.json` v1 (`src/routing/types.ts` is the TypeScript mirror):
  ```json
  {
    "version": 1,
    "imageSize": [8192, 8192],
    "nodes": [{ "id": "n1", "x": 1234.5, "y": 678.9 }],
    "edges": [{ "id": "e1", "from": "n1", "to": "n2", "class": "main",
                "points": [[1234.5, 678.9], [1240.0, 690.2]], "bridge": true }]
  }
  ```
  Rules: edges are undirected; `points[0]` equals the `from` node and the last point
  equals the `to` node; ids are unique strings; `class` is `main | sub | offroad`;
  `bridge` is optional and marks a piece of road drawn over water; lengths are derived
  at load time, never stored. Coordinates may be fractional.
- **Classes on this map:** the pyramid draws roads about 5 px wide at zoom 5 and paths
  about 2 px. Width (median mask half-width >= `--main-radius`, 1.9) decides: roads are
  `main`, paths are `sub`. Which of the two the game treats as faster is an assumption;
  tune D7 speeds rather than swapping classes. Off-road is never traced; it is what the
  router uses for pin-to-road legs and hand-drawn `offroad` shortcut edges.
- **Bridges:** rivers are painted under the roads on this source, so a road's ink runs
  across the water. `split_edges_at_water` cuts every edge where it enters or leaves the
  water mask and flags the wet pieces `"bridge": true` (runs under `--bridge-min-length`,
  6 px at zoom 5, are ignored as noise). A gap across water therefore means no bridge,
  and the water-aware router (D10) will not jump it.
- Cleanup: spurs, fragments, self-loops around symbols, small closed rings, and dense
  clutter (towns, farm parcels, hatching) are removed; T-junctions within
  `--junction-snap` (24 px) and facing gaps within `--bridge-gap` (40 px, land only) are
  closed; a surviving closed ring gets one junction onto the nearest road.

## D6. Routing
- `src/routing/` is a pure TypeScript module: `buildGraph(roads)` once per roads
  change, `findRoute(graph, a, b, { mode })` per query. A* over the road graph.
- Pin snapping: each pin projects onto its nearest road segments (up to 4 candidates
  within 300 px, grid spatial index); each candidate becomes a virtual node splitting
  its edge; the pin connects to each candidate by a straight `offroad` leg. The direct
  straight A->B off-road path is a candidate too; the cheapest total wins. **Amended by
  D10:** water blocks off-road legs, and the direct A->B arc is foot-only.
- Cost is time in seconds: `lengthPx * METERS_PER_PIXEL / SPEED_MPS[mode][class]`.
  Heuristic: straight-line distance / fastest speed for the mode (admissible).
- Output: ordered legs, one per traversed edge (or off-road hop), each with class,
  points, lengthPx and seconds, plus totals.
- Dead-end connectors (added 2026-09-03 after the first extraction came back in 245
  fragments): `buildGraph` gives every degree-1 node straight `offroad` arcs to up to
  3 nearest other nodes within `CONNECTOR_RADIUS_PX` (200) that are not already
  adjacent. They cost off-road time, so the router hops small gaps between fragments
  instead of abandoning the road network, and the legs render as dashed off-road hops.
  Connectors that would cross water are skipped (D10).

## D7. Speed model (`src/config/travel.ts`, the one tunable file)
- `METERS_PER_PIXEL = 9500 / 5178` (ASSUMED: Pywel is roughly 9.5 km across per
  secondary sources; unverified).
- `SPEED_MPS`: horse main 11 / sub 9 / offroad 4; foot main 5.5 / sub 5.0 /
  offroad 2.8. All ASSUMED; no source confirms a paved-road speed bonus. The values
  encode "prefer main roads, then sub roads, cut across country only when it is much
  shorter", which is the routing behaviour we want. Tune in-game. Off-road was
  dropped from 5.5 / 3.5 (a 2× main/off-road ratio) after review measured that
  almost no random A–B pair used a road at that ratio.

## D8. Road editor
- Custom, plain Leaflet (no leaflet-geoman): the graph shares nodes between edges and a
  purpose-built editor keeps that model exact.
- Tools: **Draw** (tap to add vertices; a tap within 12 CSS px of a node snaps to it,
  within 10 px of an edge splits that edge at the projection; Finish/Enter ends,
  Esc/Cancel discards; class picker for the new edge), **Select** (tap an edge to
  select; set class, delete; drag its end nodes, which moves every connected edge).
- Persistence: **Save** writes `data/roads.json` via a dev-only Vite endpoint
  (`POST /__dev/save-roads`) and downloads the file in production builds. **Import**
  (file picker) replaces the graph, **Export** downloads it. Unsaved edits show a dirty
  marker and a `beforeunload` warning. No localStorage.
- Editor mode disables pin placement; pins and route stay visible.

## D9. Process
- GSD pipeline skipped for this run; `docs/PLAN.md` is the task list, `STATE.md` the
  checkpoint. Cursor/Grok writes the app, Codex writes routing + extraction and
  reviews Grok's diffs, Claude subagents (cap 5) do research, tiles, whole-repo
  review, QA, and one reserved debug. Every task ends with typecheck + lint + build
  green and one commit.

## D10. Water mask and horse-follows-roads
- **Why:** the router was water-blind. D6 connectors and the off-road legs hopped
  rivers where no bridge exists, and a horse would cut cross-country between two
  roads. Added 2026-09-03.
- **Mask:** `data/water-mask.png`, an 8-bit greyscale PNG of the whole canonical
  map at half resolution (zoom 3 of the pyramid: 4096 x 4096 for the 8192 x 8192
  canonical space, so `scale` = 0.5 mask px per canonical px). 255 = water, 0 =
  land; a block is water if any of its zoom-5 pixels is, so the mask errs slightly
  toward water. Written by the extraction script from the map's teal pixels for
  the Pywel window (everything outside is land) and committed next to
  `data/roads.json`.
  It is served at `/data/water-mask.png` in dev and copied into `dist/data/`.
- **Loading:** `src/lib/water-mask-loader.ts` decodes the PNG with
  `createImageBitmap` + `OffscreenCanvas` (`Image` + canvas fallback) into a
  `WaterMask` (`src/routing/water-mask.ts`: width, height, scale, one byte per
  mask pixel). A 404 or a decode failure logs one warning and returns
  `undefined` — the app keeps working, water-blind, as before. `src/store.ts`
  loads it alongside `roads.json` and passes it to every `buildGraph` call,
  including the editor's rebuilds; `graph.water` carries it to `findRoute`.
- **Crossing rule:** `crosses(a, b)` samples the straight segment every
  `WATER_SAMPLE_STEP_MASK_PX` (1) mask pixel and reports a crossing only when at
  least `WATER_CROSS_MIN_SAMPLES` (2) *consecutive* samples are water, so one
  noisy pixel never blocks travel. Both constants, plus the decode threshold
  `WATER_THRESHOLD` (128), live in `src/config/travel.ts`. Points outside the
  mask count as land.
- **Rules applied:**
  1. A D6 dead-end connector candidate whose straight hop crosses water is
     skipped; the freed slot goes to the next-best dry candidate, so each dead
     end still gets up to `CONNECTOR_MAX` connectors. On the committed dataset
     this replaces 510 water-crossing connectors (1233 -> 1229 total).
  2. A pin-to-road snap leg that crosses water is not offered.
  3. The direct A->B off-road arc is offered **only on foot** and only when it
     does not cross water. A horse therefore always follows roads; only its
     pin-to-road legs and the land-only connectors are off-road.
  4. Exception: a pin dropped *on* water keeps all of its own legs, so a pin in
     a lake or at sea still routes to shore instead of returning nothing.
  5. Roads themselves are never water-checked — a traced road over a river is a
     bridge or a ford.
- **Warnings:** `Route.warnings: RouteWarning[]` (`straight-line-fallback` when
  A* found no path and the route is the raw A->B line, `crosses-water` when an
  off-road leg of the chosen route runs through water; both can be present).
  Empty on a clean route. `RouteSummary` renders them as one amber line ("No
  road route: straight line shown" / "Route crosses water"). Leg output is
  otherwise unchanged.

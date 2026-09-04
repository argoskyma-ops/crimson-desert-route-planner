# Decisions

Recorded 2026-09-03 for the MVP build. Change a decision here first, then the code.

## D1. Map source
- **Primary:** PowerPyx full world map of Pywel,
  `https://www.powerpyx.com/wp-content/uploads/crimson-desert-full-world-map.jpg`,
  5178 x 5240 px JPEG, 2.2 MB. Fan-hosted copy of the in-game full map; no explicit
  reuse license. Fine for a personal, local tool. **Do not redistribute the image or
  the tiles built from it; publishing the app publicly is Rennie's call.**
- **Fallback:** MapGenie's Pywel tile pyramid (schema known, CDN returns 403 to scripts).
  Not used. See docs/RESEARCH.md.
- The source image and every derived raster live under `data/map/` which is gitignored.
  `SOURCE.md` + `scripts/fetch-map.sh` + `scripts/build-tiles.py` are committed instead.

## D2. Stack
- Vite 8 + React 19 + TypeScript + Tailwind v4, plain Leaflet 1.9 (no react-leaflet:
  one imperative `MapView` keeps full control of CRS.Simple events and the editor).
- Zustand for app state, Vitest for unit tests, oxlint for lint, Playwright for the
  smoke test. Python 3 (uv venv at `.venv`, Pillow/numpy/scipy/scikit-image/networkx/
  shapely/sknw) for the offline scripts.
- No backend, no accounts. `npm run build` yields a static `dist/` (Cloudflare Pages ready).
- Phone/tablet first: full-screen map, one floating control panel, 44 px touch targets.

## D3. Coordinate system
- The canonical coordinate space is **native image pixels** of `data/map/source.jpg`:
  x right, y down, origin top-left, `imageSize = [5178, 5240]`. `roads.json`, pins,
  routes and the editor all use it.
- Leaflet CRS (`src/lib/coords.ts`):
  `PixelCRS = L.extend({}, L.CRS.Simple, { transformation: new L.Transformation(s, 0, s, 0) })`
  with `s = 1 / 2 ** maxNativeZoom`. Then `L.latLng(y, x)` is an image pixel and at
  zoom == maxNativeZoom one image pixel == one CSS pixel. Helpers `toLatLng(pt)` and
  `fromLatLng(latlng)`.
- Map bounds `[[0, 0], [height, width]]`, `maxBounds` padded by 10%, `minZoom` = the
  zoom that fits the map, `maxZoom = maxNativeZoom + 2` (overzoom, `maxNativeZoom` on
  the tile layer).

## D4. Tile pyramid
- `scripts/build-tiles.py` writes `data/map/tiles/{z}/{x}/{y}.jpg` (256 px, quality 85)
  for z = 0..maxNativeZoom where `maxNativeZoom = ceil(log2(max(w, h) / 256))` = 5.
  At zoom z the image is scaled by `2 ** (z - maxNativeZoom)` (native zoom is copied
  1:1, no resampling); edge tiles are padded with the image's border grey.
- It also writes `data/map/manifest.json`:
  `{ "width": 5178, "height": 5240, "tileSize": 256, "minZoom": 0, "maxNativeZoom": 5,
     "format": "jpg", "source": "SOURCE.md" }`.
- Serving: a small Vite plugin in `vite.config.ts` serves the `data/` directory at
  `/data/` in dev and copies `data/roads.json`, `data/map/manifest.json` and
  `data/map/tiles/` into `dist/data/` on build. The app fetches
  `/data/map/manifest.json`, `/data/map/tiles/{z}/{x}/{y}.jpg` and `/data/roads.json`.
  If the manifest is missing the app shows "run scripts/fetch-map.sh and
  scripts/build-tiles.py" instead of a blank map.

## D5. Road data
- **Hybrid:** `scripts/extract-roads.py` produces a first-pass `data/roads.json` from
  the raster (tan road color band -> mask -> skeletonize -> junction graph -> simplify
  -> class by stroke width). The in-app editor fixes and extends it. `data/roads.json`
  is committed; it is the dataset.
- Schema `roads.json` v1 (`src/routing/types.ts` is the TypeScript mirror):
  ```json
  {
    "version": 1,
    "imageSize": [5178, 5240],
    "nodes": [{ "id": "n1", "x": 1234.5, "y": 678.9 }],
    "edges": [{ "id": "e1", "from": "n1", "to": "n2", "class": "main",
                "points": [[1234.5, 678.9], [1240.0, 690.2]] }]
  }
  ```
  Rules: edges are undirected; `points[0]` equals the `from` node and the last point
  equals the `to` node; ids are unique strings; `class` is `main | sub | offroad`;
  lengths are derived at load time, never stored. Coordinates may be fractional.
- Off-road is not traced; it is what the router uses for the pin-to-road legs and for
  hand-drawn `offroad` shortcut edges (fords, passes).
- Extraction closes junctions: a skeleton endpoint within ~25 px of another edge is
  joined to that edge (splitting it), and endpoint pairs within ~70 px with aligned
  tangents are bridged. Fragments still remain; see D6 connectors and the editor.

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
- **Mask:** `data/water-mask.png`, an 8-bit greyscale PNG at half the map
  resolution (2589 x 2620 for the 5178 x 5240 map, so `scale` = 0.5 mask px per
  image px). 255 = water, 0 = land; a 2 x 2 image block is water if any of its
  pixels is, so the mask errs slightly toward water. Written by the extraction
  script from the map's blue pixels and committed next to `data/roads.json`.
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

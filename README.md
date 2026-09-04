# Crimson Desert Route Planner

Personal route planner for Crimson Desert. Drop pins A and B on the Pywel world
map and get the fastest road route, with a Horse / On foot toggle and main /
sub / off-road classes. The app is local-only: a static Vite site plus
`data/roads.json`. There is no backend.

## Quick start

```bash
npm install
uv venv .venv && uv pip install --python .venv/bin/python pillow numpy scipy scikit-image networkx shapely sknw
.venv/bin/python scripts/fetch-tiles.py
npm run dev
```

Open http://localhost:5173. `scripts/fetch-tiles.py` downloads the th.gl map
tile pyramid (5461 WebP tiles, about 24 MB, see `SOURCE.md`) into
`data/map/tiles/` and writes `data/map/manifest.json`; re-running skips tiles
that are already there. `data/map/` is gitignored; `data/roads.json` (the
committed road graph) and `data/water-mask.png` are not.

If the tiles are missing, the app tells you to run that script.

## Using the planner

1. Tap the map to place A, then B. A further tap moves B. Drag either pin.
2. **Clear** removes both pins.
3. **Horse** / **On foot** changes speeds (and sometimes the chosen path).
4. Route colours: main roads orange, sub roads yellow, off-road hops dashed grey.
5. **Show roads** draws the whole graph faintly under the route.
6. The summary shows km and an ETA. Speeds and the metres-per-pixel scale are
   assumptions in `src/config/travel.ts` — they have not been calibrated in-game.

The router knows where the water is (`data/water-mask.png`, see D10). Off-road
legs — the pin-to-road hops and the gap connectors — never cross a river or the
sea, only traced roads do, so a crossing means a bridge or a ford. **Horse** goes
further and always follows roads: it never cuts cross-country between two roads,
while **On foot** may still take a direct line if it stays on land. When no road
route exists the summary says "No road route: straight line shown" and draws the
straight line anyway; a pin dropped in water routes to shore and says "Route
crosses water". Without `data/water-mask.png` the planner still works — it just
ignores water.

## Tracing and fixing roads

**Edit roads** (top-right) disables pin placement so you can fix the extracted
graph. **Done editing** returns to the planner.

- **Draw** — tap to add vertices. A tap near a node snaps to it; near an edge
  splits that edge. **Finish** or Enter commits; **Cancel** or Esc discards;
  **Undo point** or Backspace pops the last vertex. Pick Main / Sub / Off-road
  before finishing.
- **Select** — tap an edge, change its class, **Delete** it, or drag its end
  nodes (every connected edge moves with them).
- **Save** — under `npm run dev` the Vite server writes `data/roads.json`. A
  production build downloads the file instead.
- **Export** / **Import** download or replace the graph. Import marks the
  editor dirty.
- Unsaved edits show an **Unsaved changes** marker and warn before closing the
  tab.

## Map pipeline and road extraction

The map is the th.gl tile pyramid: 512 px WebP tiles at zoom 0..6, stored as
`data/map/tiles/{z}/{y}/{x}.webp`. Coordinates in `roads.json` are the zoom-4
pixel grid (8192 x 8192); zooms 5 and 6 add real detail on screen. The manifest's
`bounds` is the Pywel window the map fits to (docs/DECISIONS.md D1, D3, D4).

`scripts/extract-roads.py` builds `data/roads.json` from the tiles: it stitches
the Pywel window at zoom 5, masks the grey road ink (which runs straight over
the teal water, so bridges are part of the mask), skeletonizes it, builds a
junction graph, prunes and reconnects it, splits edges where they cross water
and flags those pieces `"bridge": true`, simplifies, and classifies by stroke
width. Key flags:

- `--ridge` — add a ridge-filter pass that picks up the faintest paths
  (used for the committed dataset)
- `--ink-min` / `--ink-max` / `--ink-chroma` — the road-ink colour band
- `--spur-length` / `--component-length` — drop skeleton fragments
- `--junction-snap` / `--bridge-gap` — reconnect stubs and small land gaps
- `--main-radius` — roads (wide, `main`) vs paths (narrow, `sub`)
- `--bounds` / `--zoom` — window and resolution

It also writes `data/map/roads-debug.png` (mask + graph over the map). Gaps that
remain are bridged by the router's off-road connectors (up to 200 px,
`CONNECTOR_RADIUS_PX` in `src/config/travel.ts`) on land only; trace the rest in
the editor. Extraction never emits the `offroad` class.

`scripts/review-tiles.py` renders labelled review tiles (graph over the map,
dead ends ringed, water outlined) into `data/map/review/` for a visual sweep;
`--compare other.json` overlays a second graph in magenta.

Extraction also writes `data/water-mask.png`: an 8-bit greyscale PNG of the
whole canonical map at half resolution (4096 x 4096), 255 = water, 0 = land,
from the map's teal pixels. It is committed next to `roads.json`, served at
`/data/water-mask.png` and copied into `dist/data/` on build. The router loads
it at startup and uses it to keep off-road travel out of rivers and the sea
(docs/DECISIONS.md D10); if the file is missing the app logs one warning and
routes as before.

## Build and deploy

```bash
npm run build
```

writes a static `dist/` that includes `dist/data/` (tiles, `roads.json` and
`water-mask.png`). Also:

```bash
npm run typecheck
npm run lint
npm test
```

End-to-end smoke test (needs the dev server on port 5173 and the Playwright
Chromium in `.venv`; it restores `data/roads.json` afterwards):

```bash
npm run dev -- --port 5173 --strictPort   # in another terminal
.venv/bin/python tests/e2e/smoke.py
```

The map tiles are fan-hosted with no stated reuse licence (see `SOURCE.md`).
Do not redistribute them. Publishing the app publicly is a separate decision.

## Layout

```
src/
  components/   MapView, ControlPanel, EditorPanel, Legend, RouteSummary
  editor/       graph-edit + Leaflet draw/select overlay
  routing/      A* over the road graph, water mask
  lib/          CRS, roads + water-mask load/save, pin icons
  config/       travel.ts (speeds and colours)
scripts/        fetch-tiles.py, extract-roads.py, review-tiles.py, tiles.py
data/           roads.json + water-mask.png (committed); map/ (gitignored)
docs/           DECISIONS.md, PLAN.md, RESEARCH.md
tests/          unit/ (roads.json + water-mask checks), e2e/smoke.py (Playwright)
```

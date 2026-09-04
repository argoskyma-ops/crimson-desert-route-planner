# Crimson Desert Route Planner

Personal route planner for Crimson Desert. Drop pins A and B on the Pywel world
map and get the fastest road route, with a Horse / On foot toggle and main /
sub / off-road classes. The app is local-only: a static Vite site plus
`data/roads.json`. There is no backend.

## Quick start

```bash
npm install
uv venv .venv && uv pip install --python .venv/bin/python pillow numpy scipy scikit-image networkx shapely sknw
scripts/fetch-map.sh
.venv/bin/python scripts/build-tiles.py
npm run dev
```

Open http://localhost:5173. `scripts/fetch-map.sh` downloads the PowerPyx
full-world JPEG into `data/map/source.jpg` (skipped if it is already there).
`build-tiles.py` writes the zoom pyramid and `data/map/manifest.json`.
`data/map/` is gitignored; `data/roads.json` (the committed road graph) is not.

If the tiles are missing, the app tells you to run those two scripts.

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

`scripts/build-tiles.py` cuts `data/map/source.jpg` into a 256 px JPEG pyramid
(`data/map/tiles/{z}/{x}/{y}.jpg`, z = 0..5) and writes `data/map/manifest.json`.
Useful flags: `--source`, `--out`, `--manifest`, `--tile-size`, `--quality`,
`--force` (rewrite tiles that already exist).

`scripts/extract-roads.py` builds a first-pass `data/roads.json` from the raster
(colour + local contrast mask → skeleton → junction graph → simplify → classify
by stroke width). Key tuning flags:

- `--contrast-low` / `--contrast-high` — faint-line recall
- `--min-background` — exclude water and the grey border
- `--close-radius` — close 1–3 px breaks (keep ≤ 2)
- `--spur-length` / `--component-length` — drop hatching fragments
- `--junction-snap` — join a stub onto a nearby edge (typical 25–30 px)
- `--bridge-gap` / `--bridge-angle` — join facing endpoints across icons
- `--main-radius` — thick vs thin roads

It also writes `data/map/roads-debug.png` (mask + skeleton over the map) for
eyeballing. Extraction still leaves fragments; the router adds off-road
connectors that bridge gaps up to 200 px (`CONNECTOR_RADIUS_PX` in
`src/config/travel.ts`). Trace the rest in the editor. Extraction never emits
the `offroad` class.

Extraction also writes `data/water-mask.png`: an 8-bit greyscale PNG at half the
map resolution (2589 x 2620), 255 = water, 0 = land, built from the map's blue
pixels. It is committed next to `roads.json`, served at `/data/water-mask.png`
and copied into `dist/data/` on build. The router loads it at startup and uses it
to keep off-road travel out of rivers and the sea (docs/DECISIONS.md D10); if the
file is missing the app logs one warning and routes as before.

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

The map image is a fan-hosted copy of the in-game Pywel map with no reuse
licence (see `SOURCE.md`). Do not redistribute the source JPEG or the tiles.
Publishing the app publicly is a separate decision.

## Layout

```
src/
  components/   MapView, ControlPanel, EditorPanel, Legend, RouteSummary
  editor/       graph-edit + Leaflet draw/select overlay
  routing/      A* over the road graph, water mask
  lib/          CRS, roads + water-mask load/save, pin icons
  config/       travel.ts (speeds and colours)
scripts/        fetch-map.sh, build-tiles.py, extract-roads.py
data/           roads.json + water-mask.png (committed); map/ (gitignored)
docs/           DECISIONS.md, PLAN.md, RESEARCH.md
tests/          unit/ (roads.json + water-mask checks), e2e/smoke.py (Playwright)
```

# STATE

Session checkpoint for the Crimson Desert route planner. A fresh session should read
this first, then docs/DECISIONS.md, then continue from "Next".

## Done
- **MVP (2026-09-03 day):** tiles, map shell, pins, A* routing, route rendering, raster
  extraction, editor with Save/Export/Import, README, review + Playwright QA, review fixes.
- **Road-network pass 2 (2026-09-03 evening):**
  - Map source switched to the th.gl tile pyramid (32768 px, WebP, no auth), D1/D3/D4
    rewritten: canonical coordinates are the zoom-4 grid (8192 x 8192), manifest carries
    `canonicalZoom`, `tileOrder` (z/y/x), `bounds` (Pywel window). `scripts/fetch-tiles.py`
    replaces fetch-map.sh + build-tiles.py. Old PowerPyx coords map as `x*0.97+1120, y*0.97+1640`.
  - Extractor rebuilt for the new source (`scripts/extract-roads.py`): grey-ink mask +
    optional ridge pass, cleanup, edges split at water and flagged `"bridge": true`,
    class by stroke width (wide road = main, path = sub), `--legacy` imports in-game-map
    trails the new map lacks from `data/legacy/roads-powerpyx.json`. `scripts/review-tiles.py`
    renders labelled review tiles; `scripts/tiles.py` stitches windows from the pyramid.
  - Water-aware routing (D10, subagent): `data/water-mask.png` (4096 px, zoom 3), connectors
    and off-road legs never cross water, horse mode never takes the direct off-road arc,
    `Route.warnings` surfaced in the summary.
  - Bridge flag wired through types, loader, writer, and a blue casing in the roads overlay.
  - Visual sweep of 36 zoom-4 review tiles against the old extraction: agreement is close
    wherever both have roads; the new graph adds many roads and bridges; the thin trails the
    new map omits come from the legacy import.

## Next
- Calibrate METERS_PER_PIXEL and SPEED_MPS in-game (src/config/travel.ts, D7). Check
  whether wide roads or paths are the faster class for a horse.
- Second sweep in the editor for dead ends (about 600) and trails still missing; use
  `scripts/review-tiles.py --zoom 6` on suspect windows.
- Optional: extract at zoom 6 for tighter geometry; widen manifest `bounds` if the game
  opens land beyond the Pywel frame.
- Ideas in docs/NOTES.md (fast travel, multi-stop, land-grid off-road pathing on foot).
- Publishing (Cloudflare Pages) is Rennie's call: the tiles have no reuse licence.

## Blockers
- none

## Local-only state
- `data/map/tiles/` is the th.gl pyramid (24 MB); `data/map/tiles-powerpyx/` and
  `data/map/source.jpg` are the retired source, safe to delete.

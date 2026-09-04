# Notes

Open questions, follow-ups and ideas. Design decisions live in docs/DECISIONS.md;
change a decision there first, then the code.

## Open questions

- [x] What is being routed — collectibles, quests, resource nodes, fast-travel hops?
  Answered: A→B along roads (main / sub / off-road), Horse or On foot.
- [x] Where does map/node data come from — manual entry, a wiki, datamined files?
  Answered: raster extraction (`scripts/extract-roads.py`) from the th.gl tile
  pyramid (see SOURCE.md) plus in-app tracing.
- [x] Interface: local web app, CLI, or something usable second-screen while playing?
  Answered: local web app, phone-first, usable beside the game.
- [x] Does it need to run offline / on a phone beside the TV?
  Answered: yes — `npm run build` is an offline-capable static `dist/`.

## Follow-ups

- Calibrate `METERS_PER_PIXEL` and `SPEED_MPS` in-game (`src/config/travel.ts`, D7).
  Check whether wide roads or paths are the faster class for a horse.
- Second sweep in the editor for dead ends (about 600) and trails still missing; use
  `scripts/review-tiles.py --zoom 6` on suspect windows.
- Optional: extract at zoom 6 for tighter geometry; widen the manifest `bounds` if the
  game opens land beyond the Pywel frame.
- Hosting a public copy is the maintainer's call: the tiles have no reuse licence
  (SOURCE.md), so this repo offers no hosted demo.

## Ideas for later

- Fast-travel nodes
- Multi-stop routes
- Land-grid off-road pathing on foot
- Done: water-aware off-road legs (D10), higher-resolution map source (D1)

## Local-only state

- `data/map/tiles/` is the th.gl pyramid (about 24 MB, gitignored). A
  `data/map/tiles-powerpyx/` or `data/map/source.jpg` left over from the retired
  source is unused and safe to delete.

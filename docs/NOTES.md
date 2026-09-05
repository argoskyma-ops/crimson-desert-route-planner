# Notes

Open questions, follow-ups and ideas. Design decisions live in docs/DECISIONS.md;
change a decision there first, then the code.

## Open questions

- [ ] `data/fast-travel.json` is committed while `data/pois.json` (same
  source, 20x larger) is local-only (D13). Keep the small committed file, or
  move it to local-only for consistency? Maintainer's call.
- [ ] Hosting: the companion adds hand-written content that is fine to
  publish, but the tiles and `pois.json` are still personal-use only. A hosted
  copy would need its own map source.

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

- Companion build (2026-09-05): design in `docs/COMPANION-SPEC.md`, decisions
  D12 to D18, task list with status in `docs/COMPANION-PLAN.md`. Start with T10
  and R1.
- `scripts/fetch-fast-travel.py` reads th.gl's CBOR place records and painted
  labels as `[x, y]`; they are `[y, x]`. 153 committed camps, villages, hearths
  and places sit in the sea south-east of Pywel. Fix is T10 in the companion
  plan (measured 2026-09-05: swapped, all 117 named places land on Pywel).

- Calibrate `METERS_PER_PIXEL` and `SPEED_MPS` in-game (`src/config/travel.ts`, D7).
  Check whether wide roads or paths are the faster class for a horse.
- Second sweep in the editor for dead ends (about 600) and trails still missing; use
  `scripts/review-tiles.py --zoom 6` on suspect windows.
- Optional: extract at zoom 6 for tighter geometry; widen the manifest `bounds` if the
  game opens land beyond the Pywel frame.
- Hosting a public copy is the maintainer's call: the tiles have no reuse licence
  (SOURCE.md), so this repo offers no hosted demo.

## Scaffold review

R1 in `docs/COMPANION-PLAN.md` writes its findings here.

## Ideas for later

- Fast-travel overlay (D11): markers, type filters, search, bonfires, and
  named camps/villages/places are in. Still to do: using a teleport as a
  route hop.
- Multi-stop routes
- Land-grid off-road pathing on foot
- Done: water-aware off-road legs (D10), higher-resolution map source (D1)

## Local-only state

- `data/map/tiles/` is the th.gl pyramid (about 24 MB, gitignored). A
  `data/map/tiles-powerpyx/` or `data/map/source.jpg` left over from the retired
  source is unused and safe to delete; neither exists on a fresh clone.

# crimson-desert-route-planner

Route planner for the game Crimson Desert: A-to-B road routing over the Pywel
map, horse or on foot, with an in-app road editor. Static Vite site, no backend,
no hosted demo.

## Stack
- Vite 8, React 19, TypeScript, Tailwind v4, plain Leaflet 1.9 (no react-leaflet:
  one imperative `MapView` owns the map). Zustand for state, Vitest for unit tests,
  oxlint for lint, Playwright (in the Python venv) for the smoke test.
- Python 3 scripts in `scripts/` (uv venv at `.venv`: Pillow, numpy, scipy,
  scikit-image, networkx, shapely, sknw) download the tiles and extract roads.
- Committed data: `data/roads.json` (the road graph), `data/water-mask.png`,
  `data/fast-travel.json`, `data/legacy/roads-powerpyx.json`, and the
  hand-written companion content in `data/content/` (zod contract in
  `src/content/schema.ts`; record checklist in `data/content/README.md`).
  `data/map/` (tiles, manifest, debug renders) and `data/pois.json` are
  gitignored and must never be committed; they are third-party with no reuse
  licence (see `SOURCE.md`).

## Where things live
- `docs/DECISIONS.md` is the design contract (D1 map source through D11
  fast travel, D12 to D19 for the companion). Change the decision there first,
  then the code.
- `docs/COMPANION-SPEC.md` is the companion design; `docs/COMPANION-PLAN.md`
  is its task list with status (T-tasks build, C-tasks author content,
  R-tasks review). Pick the next unticked task from there.
- `docs/NOTES.md` holds open questions, follow-ups and ideas.
- `SOURCE.md` records map provenance and the licence stance.
- `README.md` is user-facing setup and usage.
- `docs/PLAN.md`, `docs/REVIEW.md`, `docs/RESEARCH.md` are build-time working
  documents kept for history.
- `src/config/travel.ts` is the one tunable file (speeds, scale, colours, water
  constants). `src/routing/` is a pure TypeScript module with no DOM or Leaflet
  imports.

## Conventions
- Atomic commits with imperative subjects; kebab-case files and branches;
  default branch `main`.
- Before a PR: `npm run typecheck`, `npm run lint` and `npm test` green. Run
  `npm run build` too when touching `vite.config.ts` or anything under `data/`,
  and `npm run content:report` when touching `data/content/`.
- Content records: facts from any source, prose written here, at least one
  cited source per record, never copy wiki or guide text (D13).
- Coordinates everywhere are the canonical zoom-4 pixel grid (8192 x 8192, D3).

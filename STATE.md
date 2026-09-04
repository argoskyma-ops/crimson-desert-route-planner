# STATE

Session checkpoint for the Crimson Desert route-planner MVP build. A fresh session
should read this first, then docs/PLAN.md and docs/DECISIONS.md, then continue from "Next".

## Done
- docs/RESEARCH.md (map sources, road-data strategy) — subagent 1.
- docs/DECISIONS.md, docs/PLAN.md, shared contracts src/routing/types.ts + src/config/travel.ts.
- Vite + React + TS + Tailwind + Leaflet + Zustand + Vitest scaffold; typecheck/lint/build green.
- data/map/source.jpg fetched (5178x5240, gitignored). Python venv at .venv with imaging libs.

## In progress (parallel)
- T0 map pipeline (scripts/build-tiles.py, SOURCE.md) — subagent 2.
- T1 app shell + MapView — Grok (cursor-agent), main tree.
- T3 routing module — Codex, git worktree on branch `codex-routing` (merge into main when done).
- T5 road extraction (scripts/extract-roads.py -> data/roads.json) — Codex, main tree.

## Next
- Review + commit each of T0/T1/T3/T5 as they land (Codex reviews Grok diffs).
- T2 pins -> T4 route rendering -> T6a/T6b editor -> T7 README, each via Grok.
- Subagent 3 whole-repo review, subagent 4 Playwright QA + screenshot.

## Blockers
- none

## Subagent budget (cap 5)
- 1 research (sonnet) — used
- 2 map pipeline (sonnet) — running
- 3 whole-repo review — unused
- 4 QA / Playwright — unused
- 5 reserved for one gnarly debug (opus) — unused

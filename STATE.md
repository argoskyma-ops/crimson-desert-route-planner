# STATE

Session checkpoint for the Crimson Desert route-planner MVP build. A fresh session
should read this first, then docs/PLAN.md and docs/DECISIONS.md, then continue from "Next".

## Done
- T0 tiles (scripts/fetch-map.sh, build-tiles.py, SOURCE.md), T1 app shell + MapView,
  T3 routing module (13 tests), T5 first-pass extraction (data/roads.json, 245 fragments).
- docs/RESEARCH.md (map sources, road-data strategy) — subagent 1.
- docs/DECISIONS.md, docs/PLAN.md, shared contracts src/routing/types.ts + src/config/travel.ts.
- Vite + React + TS + Tailwind + Leaflet + Zustand + Vitest scaffold; typecheck/lint/build green.
- data/map/source.jpg fetched (5178x5240, gitignored). Python venv at .venv with imaging libs.

## In progress (parallel)
- T2 pins A/B (+ T1 review fixes: 44 px zoom buttons, build-only copy) — Grok, main tree.
- T5 follow-up: junction closing + wider bridging in extract-roads.py — Cursor Opus, main tree.
- T3 follow-up: dead-end off-road connectors in buildGraph (D6) — Grok xhigh-fast, worktree
  `codex-routing` at scratchpad/wt-routing (merge into main when done).

## Tooling note (2026-09-03)
- Codex quota is at ~3%: do not launch new `codex exec` runs. Use
  `cursor-agent -p --force --trust --model cursor-grok-4.6-xhigh-fast` for volume and
  `--model claude-opus-5-thinking-high` for reviews / algorithmic work.

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

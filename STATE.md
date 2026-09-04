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

- T2 pins + control panel; T3 dead-end connectors (18 routing tests); T5 junction closing
  (136 components, largest 12.7% of length); tests/unit/roads-data.test.ts dataset check.
- End-to-end smoke in Playwright: tiles, pins, route summary render with no console errors.

## In progress
- T4 route rendering + mode toggle + summary — Grok done, read-only review running, then commit.

## Tooling note (2026-09-03)
- Codex quota is at ~3%: do not launch new `codex exec` runs. Use
  `cursor-agent -p --force --trust --model cursor-grok-4.6-xhigh-fast` for volume and
  `--model claude-opus-5-thinking-high` for reviews / algorithmic work.

## Next
- T6a editor draw/select -> T6b node drag/save/import/export -> T7 README, each via Grok
  (prompts in the session scratchpad; regenerate from PLAN.md if lost).
- index.html: add `viewport-fit=cover` to the viewport meta (safe-area padding needs it).
- Subagent 3 whole-repo review, subagent 4 Playwright QA + screenshot to docs/screenshots/.

## Blockers
- none

## Subagent budget (cap 5)
- 1 research (sonnet) — used
- 2 map pipeline (sonnet) — running
- 3 whole-repo review — unused
- 4 QA / Playwright — unused
- 5 reserved for one gnarly debug (opus) — unused

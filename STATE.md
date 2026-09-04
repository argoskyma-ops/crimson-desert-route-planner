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

- T4 route rendering/summary/legend, T6a editor draw/select, T6b node drag + Save (dev
  endpoint) / Export / Import + validation, all reviewed (Grok read-only) and committed.
  Browser-verified: draw a road -> route uses it; Save -> reload keeps it; phone layout OK.

## In progress
- T7 README + safe-area polish + 3 small editor fixes — Grok xhigh-fast.
- Subagent 3 whole-repo review -> docs/REVIEW.md (opus).

## Tooling note (2026-09-03)
- Codex quota is at ~3%: do not launch new `codex exec` runs. Use
  `cursor-agent -p --force --trust --model cursor-grok-4.6-xhigh-fast` for volume and
  `--model claude-opus-5-thinking-high` for reviews / algorithmic work.

## Next
- Fix REVIEW.md blockers via Grok, commit T7.
- Subagent 4 QA: Playwright smoke test under tests/e2e/, screenshots in docs/screenshots/.
- Final verification: typecheck, lint, test, build; print the `npm run dev` URL.

## Blockers
- none

## Subagent budget (cap 5)
- 1 research (sonnet) — used
- 2 map pipeline (sonnet) — used
- 3 whole-repo review (opus) — running
- 4 QA / Playwright — unused
- 5 reserved for one gnarly debug (opus) — unused

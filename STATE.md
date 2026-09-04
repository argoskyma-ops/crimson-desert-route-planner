# STATE

Session checkpoint for the Crimson Desert route-planner MVP build. A fresh session
should read this first, then docs/PLAN.md and docs/DECISIONS.md, then continue from "Next".

## Done (MVP complete, 2026-09-03)
- T0 tiles, T1 map shell, T2 pins, T3 routing (+ dead-end connectors), T4 route
  rendering/summary/legend, T5 extraction (+ junction closing), T6a/T6b editor with
  Save/Export/Import, T7 README, T8 whole-repo review (docs/REVIEW.md) + Playwright QA
  (tests/e2e/smoke.py, docs/screenshots/), T9 review fixes. All committed on main.
- Verification: typecheck, lint, 40 unit tests, build (static dist/ with dist/data/),
  e2e smoke green on desktop and 390x844.

## Next (follow-ups, not started)
- Calibrate METERS_PER_PIXEL and SPEED_MPS in-game (src/config/travel.ts).
- Dataset cleanup in the editor: 82 tiny self-loop edges and 13 closed mini-components
  from extraction (see docs/REVIEW.md "Should fix"); trace missing river bridges.
- Ideas in docs/NOTES.md (fast travel, multi-stop, water-aware off-road).
- Publishing (Cloudflare Pages) is Rennie's call: the map image has no reuse licence.

## Blockers
- none

## Tooling note (2026-09-03)
- Codex quota ~3% and Cursor Opus monthly cap both exhausted; everything after T3/T5 ran on
  `cursor-agent --model cursor-grok-4.6-xhigh` (and `-fast`). Reviews used `--mode ask`.

## Subagent budget (cap 5)
- 1 research (sonnet) — used
- 2 map pipeline (sonnet) — used
- 3 whole-repo review (opus) — used
- 4 QA / Playwright (sonnet) — used
- 5 reserved debug (opus) — not needed

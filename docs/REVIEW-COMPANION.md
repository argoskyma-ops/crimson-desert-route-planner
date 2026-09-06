# Companion reviews

Whole-feature reviews of the companion build (docs/COMPANION-PLAN.md,
R-tasks). Each review is pasted verbatim from the read-only Grok run; the
orchestrator's status line above it says what was done with the findings.

## R2: Phase 1 (loader, search, panel, progress, editor)

Status 2026-09-05: R2 applied (commit "Apply the R2 review of companion
Phase 1", Grok, one pass). The blocking item, the ten should-fixes and
every test listed below are in. Nits applied except `ENTITY_TYPE_ORDER`
(kept for T18); the spec wording was fixed in `docs/COMPANION-SPEC.md`.
Choices made while applying: a failed file fetch aborts Save, Download,
Revert and record switch with "Could not read <type>.json" (no in-memory
rebuild); New refuses an existing id both live (issue) and at save time;
`search()` gained an `options.filter` for the id picker; the phone control
panel collapses to the title plus a Search button below 768 px while an
entity is open; the content draft stays mounted across the Roads/Content
toggle and `editor.contentDirty` feeds the refresh guard (closing the
editor still drops the draft); the `/__dev/save-content` handler moved to
`scripts/dev-save-content.ts` so `tests/unit/save-content-endpoint.test.ts`
can drive it. A GET on the endpoint still falls through to the SPA index
(pre-existing, harmless).

### R2 review: companion Phase 1 (Grok 4.6, 2026-09-05)

**Blocking** (fix before Phase 2)
- `src/components/ContentEditor.tsx:107-113` and `:173` — `loadFile()` turns any fetch failure into `{ version: 1, type, records: [] }`, then `onSave` does `upsertRecord(await loadFile(), prepared)` and POSTs that. Failing input: `GET /data/content/quest.json` returns 404, non-JSON, or a network error while the form holds a valid quest. Expected: refuse the save (“could not read quest.json”). Actual: `data/content/quest.json` is replaced by a one-record file and `loadContent()` then drops every other quest from the store. Same path on Download. Fix: build the file from `content.byType[type]` (already in memory), or abort save/download when fetch fails. Do not use `emptyFile` as a write base.

**Should fix**
- `src/App.tsx:34` / `:91-93` vs `src/components/ControlPanel.tsx:19-20` and `src/components/SearchPanel.tsx:125-126` — D16: “Bottom sheet on phones, right panel from 768 px; map stays live.” `hidePhoneChrome` only hides the editor chip and legend, not the control panel, and the search query is not cleared. On a 390×844 viewport with results open (`max-h-56` = 224 px) plus the half-height sheet (`EntityPanel.tsx:35`, `z-[1200]`), the map is fully covered (control chrome ~300 px + results 224 px + sheet ~422 px > 844). `GuideSteps.tsx:93-95` then shows “Tap the map where you are” with no map to tap unless the user hits Close (which drops the guide). Collapse the control panel (or at least the result list) while `selectedEntityId` is set under `md`, as `docs/NOTES.md` already flagged.
- `src/components/ContentEditor.tsx:132-140` and `:142-146` vs `src/store.ts:457` — `changeType` / `changeRecord` / `onRevert` call `clearPick()` (clears `picked` only). `pickTarget` stays armed. Failing input: arm `steps.0.location` on a quest, switch type to vendor (or another record), tap the map. `deliverPick` still fires; `setPath` writes `steps[0].location` onto the new draft (`KEEP_KEYS` in `content-io.ts:30` will keep `steps` on save until schema strip). Closing the editor is fine (`toggleEditor` `:468-469` and `setEditorMode` `:433-434` clear both). Also call `armPick(null)` wherever `clearPick()` runs on a type/record change.
- `src/lib/content-io.ts:266-276` — New record + an id that already exists silently replaces that record. Failing input: Content → New, name “Dead of Night” (suggested `quest:dead-of-night`), Save. Expected: reject “id already exists”. `upsertRecord` has no create-vs-replace mode.
- `src/components/content-editor/IdPicker.tsx:7-16` — `entityHits` takes the global top 8, then filters by `entityType`. Failing input: giver picker (`entityType: 'character'`), query `hernand`. Place / vendor / quest hits fill the 8; `character:…` never appears. Filter by `kind === 'entity' && type === entityType` before slicing, or raise the limit.
- `src/content/db.ts:101-104` vs `src/content/schema.ts:513` — D16: “`ContentDb` … reverse relations (sold by, dropped by, rewarded by, …) so the panel never scans.” `activity.rewards[].ref` is never added to `rewardedBy` (`indexRelations` hits `default` at `db.ts:132-134`). An item rewarded only by an activity shows no “Rewarded by”. Index `activity` the same way as `quest`.
- `src/store.ts:121` / `:272` — `contentError` is written and never read. Failed `meta.json` leaves search empty with no message (`loader.ts:105-108` already logs it).
- `src/components/entity/ItemSection.tsx:19-23` and `src/components/entity/CharacterSection.tsx:15-18` — D16 relations are also rendered from the record, so “Used in” / “Factions” appear twice (section + `Relations.tsx`). Drop the record-side copies; the db lists are complete (`usedIn` also sees `recipe.inputs`).
- `src/components/entity/EntityLink.tsx:24` — D2/plan 44 px targets. Links are `min-h-8` (32 px). Every relation, prerequisite, reward, and `[[id]]` in the sheet is a miss. Use `min-h-11`.
- `src/components/EditorPanel.tsx:152-155` — Switching Roads ↔ Content unmounts `ContentEditor` and drops the draft. `App.tsx:71-78` `beforeunload` watches only `editor.dirty` (roads). An in-progress quest is lost on mode switch or refresh.
- `vite.config.ts:218-229` — After `ContentFileSchema.safeParse(file)` the handler writes the raw `file`, not `result.data`. Extra keys that zod would strip are committed. Write `JSON.stringify(result.data, null, 2)`.

**Nits**
- `src/content/search.ts:6-11` — `ids.ts:8-9` requires `.ts` specifiers inside `src/content/` (plain `node` / `content-report`). `../config/travel` and `../lib/fast-travel-loader` omit them. In-folder imports are correct.
- `docs/COMPANION-SPEC.md:189` “drag to full” is an Expand/Collapse button (`EntityHeader.tsx:39-40`), not a drag. D16 does not require drag.
- `src/App.tsx:105` — Editor toggle still says “Edit roads” after Content mode exists.
- `src/content/types.ts:110-128` — `ENTITY_TYPE_ORDER` is unused. Search groups by first ranked hit (`search.ts:205-216`), which matches SPEC §5 “head match first”. Leave the constant for T18.
- `src/lib/content-io.test.ts:40-49` — `toMatch(/sources|id/)` passes on either field; it does not prove both are required.
- `src/components/entity/VendorSection.tsx:21` / `EnemySection.tsx:24` / `RecipeSection.tsx:13` — `key={line.item}` / `drop.item` / `input.item` collide if the same id appears twice (schema allows it).
- `src/components/entity/PlaceSection.tsx:9` — `fastTravel` is dumped as a raw string; a bad id has no `UnknownId` treatment.
- `src/content/search.ts:89-98` — Alias match is exact/prefix only, not word-prefix. Query `horse` against alias `black horse` is tier `fuzzy`.

**Looks right**
- D12 loader: missing/invalid listed files warn once and skip (`loader.ts:43-47`); db is never null; filename must match `file.type` (`:79-82`); `buildContentDb` keeps the first duplicate id (`db.ts:67`).
- D16 reverse maps: `soldBy`, `droppedBy`, `rewardedBy` (quest / collectible / collection), `usedIn` (recipe inputs + `item.usedIn`), `foundIn` (`place.contains`), `memberOf` (character factions + faction members/leader). Duplicates de-duped. Dangling refs do not throw.
- D15 index: fields `name` / `aliases` / `tags` / `summary` / `type`, boost name×3 aliases×2, `prefix: true`, `fuzzy: 0.2`, `combineWith: 'OR'` (`search.ts:178-187`). Hits grouped by `type`, ranked exact → prefix → fuzzy then score. Enter opens `topHit`. Search hit calls `selectEntity` (also sets `highlight`, `store.ts:277-286`) and pans only when `map === 'pywel'`. Fast-travel chips live in `SearchPanel`; `FastTravelSearch.tsx` is gone. `poiTypes` is already an argument; the panel passes `[]`.
- D16 chrome: `md` (768) right panel, below that a bottom sheet. Header has name, type badge, region, “checked against {gameVersion}”, Show on map, Close. `[[id]]` only when `isEntityId`; unknown ids are amber plain text (`EntityLink.tsx:4-8`). No `dangerouslySetInnerHTML`. Markdown is paragraphs / `**bold**` / `- ` lists / links (D16). No images (D13).
- D16 progress: key `cd-companion:progress:v1`, shape `{ version: 1, steps, quests, collected }`. Step keys `#g<j>` / `#a<i>s<j>`. Export downloads, import replaces, older `version` throws a readable error. Extra JSON keys are ignored; `localStorage` missing or throwing yields empty progress and a silent save no-op.
- D16 Route here: `setPin('b', { x, y })`; if A is unset, “Tap the map where you are”. `placePin` then fills A, so a route appears once both exist. Abyss steps hide Route here and disable Show (`GuideSteps.tsx:50, 88-104`) so abyss pixels are not dropped on Pywel (D3).
- D19 defaults: empty `confidence` → `"verified"`, empty `gameVersion` → `meta.game.version`, empty `accessed` → today (`content-io.ts:244-253`). Save runs `ContentFileSchema`. `POST /__dev/save-content` is dev-server only, same-origin as save-roads, 5 MB cap, `type` must be an `ENTITY_TYPES` member (no path traversal), `file.type` must match, schema rejects `id` of another type (`schema.ts:562-567`). Atomic tmp+rename. `meta.json` is never written. Production `saveContentDev` returns `dev only` and the UI downloads. Closing the editor with a pick armed clears `pickTarget` and `picked`; the next tap is `placePin`.
- Rules: no DOM/Leaflet/`node:` under `src/content/`; no `node:` under `src/`; picks rounded to one decimal (`store.ts:447-451`); Vite copies `data/content/` into `dist/`.
- T15–T18 can extend this without a rewrite: pass `poiTypes` into `SearchPanel` (today hardcoded `[]`; `poi-type` hits are a no-op at `:75-76`); call existing `toggleCollected` / `toggleCollectedDone` for POI nodes; compute storyline “next” from `chapters` + `progress.quests` in the T17 replacement of `StorylineSection`; T18 facets should filter `ContentDb` (region / rarity / rank / collection are not search fields). `CollectionSection` / `RegionSection` scan `byType` — add an index later if you want, it is not a loader rewrite. Skills stay unjoined (D12). Nested rewards / inventory / chapters are JSON fields in the editor; that is enough for C-tasks.

**Tests (untested that matters; none assert the opposite of the contract)**
- No test for the `loadFile()` empty-file save wipe, `upsertRecord` on an existing id from New, or `pickTarget` surviving a type/record change.
- No test of `/__dev/save-content` (cross-origin 403, `type` traversal, `file.type` mismatch, oversized body, extra keys persisted).
- No search cases for punctuation-only (`...`), one-letter queries, or `map: "abyss"` (no pan / no highlight marker).
- No `parseProgress` case with extra keys (should succeed) or `loadProgress(null)` when `localStorage` is missing.
- Seed search test (`tests/unit/content-search.test.ts`) covers `rokade` only; `nexus` is covered on a fixture, not `data/fast-travel.json`.
- `content-io` empty-record test is too loose (`sources|id`). Ranking tests (exact > prefix > fuzzy, alias, POI type, group-by-best-hit) match D15.

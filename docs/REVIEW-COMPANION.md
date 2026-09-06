# Companion reviews

Whole-feature reviews of the companion build (docs/COMPANION-PLAN.md,
R-tasks). Each review is pasted verbatim from the read-only Grok run; the
orchestrator's status line above it says what was done with the findings.

## R3: Phase 2 (POI fetch, loader, canvas layer, layers panel)

Status 2026-09-06: applied (commit "Apply the R3 review of the POI
layers", Grok, one pass). The blocking item (popup dismissal placed a pin)
and every should-fix and nit below are in, except the three that do not
stand (next paragraph). While verifying, the orchestrator removed a
wholesale `popup.off('remove')` from `closePoiPopup`: it also stripped
Leaflet's own once-listener that unhooks a closed popup from zoom
animations, which surfaced as "Cannot read properties of null (reading
'_latLngToNewLayerPoint')" on the next zoom. Orchestrator spot-check before
the review: the
1,631 nodes that `data/pois.json` shares with the committed
`data/fast-travel.json` (teleports, bonfires, camps, villages, hearths,
castles) match it within 0.1 px with identical names; of 50 random named
nodes, 43 are on land per the water mask and the 7 on water are Abyss-entry
quest markers ("Find the Abyss Nexus") and one stone-tablet quest at sea.
Decisions on the findings that do not stand as written: `resolve_label`'s
`@` hop is correct as coded (the page keys the hop targets as `"@1dtpxb"`;
measured 2026-09-06: every one of the 61 groups and 845 types resolves with
no conflicting label); `greymane_shrine` (Totem) is already in
`POI_CHECKABLE_TYPES` and the `hidden_` / `crafting_manuals` prefixes match
th.gl group ids that exist in the taxonomy with no nodes today, so they
stay; progress keys stay `poi:<th.gl id>` (the ids were stable across the
2026-09-03 and 2026-09-06 dumps), with the type-plus-position remap noted
in `docs/NOTES.md` as the fallback if a re-fetch ever orphans keys.

### R3 POI layers review (Cursor/Grok 4.6, 2026-09-06)

**Blocking** (fix before T17)
- `src/components/MapView.tsx:151-158` and `src/components/PoiLayer.ts:112` — `placePin(clamped)` runs on every map `click` that `poiHitTest` misses, and the POI popup is `L.popup({ maxWidth: 260, autoPan: true })` with Leaflet’s default `closeOnClick` (map `closePopupOnClick: true`). Leaflet binds that close to **`preclick`** (`node_modules/leaflet/dist/leaflet-src.js:10275-10276`), then the same gesture fires `click`. Failing input: zoom ≥ 3, open a disc popup, tap empty map to dismiss (the 44 px path; the stock close “×” is ~20 px). Expected: popup closes, pins unchanged. Actual: `remove` → `focusPoi(null)`, then `placePin` drops A or B. Fast-travel markers swallow the click; this canvas is `pointerEvents: 'none'` (`PoiLayer.ts:316`), so the map always gets it. Fix: `L.popup({ closeOnClick: false, … })` and in the map click handler, if `poiPopup` is open and `poiHitTest` is null, `closePoiPopup` and `return` (no `placePin`). A disc tap still opens/switches the popup and must not place a pin; an empty-map tap with no popup still places a pin.

**Should fix**
- `src/config/pois.ts:77` / `src/components/PoiLayer.ts:143` — `POI_HIT_RADIUS_CSS_PX = 16` vs a 5 px disc (`:74`) and a 44 px finger. `bestDist` starts at 16, so a tap whose container point is 17–22 px from the disc is a miss and `placePin`s. On the phone-beside-TV that is “tap the icon, get pin A”. Set the constant to `22` (44 px diameter) and keep the hit `pad` as `POI_HIT_RADIUS_CSS_PX / scale`.
- `src/components/PoiLayer.ts:128-129` / `src/components/MapView.tsx:158` — `if (map.getZoom() < POI_CLUSTER_BELOW_ZOOM) return null`. Default phone view is `fitBounds` of `[1024, 1544, 6248, 6832]` on ~390×844 → zoom ≈ 0.25 (`MapView.tsx:119-120`). Every tap, including a tap on a 38 px count badge (`PoiLayer.ts:207-226`), is `placePin`. Hit-test cluster centres with the same 22 px radius and either `setView` that cell at zoom 3 or swallow the click (do not place a pin on a badge).
- `src/components/PoiLayer.ts:197-205` and `:392` — `map.on('move', repositionAndRedraw)` calls `clusterPois(...)` on every pan frame while `zoom < 3`. At zoom 0.25, `cellSize = 64 / scale` (`scale ≈ 2^(0.25-4) ≈ 0.074`) and the padded viewport is the whole 8192 image: `visiblePois` walks all ~1024 index cells and pushes every enabled node (up to 23 483), then `clusterPois` (`poi-index.ts:110-136`) allocates a `Map` plus a `groupCounts` `Map` per live cell, and `cellKey` (`:25-27`) builds `` `${cellX}:${cellY}` `` for each. World-aligned clusters do not change on pan. Cache `{ zoom, poiGroups, cellSize } → PoiCluster[]` (or cluster the whole index once below zoom 3) and only cull/draw in `paint`.
- `src/components/PoiLayer.ts:231-257` — each disc-mode `paint` does `visiblePois(...)` (new array), `new Set(progress.collected)`, `new Map` × 2, then `bucket.set(groupId, [node])` per first node of each group. At zoom 3 with all groups on, a 1280×900 view is ~2560×1800 canonical px (~88 index cells, a few thousand nodes). Keep the `Set`/`Map`s on the layer instance and rebuild them only when `progress.collected` or `poiGroups` change; `move` should reuse them.
- `src/components/PoiLayer.ts:325-339` — every `draw()` runs `ensureSize`: `canvas.getContext('2d')` and `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` even when `canvas.width === width`. On a phone `dpr` is 2–3 (390×844×3 backing store). Cache the context after the first success; `setTransform` only when width/height/dpr change. There is no `visualViewport` / `matchMedia('resolution')` listener (`MapView.tsx` only relies on Leaflet `trackResize` → `resize`). A URL-bar show/hide or dpr change without a window `resize` leaves a stale backing store. Observe the map container or `visualViewport`, `invalidateSize()`, then `ensureSize`.
- `src/components/PoiLayer.ts:45-53` and `:378-381` — `closePoiPopup` does `poiPopup = null; … popup.off('remove'); map.closePopup(popup)`, so the `remove` handler (`:115-119`) never runs `focusPoi(null)`. Opening the editor (`store.ts:546-551` sets `editor.active` and does not touch `focusedPoiId`) hits the subscribe branch, closes the popup, and leaves `focusedPoiId` set. Closing the editor does not reopen the popup (`:383` requires `focusedPoiId !== prev`). Result: highlight ring with no popup, or no ring (paint bails while `editor.active`) and a stale focus afterwards. Call `focusPoi(null)` inside `closePoiPopup`.
- `src/components/PoiLayer.ts:367-389` — subscribe redraws on `poiGroups` but does not close the popup when the focused node’s group is now `false`. `visiblePois` then omits the node (`poi-index.ts:85-86`), so the ring vanishes and the popup stays (Collected still writable). Same for Layers “All off” (`LayersPanel.tsx:111-112`). If `focusedPoiId` is set and `poiGroups[poiGroupOf(...)] !== true`, close the popup and `focusPoi(null)` — or keep drawing that one node while the popup is open.
- `src/store.ts:351-356` — a successful `setPois(file)` keeps `focusedPoiId` even when the new `byId` no longer has that id (th.gl id changed). Subscribe (`PoiLayer.ts:378`) will not close an already-open popup. After rebuild, if `!poiIndex.byId.has(s.focusedPoiId)` set `focusedPoiId: null` and close the popup.
- `src/config/pois.ts:45-63` — D14/SPEC §7 checkable set is chests, memory fragments, sealed artifacts, hidden gear, manuals, constellations, totems, skill training. `POI_CHECKABLE_GROUP_PREFIXES = ['hidden_', 'crafting_manuals']` is documented as matching groups that “none carry nodes today”; `fetch-pois.py:167-169` drops empty groups, and the nine live groups are the keys in `POI_GROUP_DEFAULTS` (`pois.ts:6-16`). Those prefixes never fire on the dump. Totems / hidden-gear / manual **type** ids are not in `POI_CHECKABLE_TYPES`, so their popups have no Collected toggle. Put the live type ids from the dump into `POI_CHECKABLE_TYPES` and drop the dead prefixes (or keep them only if a future group id actually matches).
- `src/config/pois.ts:67-68` / `src/content/pois-loader.ts` ids — `poiProgressKey` is `` `poi:${nodeId}` `` and node ids embed th.gl world coords at two decimals (`mine_iron@-9355.61:-5088.47`). A re-run of `fetch-pois.py` that changes the id string orphans every `poi:*` key in `cd-companion:progress:v1`. On `setPois`, remap collected keys whose id vanished by matching `type` + canonical `(x, y)` within 1 px, or store `poi:${type}@${x.toFixed(1)}:${y.toFixed(1)}` (this repo’s rounded px, not th.gl’s world pair).
- `src/content/pois-loader.ts:44-50` — `res.json()` failures are `catch { return null }`. A truncated or HTML `data/pois.json` (200 + non-JSON) looks like a missing file: `App.tsx:65-66` `setPois(null)` with no `poisError`, and `LayersPanel.tsx:54-55` says “Generate it with … fetch-pois.py”. `validatePois` throws and already surfaces (`App.tsx:67-69`). Do not swallow `res.json()`; let it reject.
- `src/components/LayersPanel.tsx:25-34` — `for (const node of pois.nodes)` (23 483) on every `progress.collected` change while Layers is open (popup Collected, import). Invert: walk `collected`, strip the `poi:` prefix, `poiIndex.byId.get(id)`, increment that type.
- `src/components/ControlPanel.tsx:31` / `:93` — `max-[479px]:max-h-dvh` + `overflow-y-auto` and no `pb-[env(safe-area-inset-bottom)]`. Nine `min-h-11` group rows plus search/chips/All off on a 390×844 viewport fill the sheet; `pointer-events-auto` covers the map (D16: map stays live). Cap the layers list (`max-h-[40dvh] overflow-y-auto`) and add the bottom safe-area padding so All off / Defaults are not under the home indicator.
- `src/components/PoiLayer.ts:225-226` — `ctx.fillStyle = '#ffffff'` on `globalAlpha = 0.35` fills of `#fde047` / `#4ade80` (treasures / gathering). White on a 35% yellow square over desert tiles fails contrast for `formatClusterCount` (`:23-27`, including `1.2k`). `strokeText` a dark halo, or fill the badge at ≥ 0.75 alpha with dark text.
- `scripts/thgl.py:87-110` / `scripts/fetch-pois.py:266-268` — `parse_label_pairs` first-wins every `"k":"v"` on the RSC page; `resolve_label` hops with `pairs.get(value)` where `value` is `"@foo"` (does not strip `@`). T15 and `fetch-fast-travel.py:97-99` **skip** `@` values. A hop that looks up `"@foo"` instead of `"foo"` never resolves; a random earlier pair can become a type/node label (`or title_case_id` only runs when resolve returns `None`). Restrict keys to filter type/group ids and node ids; skip `@` / `*_desc` as T15 says (or hop via `value[1:]` and reject a second `@`). `_desc` is only skipped when the **lookup key** ends with `_desc` (`thgl.py:100-101`), not when the first page pair for that id is a description.

**Nits**
- `src/components/PoiLayer.ts:80-91` — Collected is 44 px but has no `aria-pressed`. Leaflet’s popup close control is still the stock ~20 px hit (no CSS override in `src/index.css`).
- `src/components/PoiLayer.ts:207` — `Math.max(18, cellCss * 0.6)` is always 38.4 because `cellSize * scale === 64`.
- `src/components/MapView.tsx:151` — `if (map)` is always true in that closure.
- `src/components/SearchPanel.tsx:84` — `poi-type` with `mapRef.current === null` uses `{ x: 4096, y: 4096 }` and `focusPoi` without a pan. Map is usually ready before `pois.json`; if not, the later `attachPoiLayer` initial-focus path (`PoiLayer.ts:397-400`) opens the popup at `fitBounds`. Use the Pywel centre or queue `setView` until the map exists.
- `src/components/LayersPanel.tsx:111-122` — All off / Defaults call `setPoiGroup` once per group (nine store updates). One `set` that writes the whole `poiGroups` map.
- `src/components/PoiLayer.ts:29-37` — `labelsFor` walks all groups/types on every popup open. Build `type → { typeLabel, groupLabel }` once in `buildPoiIndex`.
- `scripts/fetch-pois.py:256-258` — `if ident in seen: continue` drops duplicate CBOR ids with no stderr line. Print the id. Exit 1 if `len(nodes) == 0` after the read so a bad dump cannot overwrite a good `data/pois.json` with an empty valid file (`fetched` still changes by calendar day, so “idempotent” is same-day only).
- `src/content/pois-loader.ts:233` — `x > imageSize[0]` allows `x === 8192` (matches `thgl.in_image`). `imageSize` is not required to be `[8192, 8192]`; empty groups/types are allowed (the script drops them; the loader will not).
- `src/content/poi-index.ts:133-135` — dominant group uses `next >` (not `>=`), so ties keep the incumbent (first type in `visiblePois` order: index cell, then file order). Fine, but untested.

**Looks right**
- D14 fetch: CBOR `[id, [worldY, worldX, z]]` → `coords[1]`/`coords[0]` (`fetch-pois.py:243-244`); origin `hypot < 2000`; `in_image`; atomic `tmp.replace`; types without nodes and empty groups dropped; loader rejects duplicate group/type/node ids and undeclared types; 404 → `null`; bad shape → throw → `poisError`.
- `setPois` keeps session toggles (`store.ts:347-349`); `setPois(null)` clears index + `focusedPoiId` and keeps `poiGroups` (`:337-343`); `focusPoi` turns the node’s group on (`:373-376`).
- Search: `poiTypeInfos` is one doc per type (`pois-loader.ts:105-112`); `tags: [poi.id]` (`search.ts:169`) so two “Grindstone” types (`grindstone` vs `mine_blacksmith`) both exact-name, and `grindstone` ranks first on the id tag; they group under different `poi.group`s. `openHit` + `focusPoi` enables a disabled group and pans when `mapRef` is set. Index rebuild on `pois` identity only is cheap (102 type docs).
- Cluster cells are world-aligned to (0,0) with `cellSize = 64 / scale`; pan does not re-bucket. Viewport pad is one cluster cell (`PoiLayer.ts:199`). `visiblePois` is edge-inclusive. `formatClusterCount`: 999 → `"999"`, 1000 → `"1k"`, 1100 → `"1.1k"`.
- Overlapping discs: nearest container distance, `dist <= bestDist` (later file-order node wins a tie). Editor: `poiHitTest` and the map click both no-op POIs when `editor.active`. Canvas is `leaflet-zoom-hide`; `zoomend`/`viewreset`/`move` redraw — skipping `zoomanim` is correct. StrictMode: `attachPoiLayer` cleanup removes the canvas, unsubscribes, and closes the popup; one pane, one module-level popup. `buildPoiIndex` is once-per-load (~1024 cell keys, same node refs). No DOM marker per node. Group buttons are `min-h-11` + `aria-pressed`. Popup Collected is 44 px. Subscribe ignores unrelated store slices (`PoiLayer.ts:368-376`).

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

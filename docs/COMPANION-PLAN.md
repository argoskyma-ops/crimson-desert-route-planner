# Companion plan

Task list for the companion build (design: `docs/COMPANION-SPEC.md`,
contract: `docs/DECISIONS.md` D12 to D18). Each task is sized for one
external-coder call (Cursor/Grok), owns an explicit set of files and has an
acceptance check. Tick the box when the commit lands.

Global acceptance for every task: `npm run typecheck`, `npm run lint` and
`npm test` green (`npm run build` too when `vite.config.ts` or `data/`
changes); only the listed files change (plus tests for them); one commit
with an imperative subject. Read `CLAUDE.md`, the decision(s) named in the
task and `src/content/schema.ts` before starting. Do not change the schema
in a T-task; if it is wrong, stop and open a note in `docs/NOTES.md`.

Conventions: coordinates are canonical zoom-4 px (D3); no DOM or Leaflet in
`src/content/`; 44 px touch targets; dark UI chrome like the existing panels.

## Phase 0. Fixes

- [ ] **T10. Fix fast-travel coordinate order.** (D14)
  Files: `scripts/fetch-fast-travel.py`, `data/fast-travel.json`,
  `tests/unit/fast-travel-data.test.ts`.
  th.gl CBOR records are `[id, [worldY, worldX, z]]` and painted labels are
  `"position": [y, x]`; the script reads both as `[x, y]`, so 153 of 1,253
  committed points (61 camps, 19 villages, 64 hearths, 9 places) sit in the
  sea south-east of Pywel. In `collect_cbor_places` use `coords[1]` as world
  X and `coords[0]` as world Y; in `collect_labels` swap likewise. Re-run
  the script and commit the regenerated file. Extend the data test: every
  camp, village and place lies inside the manifest bounds
  `[1024, 1544, 6248, 6832]`, and at least 95% of them are on land per
  `data/water-mask.png` (use `tests/unit/water-mask-file.ts`).
  Accept: test passes; Hernand Castle lands on the castle at the south of
  the central landmass (the label sits just east of the walled city, about x 2423, y 5054; all 117 named camps, villages and castles and all 9 labels land on Pywel after the swap), not
  on an island.

- [ ] **R1. Review the scaffold.** Read D12 to D18, `src/content/schema.ts`,
  `src/content/ids.ts`, the seed files in `data/content/` and
  `tests/unit/content-data.test.ts`. Report (in `docs/NOTES.md` under
  "Scaffold review") anything that will not serve T11 to T19 or the
  C-tasks: missing fields, wrong enums, an id rule that will collide,
  a seed that contradicts a source. Fix typos in place; propose schema
  changes as a note, do not apply them.

## Phase 1. Foundation

- [ ] **T11. Content loader and store slice.** (D12, D16)
  Files: `src/content/loader.ts` (+ test), `src/content/db.ts` (+ test),
  `src/store.ts`, `src/App.tsx`, `vite.config.ts`.
  `loadContent()` fetches `/data/content/meta.json`, then every file it
  lists, validates each with `parseContentFile` from `schema.ts`, and
  returns a `ContentDb`: `byId`, `byType`, `meta`, and reverse relations
  (`soldBy`, `droppedBy`, `rewardedBy`, `usedIn`, `foundIn`, `memberOf`)
  built by `buildContentDb(files)` in `db.ts`. A missing or invalid file
  logs one warning and is skipped; the db is never null. Store gains
  `content: ContentDb`, `contentError`, `selectedEntityId`,
  `selectEntity(id | null)`. `vite.config.ts` serves and copies
  `data/content/` like `roads.json`. Accept: `db.byId.size` equals the
  number of seed records; every reverse relation on the seeds is present;
  `npm run build` output contains `dist/data/content/meta.json`.

- [ ] **T12. Global search.** (D15)
  Files: `src/content/search.ts` (+ test), `src/components/SearchPanel.tsx`,
  `src/components/ControlPanel.tsx`, `src/store.ts`; delete
  `src/components/FastTravelSearch.tsx` after moving its chips.
  `buildSearchIndex(db, fastTravel, poiTypes)` returns a MiniSearch with
  documents `{ id, kind: 'entity' | 'place' | 'poi-type', type, name,
  aliases, tags, summary }`; `search(index, query, limit)` returns hits
  grouped by type, exact name first, then prefix, then fuzzy. The panel
  shows grouped results, opens an entity on tap (`selectEntity`), pans to a
  place or a POI type (turns its group on). Accept: tests for exact >
  prefix > fuzzy, alias hit, POI type hit; "rokade" finds the mount seed;
  "nexus" still lists fast-travel points.

- [ ] **T13. Entity panel.** (D16)
  Files: `src/components/EntityPanel.tsx`, `src/components/entity/*.tsx`
  (one section component per entity type), `src/lib/mini-markdown.ts`
  (+ test), `src/App.tsx`, `src/index.css`.
  Bottom sheet under 768 px, right panel above. Header (name, type badge,
  region, confidence and game version, Show on map, Close), summary,
  rendered body, type sections driven by the record (rewards, acquisitions
  with nested steps, inventory, drops, chapters, prerequisites), then
  relations from the db. `[[id]]` links call `selectEntity`. Show on map
  pans to `location` and drops a highlight marker (`MapView` gets a
  `highlight` prop from the store). Accept: every seed record renders with
  no console errors; a `[[quest:...]]` link navigates; unknown ids render
  as plain text with a warning style.

- [ ] **T14. Guide steps and progress.** (D16)
  Files: `src/content/progress.ts` (+ test), `src/components/GuideSteps.tsx`,
  `src/components/EntityPanel.tsx`, `src/store.ts`.
  `progress.ts`: load/save `cd-companion:progress:v1`, `toggleStep(key)`,
  `toggleQuest(id)`, `toggleCollected(id)`, `exportProgress()`,
  `importProgress(json)`, version guard. Step keys are `<entityId>#<index>`.
  `GuideSteps` renders steps with checkboxes, action icon, cost, missable
  line, and *Route here* on located steps (calls `setPin('b', location)`;
  if pin A is null shows "Tap the map where you are"). Export/Import
  buttons in the panel footer. Accept: progress survives reload; import of
  an older version is rejected with a message; Route here produces a route
  when both pins exist.

## Phase 2. POI layers

- [ ] **T15. POI fetch script and loader.** (D14)
  Files: `scripts/fetch-pois.py`, `src/content/pois-loader.ts` (+ test),
  `tests/unit/pois-data.test.ts`, `.gitignore` (already lists
  `data/pois.json`), `SOURCE.md`.
  Reuse the page parsing and CBOR reader from `scripts/fetch-fast-travel.py`
  (import it or move shared code to `scripts/thgl.py`). Extract the
  `filters` array from the page (`"filters":[{"group":...,"values":[...]}]`),
  keep `group` and value `id`s, take labels from the page's name dictionary
  (skip `@key` values, fall back to a title-cased id). Decode every CBOR
  record `[id, [worldY, worldX, z]]`, map to canonical px with the page
  transformation, drop records within 2000 world units of the origin or
  outside the image, and write `data/pois.json` per D14. Print counts per
  group. Loader validates shape, returns null on 404. Data test runs only
  when the file exists. Accept: about 23,000 nodes, ≥ 95% inside the
  manifest bounds; `mine_iron` count near 2,800; script is idempotent.

- [ ] **T16. POI canvas layer and layers panel.** (D14)
  Files: `src/components/PoiLayer.ts`, `src/components/LayersPanel.tsx`,
  `src/config/pois.ts`, `src/components/MapView.tsx`,
  `src/components/ControlPanel.tsx`, `src/store.ts`, `src/App.tsx`.
  A Leaflet canvas layer draws visible nodes of enabled groups as 5 px discs
  (group colour from `config/pois.ts`); below zoom 3 it draws grid-cell
  counts instead. Tap → popup with type label, name if any, and for
  checkable types a *Collected* toggle (progress). Layers panel: groups with
  counts, collected/total for checkable types, defaults per D14, a "generate
  data/pois.json" hint when missing. Accept: all groups on at zoom 6 stays
  above 30 fps on a phone-class device (measure with the Performance tab
  and note the number in the commit message); toggles persist for the
  session; no DOM marker per node.

## Phase 3. Quests and storylines

- [ ] **T17. Storyline and quest views.** (D12, D16)
  Files: `src/components/entity/StorylineSection.tsx`,
  `src/components/entity/QuestSection.tsx`, `src/components/QuestLog.tsx`,
  `src/components/ControlPanel.tsx`.
  Storyline: chapters with quests, done state from progress, next
  undone quest highlighted, points-of-no-return shown before the chapter
  that triggers them. Quest: prerequisites (unmet ones flagged), steps via
  `GuideSteps`, rewards as entity links, missable and repeatable badges.
  QuestLog tab: main storyline progress, faction storylines by region.
  Accept: marking a quest done advances the storyline's next pointer;
  prerequisites resolve to entity links.

## Phase 4. Codex

- [ ] **T18. Codex browser.** (D12)
  Files: `src/components/Codex.tsx`, `src/components/entity/*.tsx`,
  `src/components/ControlPanel.tsx`.
  Browse by type with facets (region, faction, rarity, category, rank,
  collection); item pages list acquisitions and "used in"; vendor pages list
  inventory with prices; recipe pages show inputs with "where to get" links;
  enemy pages show drops; collection pages show found/total from progress.
  Accept: every facet filters correctly on the seeds; counts match the db.

- [ ] **T19. About and disclosure.** (D13, D17)
  Files: `src/components/About.tsx`, `src/App.tsx`, `README.md`.
  About panel: unofficial fan project disclosure, game version from
  `meta.json`, data licence summary, link to `SOURCE.md`. README gains a
  "Companion" section and the disclosure. Accept: text matches D13.

## Phase 5. Content campaigns

Each C-task is one Cursor/Grok call that adds or updates records in one or
two `data/content/*.json` files following `data/content/README.md` (record
checklist). Run `npm run content:report` before and after; the after
numbers go in the commit message. Coordinates come from your own map reading
(the in-app map at zoom 5/6 with `data/pois.json` loaded locally is fine),
never by copying `pois.json` records wholesale.

- [ ] **C1. Regions and places.** `region.json`, `place.json`. The five
  regions plus the Abyss layer, their named sub-areas, and every town,
  village, castle and camp already named in `data/fast-travel.json` (use its
  coordinates; the ids are stable). Target: 5 regions, ≥ 20 sub-areas, ≥ 120
  places.
- [ ] **C2. Factions and characters.** `faction.json`, `character.json`. All
  factions in `docs/RESEARCH-COMPANION.md` section 3 (houses, guilds,
  Greymanes, Black Bears, Jackals, hostile groups), the three playable
  characters, Greymane companions, antagonists, and every named vendor.
  Target: ≥ 25 factions, ≥ 60 characters.
- [ ] **C3. Main storyline.** `storyline.json`, `quest.json`. Prologue, the
  twelve chapters and the epilogue as one storyline; every main quest with
  giver, start location, steps, rewards, prerequisites, and
  points-of-no-return on the chapters that trigger them. Target: ≥ 160
  quests.
- [ ] **C4. Faction questlines, Hernand first.** `storyline.json`,
  `quest.json`. One storyline per faction with quests; commissions,
  requests and bounties as `kind` records. Then Pailune, Demeniss, Delesyia,
  Crimson Desert. Target: ≥ 250 quests total after all regions.
- [ ] **C5. Unique gear and sets.** `item.json`. Every named unique weapon
  and armour piece, sets as items sharing `setName` with one acquisition
  per branch (boss drop, chest, vendor, craft). Refinement notes in `body`.
  Target: ≥ 150 items.
- [ ] **C6. Collectibles.** `collection.json`, `collectible.json`. Sealed
  Abyss Artifacts, memory fragments, collection chests, anamorphic
  constellations, totems, treasure maps, bells, legendary horses as
  collections with `total` and `poiType`; individual records with a location
  and a short guide for every one that has a puzzle or a hidden entrance.
  Target: every collection defined; ≥ 300 individual collectibles.
- [ ] **C7. Vendors, recipes, skills, mounts, enemies, activities.**
  `vendor.json`, `recipe.json`, `skill.json`, `mount.json`, `enemy.json`,
  `activity.json`. Every shop with its inventory and prices; every recipe
  with station and inputs; the three skill trees per character; all horses
  and tameable mounts with how to get them; every boss (story, world,
  legendary animal) with drops and a strategy; minigames and life skills
  with rules and rewards. Target: ≥ 80 vendors, ≥ 150 recipes, ≥ 120
  skills, ≥ 15 mounts, ≥ 80 enemies, ≥ 12 activities.
- [ ] **C8. Patch follow-up.** After each patch: bump `meta.json`, re-check
  records the notes mention, bump their `gameVersion`, add new content.
  First scheduled for the 2.02 notes and for "Charting the Unknown"
  (2026-10-15).

## Phase 6. Later

- [ ] Abyss map (second pyramid and node dump; `map: "abyss"` locations).
- [ ] Route through a guide: chain located steps into one multi-stop route;
  teleport-aware routing (D11 follow-up).
- [ ] Merge the fast-travel overlay into POI groups.
- [ ] Extend `tests/e2e/smoke.py`: search, open panel, route here.

## Review tasks

- [ ] **R2.** After Phase 1: whole-feature review of loader, search, panel,
  progress against D12, D15, D16. Findings to `docs/REVIEW-COMPANION.md`.
- [ ] **R3.** After Phase 2: POI layer performance and correctness (spot-check
  50 nodes against the th.gl site at zoom 6).
- [ ] **R4.** After each C-task: sample 10% of new records, check every
  source URL resolves and supports the facts, check no sentence is copied.

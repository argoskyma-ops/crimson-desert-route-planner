# Companion design: from route planner to full playthrough guide

Written 2026-09-05. This is the design for growing the route planner into a
complete Crimson Desert companion: search anything in the game and get a
step-by-step guide, with every quest, place, item, collectible, vendor,
character and faction on the same map. The decisions it depends on are
D12 to D18 in `docs/DECISIONS.md`; the build order and task list are in
`docs/COMPANION-PLAN.md`.

## 1. Goal and non-goals

**Goal.** One tool beside the game that answers: *where is X, how do I get it,
what do I do next, what am I missing.* Concretely:

- One search box over everything: quests, storylines, places, items,
  collectibles, vendors, recipes, skills, enemies, mounts, characters,
  factions, regions, activities.
- Every record opens a panel with its facts and its relations (who sells it,
  what drops it, which quest gives it, what it is used for).
- Anything obtainable has an **acquisition guide**: ordered steps with a map
  location per step, prerequisites, cost, missable flag, and a *Route here*
  button that uses the existing router.
- Progress tracking (done / collected) that survives reloads and can be
  exported, so the tool also answers "what have I not found yet".
- Map layers for every point-of-interest type the game has, from mines and
  herbs to hidden gear and memory fragments, toggled by group.
- Content kept current with the latest patch (2.01.00 at time of writing,
  see `data/content/meta.json`) and ready for the "Charting the Unknown"
  expansion on 2026-10-15.

**Non-goals (for this design).** No backend, no accounts, no hosted demo
(D2 stands). No screenshots or third-party images in the repo. No copying of
guide prose from other sites (D13). The Abyss map, multi-stop routing and
teleport-aware routing stay in "later" (section 9).

## 2. Approaches considered

1. **Static content JSON + client search (chosen).** Content lives in
   `data/content/*.json`, validated by zod schemas, indexed in the browser
   with MiniSearch. Fits D2 (static Vite site), keeps the data reviewable in
   pull requests, and lets Cursor/Grok author content as ordinary files.
2. **SQLite-in-the-browser (sql.js) with a generated database.** Better for
   tens of thousands of joined rows, but the content here is a few thousand
   records, the build step adds a compile stage Grok cannot see in a diff,
   and every relation would need SQL instead of an id lookup. Rejected.
3. **Headless CMS or hosted database.** Breaks "no backend" and makes the
   tool useless offline beside the TV. Rejected.

## 3. Architecture

```
data/content/*.json        hand-authored records, one file per entity type (D12)
data/pois.json (ignored)   th.gl node dump in canonical px, local only (D14)
src/content/schema.ts      zod schemas = the contract; types inferred
src/content/types.ts       exported types, type lists, labels
src/content/ids.ts         id and slug rules, ref parsing
src/content/loader.ts      fetch + validate + build ContentDb (T11)
src/content/search.ts      MiniSearch index over ContentDb + fast travel (T12)
src/content/progress.ts    localStorage progress, export/import (T14)
src/content/pois-loader.ts load data/pois.json if present (T15)
src/components/SearchPanel, EntityPanel, GuideSteps, LayersPanel, PoiLayer
scripts/content-report.ts  coverage + integrity report (node)
scripts/fetch-pois.py      th.gl -> data/pois.json (T15)
tests/unit/content-data.test.ts   committed content validates + refs resolve
```

Data flow: `App` loads roads, water, fast travel (as today) plus
`loadContent()` and, if present, `loadPois()`. The store gains a `content`
slice (the `ContentDb`), a `selectedEntityId`, a `poiGroups` visibility map
and `progress`. The search panel writes `selectedEntityId`; the entity panel
reads the record and its relations from the db; *Route here* writes pin B
through the existing `setPin`. Nothing in `src/routing/` changes.

## 4. Content model (D12)

Every record is an **entity** with a common head and a type-specific body.
`src/content/schema.ts` is the single source of truth; this section is the
prose version.

**Common head** (`EntityBase`):

| field | type | notes |
|---|---|---|
| `id` | `"<type>:<slug>"` | slug is kebab-case ASCII; stable across renames |
| `type` | entity type | matches the file it lives in |
| `name` | string | display name as the game shows it (English) |
| `aliases?` | string[] | old names, nicknames, common misspellings |
| `summary` | string ≤ 240 chars | one original sentence |
| `body?` | markdown | original prose; `[[id]]` links to other entities |
| `region?` | region id | |
| `location?` | `{ map, x, y }` | canonical px (D3); `map` is `pywel` or `abyss` |
| `tags?` | string[] | free-form facets for search and filters |
| `related?` | id[] | loose cross-links; typed relations live in the body |
| `sources` | Source[] ≥ 1 | `{ url, title?, accessed, note? }`; where the facts were checked |
| `confidence` | `verified / reported / assumed` | same scale as `docs/RESEARCH.md` |
| `gameVersion` | string | patch the record was last checked against |

**Entity types and their bodies** (fields beyond the head):

- `region`: `kind` (region / sub-area / layer), `parent?`, `levelRange?`,
  `keyPlaces?` (place ids).
- `place`: `kind` (city, town, village, camp, castle, estate, inn, dungeon,
  cave, ruins, farm, port, temple, watchtower, shipwreck, sanctum, spire,
  hidden-place, arena, landmark, other), `contains?` (ids of vendors, enemies, collectibles
  found there), `fastTravel?` (fast-travel.json id nearby).
- `character`: `role`, `playable`, `companion`, `factions?`, `vendor?`
  (vendor id), `home?` (place id), `facts?` (string[]), `quests?` (ids).
- `faction`: `kind` (house, guild, mercenary, hostile, institution,
  community, other), `hostile`, `leader?`, `members?`, `headquarters?`,
  `reputation?` (`{ tiers?, notes }`), `quests?`.
- `storyline`: `kind` (main, faction, character, side), `chapters`
  (`[{ title, quests: id[], pointsOfNoReturn? }]`; `title` is the value
  quests use in `chapter`), `branches?` (string[]), `pointsOfNoReturn?`
  (string[], for points not tied to one chapter).
- `quest`: `kind` (main, faction, commission, request, bounty, challenge,
  side), `chapter?` (string, a storyline chapter title), `storyline?`,
  `giver?`, `faction?`, `prerequisites`, `steps`, `rewards`, `unlocks?`,
  `missable` (+ `missableNote`, required for `lost-if`), `repeatable`. The
  quest's start point is the common `location`.
- `item`: `category` (weapon, armor, shield, accessory, projectile,
  consumable, material, tool, key, manual, cosmetic, currency, other), `slot?`, `rarity?`,
  `stats?`, `acquisitions` (Acquisition[]), `usedIn?` (recipe ids),
  `setName?`.
- `collectible`: `collection` (collection id), `index?`, `guide?`
  (steps), `reward?`.
- `collection`: a set of collectibles: `total?`, `reward?`, `poiType?`
  (the th.gl type that marks them, e.g. `memory_fragment`).
- `vendor`: `shopType` (th.gl services id), `character?`, `place?`,
  `inventory` (`[{ item, price?, stock?, unlock?, trust? }]`, `stock` is a
  count or `"unlimited"`), `currencies?`.
- `recipe`: `station` (cooking, alchemy, anvil, grindstone, sewing,
  carpentry, other), `inputs`, `output`, `learnedFrom?` (Acquisition).
- `skill`: `character` (kliff, damiane, oongka, shared), `tree` (stamina,
  spirit, health, other), `prerequisites`, `howToLearn` (Acquisition[]),
  `maxLevel?`.
- `enemy`: `rank` (common, elite, story-boss, world-boss, legendary-animal),
  `level?`, `drops` (`[{ item, chance? }]`), `weaknesses?`, `strategy?`.
- `mount`: `species`, `legendary`, `howToGet` (Acquisition[]), `stats?`.
- `activity`: `kind` (minigame, life-skill, contest, other), `rules?`,
  `rewards?`, `locations?`. Challenges are quests of kind `challenge`.
- `guide`: a standalone walkthrough: `target` (id), `prerequisites`,
  `steps`, `repeatable`, `notes?`.

**Shared shapes:**

- `Step`: `{ text, action?, location?, refs?, cost?, missable?, optional? }`.
  `action` is one of travel, talk, fight, buy, craft, collect, solve, tame,
  gather, other. `missable` is `no`, `easy-to-miss`, or `lost-if`, which
  requires `missableNote`. Steps are ordered; a step with a location gets
  *Route here*.
- `Prerequisite`: `{ kind (quest, chapter, level, reputation, item, skill,
  other), ref?, value?, text }`.
- `Acquisition`: `{ kind (vendor, drop, quest, chest, craft, gather, tame,
  event, other), ref?, location?, cost?, chance?, note?, steps? }`. An item
  with several acquisitions (a set with a boss piece and two chest pieces)
  lists one per branch.
- `Reward`: `{ kind (item, money, xp, reputation, unlock, other), ref?,
  amount?, text? }`.
- `Cost`: `{ currency (copper, silver, gold-bar, contribution, other),
  amount }`.

**Files.** `data/content/meta.json` names the game version and lists the
content files. Each content file is `{ "version": 1, "type": "quest",
"records": [...] }`. Ids are unique across all files. Every id in a ref field
must resolve; the test suite fails otherwise.

## 5. Search (D15)

MiniSearch, built in memory at load. Documents: every content record
(fields `name` ×3, `aliases` ×2, `tags`, `summary`, `type`), every
fast-travel place, and one document per **POI type** (so "iron" finds the
Iron Mine layer, not 2,838 nodes). Options: prefix, fuzzy 0.2, combine OR.
Results are grouped by type with the head match first; Enter opens the top
hit. Selecting a hit opens the entity panel and, when it has a location,
pans the map and drops a highlight marker. The current `FastTravelSearch`
becomes part of this panel; its type chips stay.

## 6. Entity panel, guides and progress (D16)

- Phone: bottom sheet over the map (half height, drag to full). Desktop
  (≥ 768 px): right-hand panel, map stays interactive.
- Header: name, type badge, region, confidence + game version line ("checked
  against 2.01.00"), *Show on map*.
- Body: summary, markdown body (tiny renderer: paragraphs, bold, lists,
  `[[id]]` links; no HTML), then type-specific sections rendered from the
  record (rewards, acquisitions, inventory, drops, chapters).
- Relations: reverse lookups computed once in `ContentDb` (sold by, dropped
  by, rewarded by, used in, found in, member of).
- Guides: `GuideSteps` renders `steps` with a checkbox per step, a *Route
  here* button on steps with a location (sets pin B; if pin A is unset the
  panel says "Tap the map where you are"), and a missable warning line.
- Progress: `src/content/progress.ts` keeps a set of done step keys, done
  quest ids and collected collectible/POI ids in `localStorage` under one
  versioned key; *Export* downloads JSON, *Import* replaces it. No
  backend, no sync.

## 7. POI layers (D14)

`scripts/fetch-pois.py` reads the th.gl Continent of Pywel page for the tile
transformation, the `filters` taxonomy (groups → types with labels) and the
name dictionary, then the OpenWorld node dump. Records are CBOR
`[id, [worldY, worldX, z]]` (note the order; the fast-travel script has this
wrong today, see T10). Output `data/pois.json` (gitignored, local only):

```json
{ "version": 1, "imageSize": [8192, 8192], "source": "SOURCE.md",
  "fetched": "2026-09-05",
  "groups": [{ "id": "mining", "label": "Mining",
               "types": [{ "id": "mine_iron", "label": "Iron Mine" }] }],
  "nodes": [{ "id": "mine_iron@-3065.98:-4582.23", "type": "mine_iron",
              "x": 4321.5, "y": 2345.0, "name": "..." }] }
```

Rendering: one canvas layer, points culled to the viewport, drawn as small
discs coloured per group; below zoom 3 a grid cluster shows counts per cell.
The layers panel lists groups with counts and a toggle; defaults on:
treasures, hidden gear, quests, exploration, locations, services, crafting
manuals; defaults off: mining, gathering, crafting stations, creatures,
bugs, bonfires. Checkable types (chests, memory fragments, sealed artifacts,
hidden gear, manuals, constellations, totems, skill training) get a
*collected* toggle in their popup that writes to progress; the collected
count shows next to the type. Without `data/pois.json` the panel says how
to generate it and the rest of the app is unchanged.

## 8. Content pipeline and sources (D13, D17)

- **Facts, not prose.** Names, locations, prices, drops and prerequisites are
  facts; they may be checked against any site. Every sentence in `summary`,
  `body`, `steps[].text` and `strategy` is written fresh for this repo. No
  table, list or paragraph is copied from a wiki or guide site. No image is
  added to the repo except the maintainer's own screenshots.
- **Cite.** Every record lists at least one source URL with the date it was
  checked. Official patch notes and the Pearl Abyss site rank first, then
  Fandom (CC BY-SA facts), then guide sites for verification only.
- **th.gl coordinates.** `data/pois.json` is local. A committed content
  record may carry a location, but each such record is authored one at a
  time with a description and a non-th.gl source; bulk-converting
  `pois.json` into content records is not allowed.
- **Confidence and version.** `confidence` follows the research scale;
  `gameVersion` says which patch the record was last checked against.
  `meta.json` holds the current patch; the About panel shows it. After a
  patch, records touched by the notes are re-checked and bumped.
- **Report.** `npm run content:report` prints records per type and
  confidence, unresolved refs, records without sources, guides without
  locations, and collectibles per collection against `total`.
- **Unofficial.** README and the About panel carry the Pearl Abyss fan
  content disclosure: unofficial, not endorsed, no paywall.

## 9. Later

- Abyss map: second tile pyramid and node dump (th.gl has both), `map:
  "abyss"` locations already allowed by the schema.
- Route through a guide: chain steps with locations into one multi-stop
  route; teleport-aware routing (D11 follow-up).
- Merge the fast-travel overlay into POI groups once `pois.json` covers it.
- "Charting the Unknown" (2026-10-15): naval and underwater areas, new
  mounts; likely a bounds change (D1) and new POI groups.
- Community datamine: if a permissively licensed extraction of the game's
  tables appears, it replaces manual transcription as the source of names.

## 10. Testing

- Unit: schema round-trips for every entity type, id/ref parsing, search
  ranking (exact > prefix > fuzzy; type grouping), progress module
  (persist, export, import, version bump), markdown renderer, POI loader
  (missing file, bad file, good file), coordinate transform for pois.
- Data: `tests/unit/content-data.test.ts` validates every committed content
  file, checks id uniqueness and ref resolution, checks locations fall inside
  the manifest bounds and on land (water mask), and requires ≥ 1 source.
- Smoke: extend `tests/e2e/smoke.py` with search → open panel → route here.

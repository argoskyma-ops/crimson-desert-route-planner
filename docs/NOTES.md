# Notes

Open questions, follow-ups and ideas. Design decisions live in docs/DECISIONS.md;
change a decision there first, then the code.

## Open questions

- [ ] `data/fast-travel.json` is committed while `data/pois.json` (same
  source, 20x larger) is local-only (D13). Keep the small committed file, or
  move it to local-only for consistency? Maintainer's call.
- [ ] Hosting: the companion adds hand-written content that is fine to
  publish, but the tiles and `pois.json` are still personal-use only. A hosted
  copy would need its own map source.

- [x] What is being routed — collectibles, quests, resource nodes, fast-travel hops?
  Answered: A→B along roads (main / sub / off-road), Horse or On foot.
- [x] Where does map/node data come from — manual entry, a wiki, datamined files?
  Answered: raster extraction (`scripts/extract-roads.py`) from the th.gl tile
  pyramid (see SOURCE.md) plus in-app tracing.
- [x] Interface: local web app, CLI, or something usable second-screen while playing?
  Answered: local web app, phone-first, usable beside the game.
- [x] Does it need to run offline / on a phone beside the TV?
  Answered: yes — `npm run build` is an offline-capable static `dist/`.

## Follow-ups

- Companion build (2026-09-05): design in `docs/COMPANION-SPEC.md`, decisions
  D12 to D18, task list with status in `docs/COMPANION-PLAN.md`. Start with T10
  and R1.
- `scripts/fetch-fast-travel.py` reads th.gl's CBOR place records and painted
  labels as `[x, y]`; they are `[y, x]`. 153 committed camps, villages, hearths
  and places sit in the sea south-east of Pywel. Fix is T10 in the companion
  plan (measured 2026-09-05: swapped, all 117 named places land on Pywel).

- `src/routing/routing.test.ts` "routing performance" fails about one run
  in three on Argos (route time 100 to 115 ms against a 100 ms budget).
  Timing-based; re-run confirms. Widen the budget or measure in a warm
  loop so the commit gate is reliable (noted 2026-09-05 during T11).
- Phone layout after T13: the control panel plus the half-height entity
  sheet left about 60 px of map on a 390 x 844 viewport. Resolved by the R2
  fixes (2026-09-05): below 768 px the panel collapses to the title plus a
  Search button while an entity is open, leaving about 350 px of map.
- `src/editor/editor-layer.ts` `cssPixelsPerImagePixel` measures the scale
  with `latLngToContainerPoint`, which Leaflet rounds to whole pixels, so it
  returns 0 below map zoom 3 and node snapping silently does nothing there.
  `src/components/PoiLayer.ts` uses `map.project` (unrounded) instead; port
  that one-liner when the editor is next touched (found 2026-09-06, T16).
- POI progress keys are `poi:<th.gl id>` and th.gl ids embed world
  coordinates at two decimals. Stable across the 2026-09-03 and 2026-09-06
  dumps (1,631 shared records identical). If a later re-fetch orphans
  `collected` keys, remap on `setPois` by type plus canonical position
  within 1 px (R3, 2026-09-06).
- C3 follow-ups (2026-09-06): the 206 main quests carry no `location`
  (no non-th.gl source gives coordinates, and D13 forbids bulk th.gl
  positions); *Route here* and the report's located count therefore skip
  them. Placing them means an in-app pass with the content editor (map
  taps) or linking steps to located place records. 27 quest records are
  `assumed` (arc headers with no objective of their own in the sources);
  re-check them when a per-quest walkthrough appears. Gear rewards are
  `item` text until C5 exists; bosses are step text until C7. The Forbes
  article cited on `character:kliff` answers 403 to scripts (bot block).
- C1 follow-ups (2026-09-06): the sourcing question was settled in D13
  (fast-travel-backed places cite th.gl for the coordinates and add a
  non-th.gl source when one names the place). 50 camps are th.gl-only
  and `assumed`, with the region inferred from their sub-area or the
  nearest settlement; re-check them when a per-region camp guide
  appears. Three source conflicts were decided by position or by the
  faction list and are noted in the records: Steel Mountains (Hernand),
  Tariv (Demeniss), Kweiden (a Pailune town, not a region). Thoron Town
  Hall Ruins may be Delesyia rather than Crimson Desert. Hearths (108
  fast-travel rest points) have no place records; the overlay still
  shows them. `crimsondesert.fandom.com` answers 402/403 to scripts, so
  its facts came from search snippets (`docs/RESEARCH-REGIONS.md`).
- C2 follow-ups (2026-09-06): five duplicate seed records stay as
  pointers because quests reference them (`character:marquis-lanford`,
  `character:countess-azerian`, `character:dean-of-the-scholastone-institute`,
  `character:woman-in-white`, `character:draven-the-crowcaller`); retarget
  the quest refs and drop the pointers in a later C4/C8 pass. Faction
  headquarters and vendor homes with no place record (Kharonso, Tommaso,
  Varnia, Thornbriar Fortress, Fort Ironclad, Brookfield Manor, Windridge
  Fortress, Oakenshield Manor and the Hernand shops) are named in `body`
  only; add them when C4 or C7 touches those places. Faction questline
  names without quest records (Grounds of the Sunrise, Executioner of
  Justice, Slumbering Soul, Lunar Judgment, Demeniss Bound) are C4 work.
  Whether Oongka stays playable after Chapter 7 and whether the Nix/Marcus
  and Norfix/Kamraan trade managers are one person each is unconfirmed.
  `crimsondesert.gaming.tools` now answers a Cloudflare challenge to curl
  as well; its facts are snippet-only.
- Calibrate `METERS_PER_PIXEL` and `SPEED_MPS` in-game (`src/config/travel.ts`, D7).
  Check whether wide roads or paths are the faster class for a horse.
- Second sweep in the editor for dead ends (about 600) and trails still missing; use
  `scripts/review-tiles.py --zoom 6` on suspect windows.
- Optional: extract at zoom 6 for tighter geometry; widen the manifest `bounds` if the
  game opens land beyond the Pywel frame.
- Hosting a public copy is the maintainer's call: the tiles have no reuse licence
  (SOURCE.md), so this repo offers no hosted demo.

## Scaffold review

Status after the orchestrator pass on 2026-09-05 (commit "Apply the R1 scaffold review"):

- **Blocking: all four fixed.** `IdSchema` now uses `isEntityId`; `collectRefs`
  uses `isEntityId` and `extractLinks`; `Quest.start` is gone (use the common
  `location`); storyline chapters carry their own `pointsOfNoReturn`.
- **Should fix, done:** id-collision rule in `data/content/README.md`;
  `lost-if` requires `missableNote` (steps and quests); `chapter` is a string
  matching the storyline chapter title; `inn` place kind; `projectile` item
  category; `challenge` removed from activities (challenges are quests);
  `other` activity kind; `accessed` cannot be in the future; self-refs
  rejected; `gameVersion` compared numerically; `place.fastTravel` checked
  against `data/fast-travel.json`; report counts nested locations and flags
  items/mounts/skills without an acquisition and collectibles without a
  location or guide; seeds corrected (Hernand body, storyline chapter titles
  and a Chapter 1 stub, Blackwing note, arm-wrestling and Abyss marked
  `assumed`, collection totals noted as unknown).
- **Should fix, settled 2026-09-05 (second orchestrator pass, D12):** `ref`
  on Prerequisite / Acquisition / Reward is typed by `kind` through the
  `*_REF_TYPES` tables plus a refine, and `IdSchema` / `idOf()` carry
  `meta({ entityType })` for the D19 picker; `Vendor.inventory[].stock` is a
  count with a separate `unlimited` boolean; `Skill.character` stays the
  enum and `SKILL_OWNER_CHARACTER` maps it to character ids for T18 (T11
  builds no skill relation). Stands as-is: `equipment_shop` is a real th.gl
  services id (19 nodes); Bringer of Balance has no location because no
  source gives one. The plan wording items (T12 `poiTypes` argument,
  T13/T14b list `MapView.tsx`, T14 step keys, T13 vs T17/T18 split, C3 file
  list, C6 horses as `mount:*`, T16 testable accept) were applied in the
  first pass.
- **Nits:** CLAUDE.md and the spec now match the schema (D12 to D19, `city`,
  `inn`, `Vendor.place`, quest `location`).

### R1 scaffold review (Cursor/Grok 4.6, 2026-09-05)

**Blocking** (fix before T11)
- `src/content/schema.ts:134` — `IdSchema` is `z.string().regex(ID_RE)` and `ID_RE` (`src/content/ids.ts:34`) is `^([a-z]+):(slug)$`, so `related` / `contains` / `unlocks` / `refs` / `target` / `Prerequisite.ref` / `Acquisition.ref` / `Reward.ref` accept `spaceship:foo`. `parseId` (`ids.ts:48`) would reject it. Change `IdSchema` to `z.string().refine(isEntityId)` (or equivalent) so T11, T14b and the data test share one rule.
- `src/content/schema.ts:512-513` — `collectRefs` does not use `extractLinks` / `LINK_RE`. It scans `[[([a-z]+:[a-z0-9-]+)]]`, which allows `[[quest:--bad]]` and `[[quest:foo-]]` that `parseId` and T13's `[[id]]` renderer will not treat as ids. Replace the inline regex with `extractLinks(value)` and, for whole-string values, `isEntityId(value)` instead of `ID_RE.test(value)`.
- `src/content/schema.ts:284` vs `209` — `QuestSchema.start` duplicates `EntityBase.location`. T13 (`docs/COMPANION-PLAN.md:104`) pans to `location`; C3 (`COMPANION-PLAN.md:196`) fills `start`. Seeds already omit both. Drop `start` and use `location`, or add a refine that one of them is required and document that T13/C3 read `start ?? location`. Do this before T13 hard-codes the wrong field (T-tasks cannot change the schema).
- `src/content/schema.ts:266-274` — `StorylineSchema.chapters` is `{ title, quests }` and `pointsOfNoReturn` is `string[]` on the storyline. T17 (`COMPANION-PLAN.md:157-158`) and C3 (`COMPANION-PLAN.md:197`) need PONR “on the chapters that trigger them”. Change chapters to `{ title, quests, pointsOfNoReturn?: string[] }` (keep a storyline-level list only if it is leftover/unscoped).

**Should fix**
- `src/content/ids.ts:3-6` and `data/content/README.md:13-15` — `<type>:<slug>` is unique per exact id, not per display name. Two “Supply Run” faction quests or two Rhetts collide if authors slugify the title. The seed `vendor:rhett-hernand` is the right pattern but it is not a rule. Add: when the English name is not unique, suffix the slug with place or faction (`quest:celeste-supply-run`, `vendor:rhett-hernand`); for unnamed collectibles use `collectible:<collection-slug>-<index>` and keep `index` in sync. Renames stay as D12 (keep id, change `name`, add `aliases`).
- `src/content/schema.ts:168-170` — comment says `missableNote` is required when `missable` is `lost-if`; there is no `superRefine` on `StepSchema` or `QuestSchema`. Add that refine so D19 and C-tasks cannot save `lost-if` with no note.
- `src/content/schema.ts:176,184,196` — `ref` on `Prerequisite`, `Acquisition` and `Reward` is untyped `IdSchema`. D19 cannot pick a filtered id list from the schema. Constrain by `kind` (quest→`idOf('quest')`, vendor→`idOf('vendor')`, drop→`idOf('enemy')`, item→`idOf('item')`, skill→`idOf('skill')`, …) or attach `z.meta({ entityType })` on `idOf()`.
- `src/content/schema.ts:280` — `chapter: z.union([z.number().int(), z.string().min(1)])` plus seeds that use both (`quest.json:10` `"Prologue"`, `quest.json:30` `2`) make the T14b control and T17 chapter matching awkward. Use string only (chapter title, matching `chapters[].title`).
- `src/content/schema.ts:333` — `stock: z.union([z.number().int().nonnegative(), z.literal('unlimited')])` is another union D19 has to special-case. Prefer `stock?: number` and `unlimited: boolean`, or `null` for unlimited.
- `src/content/schema.ts:353` — `SkillSchema.character` is `kliff | damiane | oongka | shared`, not `idOf('character')`. T11 reverse maps and T18 character pages will not join `skill:*` to `character:kliff`. Keep the enum if that is the spec, but document that T18 must special-case it; or change the field to `idOf('character')` plus optional `shared`.
- `src/content/schema.ts:97-109` — `ITEM_CATEGORIES` has no `projectile` (research lists projectiles next to tools). Add `projectile`, or tell C5 to use `other`.
- `src/content/schema.ts:56-76` vs `docs/COMPANION-SPEC.md:102-105` — schema has `city`; spec does not. Keep `city` (City of Hernand) and add it to the spec. Inns (research: 10 named inns) still have no kind; C1/C7 will use `other` unless you add `inn`.
- `src/content/schema.ts:128` and `94` — `challenge` is both a `QUEST_KINDS` and an `ACTIVITY_KINDS` value. Research treats Challenges as a tracked system separate from quests. Assign them to one type in the plan (C4 or C7) and drop the other enum member, or C-tasks will double-file them.
- `data/content/region.json:11` — body “Kliff's story opens here” contradicts `region:pailune` (`region.json:26`), `quest:dead-of-night` (`quest.json:12-13`, region Pailune), and `docs/RESEARCH-COMPANION.md` §2 (opening attack is the Greymane camp in Pailune; Hernand is the first explorable hub). Change the sentence to the hub fact; do not say the story opens in Hernand.
- `data/content/storyline.json:12-15` — chapters jump from “Prologue: Dead of Night” to “Chapter 2” while `quest:dead-of-night` rewards “Chapter 1 begins” (`quest.json:18`) and the titles do not match `quest.chapter` (`"Prologue"` vs `"Prologue: Dead of Night"`). Bad C3 template. Insert a Chapter 1 stub (empty `quests` is fine) and align titles with `quest.chapter`.
- `data/content/item.json:38` — “Drops together with one armour piece on the first kill” is not in `docs/RESEARCH-COMPANION.md` §5 Example C (mask + one piece on the Crowcaller kill; rest is exploration loot). Drop “on the first kill” or cite a source that says it.
- `data/content/vendor.json:9` — `shopType: "equipment_shop"` is not one of the spec examples (`general_shop`, `smithy`, `stable` in `schema.ts:324`). C7 will copy it and T16 will not join the layer. Use a real th.gl services id once T15 exists, or `smithy` / a documented placeholder.
- `data/content/activity.json:13` and `data/content/region.json:79` — both cite the Fextralife wiki homepage for specific facts (arm-wrestling rules; Abyss as a layer with its own nodes). That URL does not support those sentences. Point at a page that states the fact, or cut the detail and mark `assumed`.
- `data/content/item.json:16-20` — Bringer of Balance steps have no `location`. T14 *Route here* and the report’s “located” column will treat it as having no map point. Add a canonical-px step (or acquisition) location so C5 has a complete example.
- `data/content/collection.json` — neither collection sets `total`. `content-report.ts:88` prints `?`; T18 found/total is empty. Set `total` when a source gives a count, or leave a `note` that it is unknown.
- `tests/unit/content-data.test.ts:73-82` — resolves refs but does not fail a `[[id]]` or `related` entry that equals the record’s own `id` (e.g. `[[mount:rokade]]` on `mount:rokade`). Reject self-refs.
- `tests/unit/content-data.test.ts` / `src/content/schema.ts:153` — `accessed` is `z.iso.date()` with no upper bound. Reject `accessed` after today (and, in the report, print offenders).
- `tests/unit/content-data.test.ts:101-105` and `scripts/content-report.ts:68` — `gameVersion` is compared as a string (`<=` / `<`). `"2.9.00" < "2.10.00"` is false. Compare `(major, minor, patch)` tuples.
- `tests/unit/content-data.test.ts` — `Place.fastTravel` (`schema.ts:231`) is a free string and `collectRefs` will not see `nexus:-5040.05:-2774.39` (`ID_RE` rejects the dots / extra colon). C1 will write these. When `fastTravel` is set, assert the id exists in `data/fast-travel.json`.
- `scripts/content-report.ts:51,72-78` — “located” is only `record.location`. Quests with `start` or a located step, and items/mounts with located acquisitions, count as 0. Also, unlocated guides/quests are printed but do not `process.exit(1)`, so C3 can land ≥160 quests with no map points and still gate. Count nested locations; fail (or fail main/faction quests) when none exist.
- `scripts/content-report.ts` — does not flag items/mounts/skills with empty `acquisitions` / `howToGet` / `howToLearn`, collectibles with neither `location` nor `guide`, or `lost-if` without `missableNote`.
- `docs/COMPANION-PLAN.md:61-72` — T12 accept includes a POI-type hit that “turns its group on”. `poiGroups` is T16 (Phase 2). T12 should take `poiTypes` as an argument (fixture/`[]` until T15) and drop “turns its group on” until T16.
- `docs/COMPANION-PLAN.md:74-76` — T13 says `MapView` gets a `highlight` prop but `src/components/MapView.tsx` is not in the file list. Add it.
- `docs/COMPANION-PLAN.md:101-104` — T14b map-tap location needs a `MapView` click path; file list omits `MapView.tsx`. Add it.
- `docs/COMPANION-PLAN.md:93` — step keys `<entityId>#<index>` are ambiguous for `item.acquisitions[i].steps[j]`, `mount.howToGet[i].steps[j]`, and `collectible.guide`. Define `<entityId>#a<i>s<j>` (and `#g<j>` for collectible/quest/guide top-level steps) in the T14 text.
- `docs/COMPANION-PLAN.md:74-86` and `152-173` — T13 creates `entity/*.tsx` for every type; T17 rewrites Quest/Storyline; T18 rewrites the rest. Split: T13 ships a generic body + stub sections; T17/T18 own the rich files and list only those.
- `docs/COMPANION-PLAN.md:194-198` — C3 “creates the minimal place and character records it references” but the file list is only `storyline.json`, `quest.json`. Global rule is “only the listed files change”. Add `place.json` and `character.json` (and `region.json` if `region` is set), or drop that sentence and let C3 omit `giver` / place refs until C1/C2.
- `docs/COMPANION-PLAN.md:213-218` vs `229` — C6 files legendary horses as collections; C7 files them as mounts. `mount:rokade` already exists. C6 should reference `mount:*` (or a `collection` whose members are mount ids), not a second `collectible:rokade`.
- `docs/COMPANION-PLAN.md:136-148` — T16 accept “above 30 fps on a phone-class device” cannot be run in CI. Keep the Performance-tab note; make the testable accept “no DOM marker per node” + a unit test that viewport culling / zoom-3 clustering runs.

**Nits**
- `docs/COMPANION-SPEC.md:126-127` — vendor body omits `place` (`schema.ts:327`) and `city` is missing from the spec place-kind list. Update the spec to match the schema (schema is ahead, and that is fine).
- `CLAUDE.md:23` and `docs/COMPANION-PLAN.md:3` — still say D12–D18; D19 is in `docs/DECISIONS.md:362`.
- `src/content/schema.ts:128` — `ACTIVITY_KINDS` has no `other` (2.01 dispatch / Gold Bar Investment). C8 will need `other` or a new kind.
- `src/content/schema.ts:300` — `stats: z.record(...)` has no `.describe()`; D19 will get a free key/value list. Acceptable if T14b special-cases `stats`.
- `tests/unit/content-data.test.ts:51` — `locationsOf` treats any object with `x`, `y`, and `map` as a point. An item `stats` map that used those keys would be bounds-checked. Unlikely; mention in a comment.
- `data/content/README.md:31-34` — checklist item 8 lists only some ref fields. Point at `collectRefs` / the data test instead of a partial list.
- `tsconfig.node.json:22` — includes `scripts/*.ts` but not `src/content/*.ts`. Runtime `node` is fine; if `tsc -b` starts complaining about the report importing app files, include `src/content/*.ts` in the node project or add a reference.
- `data/content/character.json:27-50` — Damiane and Oongka have no `factions`. Thin C2 example, not wrong.
- Live source HTML was not re-fetched this pass; seed wording was checked against `docs/RESEARCH-COMPANION.md` part 1 (same URLs). No seed sentence is a verbatim lift of that research prose.

**Looks right**
- Common head, confidence scale, `gameVersion` regex, `sources` min 1, and `[[id]]` in `body` match D12/D13/D16.
- Entity types and most body fields match the spec; `Vendor.place`, `city`, and inventory `trust` 0–100 match the game’s shop/Trust systems.
- `STEP_ACTIONS`, `CURRENCIES` (including `contribution`), `ACQUISITION_KINDS`, enemy ranks, skill trees, and missable enum (`no` / `easy-to-miss` / `lost-if`) match research §3 and §5.
- No set-bonus field (research: sets do not grant a bonus). Refinement stays in `body` as C5 asks.
- Id stability via `aliases` + keep-the-id is the right rename story; `slugify` handles apostrophes and diacritics (`schema.test.ts:22-28`).
- `collectRefs` skipping the record’s own `id` key, requiring a whole-string id (so source titles like `Fextralife: Factions` and `https://…` URLs do not match), and walking nested `item` / `ref` / `refs` is sound for the current seeds.
- `locationsOf` after `parseContentFile` sees `map` defaults, so quest `start`, step, and acquisition points are already bounds- and water-checked (`content-data.test.ts:84-99`).
- Seeds: five regions + Abyss layer, Hernand Castle at ~T10’s point (2422.6, 5053.5), Greymanes / Black Bears, Kliff / Damiane / Oongka / Myurdin / Rhett, Dead of Night, Trial of the Winds + gliding, Early Encounter + Collectibles Chest guide, Canta Plate via Rhett, Blackwing via Crowcaller, Rokade tame steps + Royler/Camora stubs. Rokade is the model C-task record.
- Empty `collectible.json` / `recipe.json` / `skill.json` listed in `meta.json` is the right loader/report shape.
- `content-data.test.ts` unique ids, ref resolution, https sources, and Pywel-on-land checks are a solid gate; `content-report.ts` exits 1 on parse failure and unresolved refs.
- `src/content/{ids,schema,types}.ts` have no DOM or Leaflet imports. Report runtime is `ids.ts` + `schema.ts` + `zod` with `.ts` specifiers; `import type` from `types.ts` is erased. That is the right style for `node scripts/content-report.ts` on Node 26.
- T11 file list and accept (`byId.size`, reverse relations on these seeds, copy `data/content/` in `vite.config.ts`) are implementable on this contract. T10 before C1 is the right order for fast-travel coordinates.

## Ideas for later

- Fast-travel overlay (D11): markers, type filters, search, bonfires, and
  named camps/villages/places are in. Still to do: using a teleport as a
  route hop.
- Multi-stop routes
- Land-grid off-road pathing on foot
- Done: water-aware off-road legs (D10), higher-resolution map source (D1)

## Local-only state

- `data/map/tiles/` is the th.gl pyramid (about 24 MB, gitignored). A
  `data/map/tiles-powerpyx/` or `data/map/source.jpg` left over from the retired
  source is unused and safe to delete; neither exists on a fresh clone.

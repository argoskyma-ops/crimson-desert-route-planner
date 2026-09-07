# Companion reviews

Whole-feature reviews of the companion build (docs/COMPANION-PLAN.md,
R-tasks). Each review is pasted verbatim from the read-only Grok run; the
orchestrator's status line above it says what was done with the findings.

## R4 (C1): regions and places

Status 2026-09-06: applied (commit "Apply the R4 review of the C1 regions
and places content", Grok, one pass): all three blocking items, every
should-fix and every nit except two decided otherwise: `region:pailune`
keeps the Lonely Jackals as plain text (no faction record exists to link)
and `region:delesyia` keeps `place:delesyia-castle` in `keyPlaces` (the
seed is treated as the in-game castle name); `place:duzhar` stays a
`village` (the map label) and says the source calls it ruined.
Orchestrator checks before the review: every record validates, ids
unique, refs resolve, every `fastTravel` id exists and the location
matches its point, all 124 points inside the bounds and on land, every
one of the 123 fast-travel settlement and camp names has one record;
every cited URL returns 200 except four Fandom pages (403 to scripts,
the research file notes the same block); the only 7-word overlap left is
a chapter title. Two extra fixes came out of that check (a dead
crimsondesertwiki.org host on `place:kweiden`, a copied phrase in
`region:izvatu`). Numbers after C1: 5 regions, 65 sub-areas, 1 layer;
168 places, 124 with fast-travel coordinates (74 with a non-th.gl
source, 50 th.gl-only camps marked `assumed`).

### R4 review: C1 regions and places (Cursor/Grok 4.6, 2026-09-06)

**Blocking** (wrong facts, invented facts, copied prose, schema misuse)
- `place:demeniss-castle` (`data/content/place.json`) — summary still says “House Caliburn's stronghold”; body says House Thorel, vacant while Edward is in a coma. Research: Thorel is the ruling house; Gabriel Caliburn seizes power later in Blood Coronation. Rewrite the summary to Thorel / the vacant throne. If Caliburn stays, say it only as the later seizure, matching the body.
- `region:morning-mist-peaks` (`data/content/region.json`) — summary adds “Chapter 9's pensive statues are repaired.” Section 2 only has “Mountain peaks.” That chapter fact is not in the research file (it is on the old `place:morning-mist-peaks` seed). Drop the statues/chapter clause from the sub-area summary.
- `region:silver-wolf-mountain` (`data/content/region.json`) — summary adds “the site of the Chapter 7 fight on its slopes.” Section 2 only has “Mountain (+ cave).” Drop the chapter/fight clause.

**Should fix**
- `place:hernand-castle` (`data/content/place.json`) — extended seed never states the settlements-table houses (Celeste ducal, Serkis marquis) or Prologue–6. Body still has “west of the Sena's tributaries”; Sena River is in Gaps as unconfirmed. Add Celeste/Serkis (and the chapter span if you keep capital-hub language). Drop or mark the Sena line as assumed.
- `place:beighen` (`data/content/place.json`) — “milder edge of the snow country, looking toward the occupied highlands” is not in the table (only “Pailune's southern village,” Beighen Tribe / Blue Fangs). Cut that terrain.
- `place:easelbury` (`data/content/place.json`) — table says Hernand (inferred from position). Record is Demeniss, inferred from `place:demeniss-castle`. Keep Demeniss: 3380, 4859 is ~180 px from Demeniss Castle and ~960 px from Hernand Castle. Do not move it to Hernand. Add that the table's Hernand call is the bad inference.
- `place:freesword-encampment` (`data/content/place.json`) — table states Crimson Desert (no URL). Record is Hernand, inferred from Hernand Castle (2410, 5007 vs 2422, 5053). Keep Hernand. Do not file it under the desert. Add that the table's desert row looks like a catalogue error (the sourced freesword site is `place:desert-freesword-camp`).
- `place:khafi-jahr-camp` (`data/content/place.json`) — `related` is `region:worlds-navel` but the camp name does not match that sub-area. Research puts a Dusksong outpost at World's Navel; that stays in the body. Drop `related`. Then drop this id from `region:worlds-navel` `keyPlaces`.
- `region:worlds-navel` (`data/content/region.json`) — `keyPlaces` lists `place:khafi-jahr-camp` only via that `related`. After the drop, leave `keyPlaces` empty. Body may keep the Dusksong/Khafi sentence; add the jahrcamp URL (with the search-snippet note) if that sentence stays.
- `region:pailune` (`data/content/region.json`) — `keyPlaces` includes `place:silverwolf-mountain`, a landmark seed, not a Section 3 settlement. Remove it. Keep pailune, beighen, kweiden, odeck, skoghorn, totemfelt.
- `region:demeniss` (`data/content/region.json`) — `keyPlaces` includes `place:morning-mist-peaks`, a landmark seed, not a Section 3 settlement. Remove it. Keep easelbury only if that place stays Demeniss.
- `region:calphadean-territory` (`data/content/region.json`) — body links `[[place:calphade-gate]]`. That gate is not in the Section 2 row. Drop the gate or move the link to the castle record.
- `region:twinpath` (`data/content/region.json`) — “location lists file it with the Crimson Desert” is false. Fextralife/Game8 indexes do not list Twinpath; the research file only files the row under Crimson Desert and calls it a Hernand/Pailune border. Parent `region:crimson-desert` can stay. Rewrite the sentence to match the research file, not “location lists.”
- `region:border-trail` (`data/content/region.json`) — cites Game8 585766 and 591407. The row is “no specific wiki URL, low confidence.” Drop those two URLs. `confidence: "assumed"` stays.
- `region:hernandian-mountains` (`data/content/region.json`) — cites Game8 585761. That Hernand guide does not name this range; the row is search synthesis + the bandit-camp page. Drop 585761; keep the gaming.tools camp URL with its note.
- `region:timberdale` (`data/content/region.json`) — cites Game8 591407. The row is gaming.tools bandit-camp, single-source, not in the location indexes. Drop 591407.
- `place:giants-yard-resource-camp` (`data/content/place.json`) — `tags` is `["logging"]`. Research kind is research (Giant Yard's Research Group). Change the tag to `research`.
- `place:demeniss-castle` (`data/content/place.json`) — body uses Thorel / coma / Blood Coronation / Ch8–10–12 but sources are only th.gl, Fextralife Factions, and Locations. Add Game8 588601 and the Demeniss political URL from the research file (with the search-snippet note).

**Nits**
- `place:burhum` (`data/content/place.json`) — “Chapter 9 trial master.” Table: Ch9 boss. Say boss, not trial master.
- `place:ivynook` (`data/content/place.json`) — “House Serkis tenants.” Table: House Serkis. Drop “tenants.”
- `place:duzhar` (`data/content/place.json`) — kind is `village`; table is village (ruins). `ruins` fits the body better, or say the kind is the map label.
- `place:demeniss-castle` (`data/content/place.json`) — no alias for “City of Demeniss” (research: preferred name unconfirmed). Add it as an alias if you keep the castle as the hub name.
- `place:border-trail-bandit-camp` (`data/content/place.json`) — body says the region is inferred. The camp table states Crimson Desert (not marked inferred). Soften to “table places it in the Crimson Desert; no guide page was fetched.”
- `region:golden-plains` (`data/content/region.json`) — “Fortified cities and military works” is Section 1 Demeniss terrain, not the “Plains” row. Stick to plains.
- `region:delesyia` (`data/content/region.json`) — `keyPlaces` includes `place:delesyia-castle`, which is not in the settlements table; research names no capital. Keep only if you treat the seed as the in-game castle name; otherwise drop it and leave Dewhaven and Tinkerton.
- `region:abyss` (`data/content/region.json`) — extra Fextralife wiki-hub URL is not an Abyss source in the research file. Drop it; PowerPyx + Fandom already cover the layer.
- `region:pailune` (`data/content/region.json`) — Black Bears are linked; Lonely Jackals are not. Link or leave both plain.
- `region:howlsands` (`data/content/region.json`) — Game8 585766 is not a Howlsands URL in the research file (name is gaming.tools only). Keep 588601 only if you need Sandfang; otherwise drop 585766.

**Sampled and sound**
- Regions: `region:hernand`, `region:crimson-desert`
- Sub-areas: `region:argent-peaks`, `region:deepwoods`, `region:pororin-forest`, `region:nas-river`, `region:black-forest`, `region:five-finger-mountain`, `region:upper-denn-river`, `region:serpent-marsh`, `region:steel-mountains`, `region:mount-benus`, `region:snaketail-wall`, `region:valley-of-fire`, `region:traders-expanse`, `region:gate-of-peace`, `region:gorthak`, `region:tashkalp`
- Settlements: `place:steel-mountains`, `place:calphade-castle`, `place:pailune`, `place:arboria`, `place:arcosa`, `place:arcosa-trade-depot`, `place:batihar`, `place:caledora`, `place:castlewood-ruins`, `place:dewhaven-castle`, `place:florindale`, `place:fort-musket`, `place:helmara`, `place:hexe-sanctuary`, `place:kweiden`, `place:muiquun`, `place:nahab`, `place:odeck`, `place:pororin`, `place:senia`, `place:skoghorn`, `place:tariv`, `place:thoron-town-hall-ruins`, `place:tinkerton-dig-site`, `place:totemfelt`, `place:vellua`
- Camps: `place:anvil-hill-bandit-camp`, `place:arima-jahr-camp`, `place:crescent-camp`, `place:denn-river-bandit-camp`, `place:duskway-camp`, `place:duskway-camp-ironcrawler-station`, `place:ghadir-jahr-camp`, `place:greenfield-bandit-camp`, `place:haunted-hill-camp`, `place:ironwood-forest-bandit-camp`, `place:kuhte-ram-camp`, `place:mustawi-jahr-camp`, `place:perwin-prison-camp`, `place:rockshade-bandit-camp`, `place:shadow-cliff-watch-camp`, `place:southern-riverside-bandit-camp`, `place:timberdale-bandit-camp`, `place:yalwi-jahr-camp`, `place:steel-mountains-camp`, `place:gate-of-peace-northern-camp`, `place:howlsands-camp-hearth`, `place:izvatu-bandit-camp`, `place:makha-ram-camp`

## R4 (C3): main story content

Status 2026-09-06: applied (commit "Apply the R4 review of the C3 main
story content", Grok, one pass): all five blocking items and every
should-fix and nit except the two rejected below and the ref conversions
deferred to C5 and C7. Orchestrator checks before the review: every
record validates, ids unique, refs resolve, one https source each; every
cited URL returns 200 except the Forbes article on the Kliff seed (bot
block); a script found no 7-word run of any summary, step, body or
warning on a cited page beyond five factual phrases (an instruction, a
boss name, a title, a place phrase); the per-chapter counts match
GameRant's list. Decisions on findings that do not stand as written:
`quest:ambush` keeps no prerequisite (it is the first quest of the game);
`quest:journeys-end` gets a `chapter` prerequisite whose `value` is the
epilogue's title string (the schema allows a string and the app matches
titles exactly); converting text rewards to `item` and `enemy` refs waits
for C5 and C7 as the review itself says.

### R4 review: C3 main story content (Cursor/Grok 4.6, 2026-09-06)

**Blocking** (wrong facts, invented facts, copied prose, schema misuse)
- `quest:lust-for-power` (`data/content/quest.json`) — `confidence` is `reported` and the record repeats Witch's Ring, Stardust Necklace, Earring of Dark Magic, Crow Whisperer, and Greymane's Earring. The research file marks this quest "not individually described beyond its name"; those items are already granted on `quest:shattered-ties`, `quest:thinning-blade`, and `quest:veiled-witch`. Set `confidence` to `assumed`. Drop the five items here (keep them only on the quests Game8 actually attaches them to).
- `quest:new-horizons` (`data/content/quest.json`) — `confidence` is `reported`. The research file marks it "not individually described beyond its name"; the body already says the steps are inferred. Set `confidence` to `assumed`. Keep Dark Executioner Leather Armor on this last-of-chapter record.
- `quest:the-sage-of-the-desert` (`data/content/quest.json`) — steps have Kliff seek and defeat Master Du. The research file does not match this name to a walkthrough beat; `quest:enlightenment` already has the sourced Master Du fight. Do not invent a second fight. Keep `assumed`. Replace the steps with name-only work (or drop the fight).
- `quest:the-end-of-greed` (`data/content/quest.json`) — `confidence` is `reported`. The research file gives only start: Serkis Estate (arc header). The summary and step 2 invent a Goldleaf lead; that is `quest:the-dark-veil`. Set `confidence` to `assumed`, or drop the Goldleaf text and keep the Serkis Estate travel step.
- `quest:the-crows-warning` (`data/content/quest.json`) — `confidence` is `reported`. The research file says gather clues about the crow in Hernand. Step 2 and the summary invent a White Crow abduction match; `collect` does not fit that text. Drop step 2 / the White Crow line, or set `confidence` to `assumed` and change the action to `other`.

**Should fix**
- `quest:journeys-end` (`data/content/quest.json`) — first quest of the Epilogue has only a quest prereq to `quest:blinding-darkness`. Every other chapter's first quest has a `chapter` prereq whose `value` matches the title number. Add a `chapter` prereq (`value` `13` or `"epilogue"`).
- `quest:ambush` (`data/content/quest.json`) — first quest of `Prologue: Dead of Night` has no prerequisites. Add a `chapter` prereq (`value` `0` or `"prologue"`) so the first-of-chapter rule is consistent.
- `quest:woman-in-white` (`data/content/quest.json`) and `quest:trial-of-the-winds` (`data/content/quest.json`) — Chapter 1 unlocks include Glide; that unlock is missing from the Chapter 1 last quest. The leftover side record claims gliding is granted in Chapter 2 at the first Ancient Obelisk. The research file never names Trial of the Winds. Put Glide on the Chapter 1 bundle (`quest:woman-in-white`, or the quest that actually teaches it). Reword or drop the glide reward on `quest:trial-of-the-winds` so the leftover does not contradict the fact file. Keep `quest:trial-of-the-winds` and `quest:early-encounter` as `kind: "side"` and out of `storyline:main` (that part is correct).
- `quest:the-iron-pots-usage` (`data/content/quest.json`) — Kuku Pot is stored as `kind: "unlock"`. The research file lists it as a pot/reward ("needed for Abyss use"). The contract is `item` + `text` for gear. Change the reward to `kind: "item"`, `text: "Kuku Pot"`.
- `quest:a-fleeting-dream` (`data/content/quest.json`) — Woosa and Maegu ally unlocks sit here. The research file ties that to `quest:where-the-wind-guides-you`. Move those two `unlock` rows to that quest. Keep this record's own items (Ponytail Ticket, Official Knight set, Eclipsed Solas Plate Gloves, Spire of Clockwork Key).
- `quest:time-to-face-justice` (`data/content/quest.json`) — `unlock` text says "Oongka playable". The research file says Oongka is recruited in Chapter 6 and is permanently playable after an epilogue quest (Vulkk, single source). Soften the text to that qualifier; do not treat Chapter 7 as the permanent unlock.
- `quest:thinning-blade`, `quest:six-pensive-statues-and-the-evil-spirit`, `quest:veiled-witch` (`data/content/quest.json`) — each chains to the previous trial line. The research file (and `storyline:main` Chapter 9 `pointsOfNoReturn`) says the four trial lines after The Calling have no forced order. Keep the chapter list order for display. Drop the quest prereqs that lock Thinning Blade, Six Pensive Statues, and Veiled Witch behind the prior trial. Gate `quest:enlightenment` on finishing all four lines (or leave that gate `assumed` in `body`).
- `storyline:main` Chapter 9 `pointsOfNoReturn` (`data/content/storyline.json`) — the any-order / suggested-order line is not a lock. D16/T17 will warn it as a point of no return. Move it to `body`. Suggested order in the research file is Shattered Ties, Veiled Witch, Thinning Blade, then Six Pensive Statues; that wording can stay in `body`.
- `storyline:main` Epilogue `pointsOfNoReturn` (`data/content/storyline.json`) — finishing 40 Abyss Challenges is optional side content that unlocks a true ending, not a chapter lock. Move it to the storyline-level `pointsOfNoReturn` (or `body`) so starting the epilogue is not shown as closing that set.
- `storyline:main` `body` (`data/content/storyline.json`) and `place:greymanes-camp` (`data/content/place.json`) — both say sources disagree on Hernand vs Pailune for the opening camp. `docs/RESEARCH-MAIN-STORY.md` states the prologue hub as Hernand (Greymanes camp). Drop the disagreement, or cite `docs/RESEARCH-COMPANION.md` as the other file. Omitting `region` on the camp and on the six prologue quests can stay until that is settled.
- `storyline:main` Chapter 8 `pointsOfNoReturn` (`data/content/storyline.json`) — missing that Damiane kills Bastier in the forced Damiane-only stretch (Vulkk; Game8 names Bastier on A Fleeting Dream). Add that clause. Beatrice's death standing is already there.
- `character:barden-middler` (`data/content/character.json`) — used as Marshal Middler in `quest:first-step-to-rebuilding` and `quest:the-counterattack-ch6`. The research file lists Barden Middler (Chapter 2) and Marshal Middler (Chapters 3 and 6) separately and never says they are one person. Add alias `Marshal Middler` and an `assumed` note, or split the record.
- `quest:return-home` (`data/content/quest.json`) — step 1 invents leaving Calphade Castle; the research file only says speak with comrades. Step 2 `refs` is only `faction:greymanes`. Drop the castle leave, or mark `assumed`. Point the talk step at a character or place, not only a faction.
- `quest:cloud-castle-orbian` (`data/content/quest.json`) — Blackstar is `kind: "unlock"` with no `ref`. After C7, point this at a `mount:` id. Leave as `unlock` + text until that record exists.
- Gear rewards on last-of-chapter and boss quests (`data/content/quest.json`) — almost all named gear is `item` + `text` and no `ref`. `quest:toward-the-nest` already refs seed `item:blackwing-mask` and leaves Blackwing Leather Armor / Tauria Curved Sword as text. Once C5 exists, convert those text rows to `item` refs. Do not invent item ids now.

**Nits**
- `place:hernand-church` (`data/content/place.json`) — `name` is `Church`. The research file only has "a church" / Secret at the Church. Keep the record; treat the name as a placeholder and rename when the in-game name is known.
- `character:witch` (`data/content/character.json`) — keep. Sources call the Chapter 9 guide "the Witch"; it is not a duplicate of `character:hexe-marie`.
- `character:old-beggar` (`data/content/character.json`) — keep. That is the Game8 giver name for Mysterious Man.
- `character:orc-captain` and `character:dean-of-the-scholastone-institute` (`data/content/character.json`) — keep. Those are the source labels.
- C3 characters (`data/content/character.json`) — none has `region`. Add the chapter hub (`region:hernand`, `region:pailune`, …) where the research file names one; leave prologue `character:sebastian` without a region.
- `quest:ambush` step 2 (`data/content/quest.json`) — `refs` is only `faction:black-bears`. Add `place:greymanes-camp` (and an enemy id once C7 has Black Bear Elite).
- `quest:cheers-echoing-from-the-edge` (`data/content/quest.json`) — Hornsplitter / Kailok has no `refs`. Add an `enemy:` id when C7 exists.
- `quest:fragments-of-darkness` (`data/content/quest.json`) — destroying totems uses `fight`. Prefer `other` or `solve`.
- `place:urdavah` (`data/content/place.json`) — `kind` is `town`. Companion region notes call Urdavah a village; this fact file does not specify. Switch to `village` only if a later source does.
- `enemy:crowcaller` (`data/content/enemy.json`) — seed leftover, `rank: "world-boss"`. Chapter 5 treats Crowcaller as a story boss. Set `story-boss` when C7 rewrites the record. `quest:toward-the-nest` already refs this id.
- No second Hernand and no second Greymanes camp. `place:greymanes-camp` is the opening raid; `place:howling-hill` is the Chapter 3 rebuild.

**Sampled and sound**
- `quest:actions-speak-louder-than-words`
- `quest:reunion`
- `quest:reward-for-their-sweat`
- `quest:hope-after-the-draught`
- `quest:obsession-and-madness`
- `quest:the-touch-of-deliverance`
- `quest:all-quiet-on-the-front`
- `quest:shadows-over-pailune`
- `quest:broken-claws`
- `quest:where-the-wind-guides-you`
- `quest:traitor-ch8`
- `quest:crossing-point`
- `quest:the-gate-of-war`
- `quest:the-city-of-steel`
- `quest:precise-execution`
- `quest:hernand-in-chaos`
- `quest:the-face-behind-the-mask`
- `quest:twisted-fate`
- `quest:the-cloister-of-enlightenment-ii`
- `quest:blinding-darkness`
- `quest:cheers-echoing-from-the-edge`
- `quest:the-blood-coronation`
- `quest:the-unyielding-shields-epilogue`

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

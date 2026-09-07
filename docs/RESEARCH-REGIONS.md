# Research: world regions, sub-areas, settlements and camps

Compiled 2026-09-06 to support later JSON records for the companion's world data
(regions, sub-areas, settlements, camps). Facts only; wording is this file's
own. Confidence: reported per-fact ("single-source" flag below); D13 scale not
applied here since this predates the content pipeline for these record types.

## Sources

Access note: `crimsondesert.fandom.com` returned **HTTP 402 Payment Required**
to every direct WebFetch attempt in this session (checked from multiple pages,
different times) — this looks like a systematic bot/paywall block on the
fetch tool rather than a per-page problem, so it is not retried per-page below.
Where a fandom page's content was still needed, the fact was instead drawn
from a WebSearch result snippet that quotes/summarizes that page; those are
marked "(via WebSearch synthesis)" and the exact fandom URL is still given so
another author can verify it directly (e.g. by fetching it themselves outside
this tool). `crimsondesert.gaming.tools` and `thegameswiki.com` are not on the
preferred list but carry a detailed, well-organized territory/faction/camp
database (structured as region -> territory -> named node) not duplicated
elsewhere; used as supplementary sources, same "(via WebSearch synthesis)"
caveat applies since direct WebFetch of gaming.tools returned HTTP 403 and
thegameswiki.com returned HTTP 429 on every attempt this session. `th.gl` URLs
appeared in several search results (the search tool surfaces them) but were
never used as a source per the task's instruction, even when they were the
only result shown.

Directly fetched (WebFetch), usable content:
- https://gfuel.com/blogs/news/crimson-desert-map-full-region-map-cities-and-more — region-by-region terrain one-liners; a Crimson Desert sub-area table (Tommaso, Varnia, Urdavah, Arcosa).
- https://crimsondesertgame.wiki.fextralife.com/Locations — single page listing ~250 named locations grouped by region (Hernand, Crimson Desert, Delesyia, Demeniss, Pailune, the Abyss, plus a "Sanctums" group); backbone for Sections 2-4 below.
- https://www.powerpyx.com/crimson-desert-full-world-map/ — confirms the 5 regions + Abyss, total map size (90km², 9500m x 9500m), ~100 caves; no political/settlement facts.
- https://crimsondesertgame.wiki.fextralife.com/Interactive_Map_Hernand, .../Interactive_Map_Demeniss, .../Interactive_Map_Delesyia — all three are navigation-hub pages for the map tool itself; no region facts, no sub-area lists (fetched, low/no usable content).
- https://crimsondesertgame.wiki.fextralife.com/Crimson_Desert — mostly a location-list stub (gold mine names only); confirms "Regions are the different areas that make up the world, Pywel."
- https://crimsondesertgame.wiki.fextralife.com/Hernand — City of Hernand is the capital of Hernand; Hernand Castle is the stronghold of the Duchy of Hernand; lists ~180 Hernand sub-locations (page otherwise an unfinished template).
- https://crimsondesertgame.wiki.fextralife.com/Demeniss — unfinished template; sub-area names only (Reventine Monastery/Winery, Steel Mountains, Bay of Steel, Golden Plains, Denn River).
- https://crimsondesertgame.wiki.fextralife.com/Pailune — unfinished template; sub-area names only (Camp Bjornlund, Trovak Camp, Silver Wolf Mountain, Five-Finger Mountain, Second-Finger Cave).
- https://crimsondesertgame.wiki.fextralife.com/Delesyia — unfinished template, no facts (last edited 2026-05-25 per page).
- https://game8.co/games/Crimson-Desert/archives/585763 (Delesyia region guide) — Marni as regional figure, Tinkerton/Timberton, Gorthak (Ironflame Orcs), Dewhaven (Ironwheel workshop), Redfox Merchant Trading Post, Windridge Fortress (Wyvernflames), Mount Benus, "Toll of Delesyia" bell.
- https://game8.co/games/Crimson-Desert/archives/585761 (Hernand region guide) — House Celeste as ducal house, City of Hernand hub, Nas River/Meandering Hills/Steel Mountains(*) named, Calphade as "northern border region", Kharonso (troll village), Pororin Forest (shai/Fadus village), Vellua (fishing village). (*Steel Mountains here conflicts with the Fextralife/Game8-index placement in Demeniss — see Gaps.)
- https://game8.co/games/Crimson-Desert/archives/591407 (All Region Locations) — a second, independent location-by-region index; corroborates the Fextralife Locations page almost name-for-name.
- https://game8.co/games/Crimson-Desert/archives/585764 (Pailune region guide) — Pailune Militia, Blue Fangs/Beighen Militia, Black Bears and Lonely Jackals as current occupiers, Beighen/Vannstein Lake/Wayward Woods/Five-Finger Mountain/Black Wall named, tribe list (Beighen, Knytlingar, Longleaf, Skoghorn, Stjar).
- https://game8.co/games/Crimson-Desert/archives/585766 (Crimson Desert region guide) — Varnia as the region's religious/trade hub (worship of Atima), Urdavah as gateway village, Sage of the Desert, Redwind Merchant Guild, Tashkalp sub-area, Tommaso/Arcosa/Saltroad Camp named.
- https://game8.co/games/Crimson-Desert/archives/588601 (List of All Factions) — full faction roster grouped by region: Hernand (House Celeste, Serkis, Alfonso, Felix, Grace, Roberts + Greymanes etc.), Pailune (Pailune Militia, Beighen/Knytlingar/Longleaf/Skoghorn/Stjar tribes, Black Bears, Lonely Jackals), Demeniss (House Thorel, Azerian, Byron, Elemore, Marshell, Wells + Tariv Sorcerers), Delesyia (Marni, Society of Progress, Ironflame Orcs, Ironwheel of Dewhaven, Cogknights, Wyvernflames), Crimson Desert (Arcosa Tribe, Muiquun Outlaws, Lords of Unclaimed Lands, Sage of the Desert, Sandfang Marauders, Goldenscale Bandits, Dusksong, Savage Fangs, The Faceless, The Helms).
- https://crimsondesert.app/en/guides/all-regions — fetched successfully but flagged **low-confidence**: gives specific numeric level ranges (e.g. "Hernand 1-25") and a chapter-to-region mapping that conflicts with (a) the confirmed fact that the game has no traditional XP/level system (Abyss Artifacts instead — see below) and (b) this project's own vetted `docs/RESEARCH-MAIN-STORY.md` chapter table. Not used for level ranges or chapter mapping; see Gaps.

Failed direct fetches:
- https://crimsondesert.fandom.com/wiki/Pywel — HTTP 402 (two attempts).
- https://crimsondesert.fandom.com/wiki/Crimson_Desert_(region) — HTTP 402.
- https://crimsondesert.fandom.com/wiki/Calphade — HTTP 402.
- https://crimsondesert.fandom.com/wiki/Kweiden — HTTP 402.
- https://crimsondesert.fandom.com/wiki/House_Lanford — HTTP 402.
- https://crimsondesert.fandom.com/wiki/Category:Locations — HTTP 402.
- https://crimsondesertgame.wiki.fextralife.com/Crimson+Desert+(Region) — HTTP 404 (guessed URL, wrong slug).
- https://crimsondesert.gaming.tools/territories/kweiden — HTTP 403.
- https://crimsondesert.gaming.tools/territories/hernand/hernand_calphadecastle — HTTP 403.
- https://thegameswiki.com/crimson-desert/wiki/demeniss-region-guide — HTTP 429.
- https://thegameswiki.com/crimson-desert/wiki/kweiden — HTTP 429.
- https://thegameswiki.com/crimson-desert/wiki/calphade — HTTP 429.

Facts drawn from WebSearch result synthesis (source page named but not itself
directly WebFetched in this session — see access note above):
- https://crimsondesert.fandom.com/wiki/Hernand, /wiki/Demeniss, /wiki/Delesyia, /wiki/Pailune, /wiki/Crimson_Desert_(region), /wiki/Abyss, /wiki/Calphade, /wiki/Kweiden, /wiki/House_Lanford, /wiki/Greymanes, /wiki/Pailune_Militia, /wiki/Skoghorn_Tribe — region character, ruling houses/factions, Calphade/Kweiden status, Abyss lore.
- https://crimsondesert.gaming.tools/territories/hernand (Duchy of Hernand), /territories/kweiden ("Tribal State of Pailune" — see Gaps on the Kweiden naming question), /territories/kweiden/kweiden_skoghornvillage, /territories/delesyian/delesyian_banditcamp, /territories/hernand/hernand_banditcamp, /territories/demenisswest/demeniss_banditcamp, /territories/node_crim_caledoravillage, /territories/node_crim_nahabvillage, /territories/node_crim_muiquunvillage, /territories/node_her_ivyvillage, /territories/node_crim_burhumvillage, /territories/node_crim_helmaravillage, /territories/node_crim_batiharvillage, /knowledge/node_dem_flame_knights (Flame Knights Castle), /knowledge/node_her_dragonkillcastle (Drakesfall Castle), /knowledge/node_dem_ironstronghold (Fort Ironclad), /knowledge/node_her_forthellwood (Fort Hellwood), /knowledge/node_del_windclifffort (Fort Windridge), /knowledge/node_crim_fortmusket (Fort Musket), /knowledge/topography/crimsondesert/crimsondesert_jahrcamp, /knowledge/node_crim_desertfreeswordcamp — settlement/camp/fort facts and region assignment, faction ownership, the "-jahr"/"-ram" camp naming pattern.
- https://crimsondeserthq.com/blog/demeniss-region-guide, https://thegameswiki.com/crimson-desert/wiki/demeniss-region-guide, https://thegameswiki.com/crimson-desert/wiki/pailune-region-guide — corroborate House Thorel/coma/succession-crisis framing for Demeniss and the Pailune tribal breakdown (only reached via search snippet, listed above as 429 on direct fetch).
- https://crimsondesertwiki.net/wiki/locations/Kweiden, https://crimsondesert.app/en/wiki/locations/kweiden, https://crimsondesertwiki.org/locations/kweiden-mountains/ — Kweiden as a Pailune mountain settlement, gateway to the region's high country; Kliff's homeland.
- https://en.wikipedia.org/wiki/Crimson_Desert — general confirmation only (2026 Pearl Abyss release), not used for region/settlement facts.

Not fetched at all, listed only because they appeared repeatedly in search
results and were deliberately excluded per instructions: `crimsondesert.th.gl`
(all paths) and any `mapgenie` URL.

## 1. Regions

### Hernand
- Terrain/climate: temperate; rolling grassland, farmland, forests, river valleys, mountains and some coast; occupies the western/southwestern part of Pywel. Source: game8 585761; gfuel.com (via WebSearch synthesis).
- Political character: a duchy with a ducal house handling external affairs and a marquis house running internal governance; several lesser (baronial/count) houses beneath them. Source: game8 588601 (List of All Factions); fandom /wiki/Hernand (via WebSearch synthesis).
- Ruling house: House Celeste (ducal house, descended from the knight Canta) with House Serkis as the marquis house that manages Hernand's internal administration; House Alfonso, House Felix, House Grace and House Roberts named as subordinate houses. Source: game8 585761; game8 588601.
- Capital/hub settlement: City of Hernand (Hernand Castle is its stronghold). Source: crimsondesertgame.wiki.fextralife.com/Hernand; game8 585761.
- Main-story chapters: Prologue and Chapters 1-6 (Ch5 also touches Demeniss, Ch6 specifically the Calphadean Territory); Hernand recurs as a secondary setting in Ch7-8 and the Epilogue. Source: this project's own docs/RESEARCH-MAIN-STORY.md chapter table (cross-checked against multiple sources there).
- Level range: none given by a reliable source — see Gaps (the only numeric ranges found, from crimsondesert.app, are not used; the game does not use traditional XP levels, see Abyss note below).

### Pailune
- Terrain/climate: harsh, snow-covered mountain region in the north of Pywel; steep terrain, limited visibility, described as the coldest region. Source: WebSearch synthesis of multiple sources incl. gfuel.com, game8 585764.
- Political character: no single central government by the time of the story — a patchwork of resistance groups, native tribes and occupying hostile forces (Black Bears, Lonely Jackals); the Greymanes (the protagonist's warband) originate here and were once its protectors under founder Gian. Source: game8 585764; fandom /wiki/Greymanes, /wiki/Pailune_Militia (via WebSearch synthesis).
- Ruling house/faction: no ruling house — the Pailune Militia (centered on the settlement of Pailune) and named tribes (Beighen, Knytlingar, Longleaf, Skoghorn, Stjar) hold territory; a resistance militia called the Blue Fangs (also called the Beighen Militia) opposes the Black Bear occupation. Source: game8 585764; game8 588601.
- Capital/hub settlement: the settlement of Pailune (sometimes called Pailune Castle in fast-travel data — see Section 3) is treated as its capital in the faction writeup; the region's fast-travel bell is only reachable after Chapter 7. Source: game8 585764.
- Main-story chapters: Chapter 7 ("Homecoming", with Demeniss) is Pailune's main-story chapter; it recurs as a secondary setting in Chapter 8. Source: docs/RESEARCH-MAIN-STORY.md.
- Level range: none given by a reliable source.

### Demeniss
- Terrain/climate: fortified cities and grand military installations set on golden plains, on a cliffside behind high walls. Source: fandom /wiki/Pywel (via WebSearch synthesis); gfuel.com.
- Political character: the most aristocratic/political region — the seat of noble-house intrigue, royal institutions, military orders and church influence; described as one of the most unstable regions in Pywel because of a succession crisis. Source: WebSearch synthesis of fandom /wiki/Demeniss and crimsondeserthq.com/blog/demeniss-region-guide.
- Ruling house/faction: House Thorel formerly ruled and unified Demeniss's territories, but King Edward Thorel is in a coma and named no heir, opening a power vacuum; other noble houses in play are Azerian, Byron, Elemore, Marshell (patron of Grand General Bastier) and Wells (a ducal house said to govern Demeniss's southern reaches); Gabriel Caliburn seizes power during the "Blood Coronation." Source: WebSearch synthesis (fandom, crimsondeserthq.com); game8 588601.
- Capital/hub settlement: Demeniss Castle / City of Demeniss (exact preferred name not confirmed by a source read in full — see Gaps).
- Main-story chapters: Chapter 8 ("Blood Coronation", with Pailune and Hernand), Chapter 10 ("Counterattack"), Chapter 12 ("The Abyss", then the Abyss itself); also a secondary setting in Ch5, Ch7 and Ch9, and in the Epilogue. Source: docs/RESEARCH-MAIN-STORY.md.
- Level range: none given by a reliable source.

### Delesyia
- Terrain/climate: Pywel's most technologically distinct region — described elsewhere as entering an industrial/steampunk-like age (factories, railways, automated machinery, airships) while Hernand and Demeniss stay medieval. Source: WebSearch synthesis of fandom /wiki/Delesyia and consolepulse.com.
- Political character: run less by nobility than by engineering institutions and guilds; internal tension between factions that want machines to replace human labor and factions that want machines to only assist humans. Source: WebSearch synthesis; game8 585763.
- Ruling house/faction: no ruling noble house identified by any source read — Marni (an engineer) and the institutions he founded or influences (Society of Progress, Delesyia National Institute, Delesyian Aerial Force, Cogknights, "Marni's Tinkertons") are the region's dominant civil power; the Ironwheel of Dewhaven and the Ironflame Orcs (led by Valgash, at Gorthak) are named factions within the region; the Wyvernflames hold Fort Windridge as hostile occupiers. Source: game8 585763; game8 588601.
- Capital/hub settlement: not clearly named by any source read — Marni's castle/clocktower (site of the "Toll of Delesyia" bell) is the closest candidate but no settlement name was given for it. See Gaps.
- Main-story chapters: Chapter 11 ("Truth and Reality"). Source: docs/RESEARCH-MAIN-STORY.md.
- Level range: none given by a reliable source.

### Crimson Desert (region)
- Terrain/climate: arid, red-sand desert with canyons, oases, sandstorms and pockets of wetland/rainforest; the north-easternmost major region and the game's namesake. Source: WebSearch synthesis of fandom /wiki/Crimson_Desert_(region); game8 585766.
- Political character: no unified nation or sovereign authority — an immense, largely lawless territory where settlements, religious communities, merchant guilds, tribes, outlaws and mercenary groups coexist. Source: WebSearch synthesis of fandom /wiki/Crimson_Desert_(region).
- Ruling house/faction: none — named civil factions include the Lords of Unclaimed Lands, the Arcosa Tribe, the Redwind Merchant Guild, the pilgrim-town Urdavah and the holy city Varnia (worship of Atima), plus the Sage of the Desert (an "enlightened goblin preacher," tied to Chapter 9's plot); hostile factions include the Sandfang Marauders, Goldenscale Bandits, Dusksong, Savage Fangs, The Faceless and The Helms. Source: game8 585766; game8 588601.
- Capital/hub settlement: Varnia is named as the region's religious/trade hub; Urdavah and Tommaso are also treated as major waypoints. Source: game8 585766.
- Main-story chapters: Chapter 9 ("The Sage of the Desert", with Urdavah and Demeniss). Source: docs/RESEARCH-MAIN-STORY.md.
- Level range: none given by a reliable source.

### The Abyss
- Nature: a separate map layer above the main continent, reachable via Abyss Nexus/Gate points; not a ground "region" and has no ruling house or political character in any source read. Source: WebSearch synthesis of fandom /wiki/Abyss; powerpyx.com.
- Terrain: floating islands ("Sky Islands"), each a self-contained puzzle area; Pearl Abyss describes it as "the cradle of providence." Source: WebSearch synthesis (fandom /wiki/Abyss; thegameswiki.com Sky Islands page; pywel.app abyss-system guide).
- Lore/mechanics: source of Abyss Artifacts — collectible items that permanently raise Health, Stamina and a "Spirit" stat and unlock skills; this is confirmed to replace a traditional XP/level system (single-source-of-confirmation but stated plainly and consistently in the WebSearch synthesis of thegameswiki.com's Early Progression Guide and Game Progress Route pages). The Library of Providence, called the Abyss's grandest structure, holds lore about Pywel's creation and the Abyss's own nature.
- Main-story chapters: interludes in the Prologue and Chapter 1 (Corridor of the Void, Axiom Archive), the climax of Chapter 12 ("The Abyss"), and again in the Epilogue (the 40 Abyss Challenges' "true ending"). Source: docs/RESEARCH-MAIN-STORY.md.
- Level range: not applicable — see Abyss Artifact note above.

## 2. Sub-areas

Region assignment comes from the two independent location indexes (Fextralife
Locations page and Game8's "All Region Locations" page, archive 591407, which
corroborate each other almost name-for-name) unless a different URL is given.
Names from the task's fast-travel hint list that could not be confirmed as a
named sub-area anywhere are listed in Gaps, not here.

### Hernand

| Name | What it is | URL |
|---|---|---|
| The Argent Peaks | Mountain range | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Anvil Hill (+ Anvil Basin, Anvil Riverside) | Hill/basin/riverside area, has its own bandit camps | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Rocca's Hill | Hill area with a beacon and (per task list) several bandit camps | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Duskwood | Forest | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Deepwoods | Forest (named via "Southern Deepwoods Bandit Camp") | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Sunrise Plains | Plains | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Greenfield Highlands (+ Greenfield Gorge) | Highland/gorge area | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Mountain of Frozen Souls | Mountain, has a cave (Frozen Soul Cave) | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Pororin Forest | Forest, home to a hidden shai/Fadus village | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/585761 |
| Arboria Forest | Forest | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Drakesfall Gorge | Gorge | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Mistwind (Stepped Hillside) | Hillside | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Nas River (+ Upper Nas River, Nas Riverside) | River | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/585761 |
| Warspike (Fort Warspike + 3 gates) | Fort/territory with named gates | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Halssius Conflux | River/waterway confluence, has a trading post and apothecary | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Calphadean Territory (Calphade) | Frontier territory of the Duchy of Hernand, seat of House Lanford, borders Pailune | https://crimsondesert.gaming.tools/territories/hernand (via WebSearch synthesis) |
| Hernandian Mountains | Mountains (named via "Hernandian Mountains Bandit Camp") | via WebSearch synthesis, no direct wiki page fetched |
| Everfrost (+ Everfrost Basin) | Cold basin area | https://crimsondesertgame.wiki.fextralife.com/Locations |
| The Witchwoods / Forest of Wolves / Black Forest | Forested areas (three separate names, all Hernand) | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Windland Canyon / Windland Heights | Canyon/heights area | https://crimsondesertgame.wiki.fextralife.com/Locations |

### Pailune

| Name | What it is | URL |
|---|---|---|
| Silver Wolf Mountain (+ cave) | Mountain | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Five-Finger Mountain (+ First-Finger Lake, Second-Finger Cave) | Mountain range with named "fingers" | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Wayward Woods | Forest, home to the Longleaf Tribe | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/585764 |
| Black Wall | Wall/ridge landmark | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Scorched Mountain | Mountain | https://game8.co/games/Crimson-Desert/archives/591407 |
| Upper Denn River | River stretch | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Vannstein Lake | Lake | https://game8.co/games/Crimson-Desert/archives/585764 (single-source) |
| Tribal State of Pailune / Kweiden | Umbrella territory name for Pailune's tribal lands in one source's data hierarchy (see Section 3 and Gaps for the Kweiden naming question) | https://crimsondesert.gaming.tools/territories/kweiden (via WebSearch synthesis, single-source) |

### Demeniss

| Name | What it is | URL |
|---|---|---|
| Kingshield Mountains | Mountain range | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Smoking Lands | Named terrain feature (nature not detailed by any source read) | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Serpent Marsh | Marsh | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Valley of the Moon | Valley | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Eye of Ice | Named terrain feature (nature not detailed) | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Steel Mountains (+ Bay of Steel) | Mountain range and adjoining bay; **see Gaps** — one Game8 page (585761) instead places "Steel Mountains" in Hernand | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Morning Mist Peaks | Mountain peaks | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Thornbriar Mountains | Mountain range | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Ironwood Forest (+ Ironwood Cape, Ironwood Highland Plains) | Forest/cape/plains cluster | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Denn River (+ Central Denn River Basin) | River | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Golden Plains | Plains | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Gate of Peace | Gate/chokepoint in the wall between Demeniss and Gorthak (Delesyia) — a border landmark, not clearly inside either region | https://crimsondesert.gaming.tools/knowledge/node_neut_delpheon (via WebSearch synthesis, single-source) |

### Delesyia

| Name | What it is | URL |
|---|---|---|
| Beardtree Hills | Hills | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Benus River / Mount Benus | River and mountain (Mount Benus hosts a "Gate to Advancement" spire per Game8) | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/585763 |
| Drywind Valley | Valley (task's fast-travel hint says "Drywind Hills" — naming mismatch, see Gaps) | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Chittering Forest | Forest | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Serpent Shrine | Shrine/landmark | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Snaketail Wall | Wall/ridge landmark | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Gorthak | Territory of the Ironflame Orcs (led by Valgash), on the Demeniss border at the Gate of Peace | https://game8.co/games/Crimson-Desert/archives/585763; https://crimsondesert.gaming.tools/knowledge/node_neut_delpheon (via WebSearch synthesis) |
| Timberdale | Named area (nature not detailed; confirmed to exist via "Timberdale Bandit Camp" in the Delesyian Bandit Camps set) | https://crimsondesert.gaming.tools/territories/delesyian/delesyian_banditcamp (via WebSearch synthesis, single-source) |

### Crimson Desert (region)

| Name | What it is | URL |
|---|---|---|
| Crimson Mountains | Mountain range, has a gold mine | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Valley of Fire | Valley | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Gloomy Forest | Forest | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Saltroad | Road/trade route through the desert | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Giant's Yard | Named area with a resource camp | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Trader's Expanse | Trade route/expanse, passed on the way to Varnia | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/585766 |
| Sovereign Wastes | Wasteland area (closest confirmed match to the task's generic "Wasteland" hint) | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Tashkalp | Sub-area holding the villages of Muiquun and Caledora and one of the region's two fog-clearing bells | https://game8.co/games/Crimson-Desert/archives/585766; https://crimsondesert.gaming.tools/territories/node_crim_caledoravillage (via WebSearch synthesis) |
| Rainforest | Rainforest area (closest confirmed match to the task's "Damp Rainforest" hint) | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| World's Navel | Named landmark area | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Howlsands (Dunes) | Dune area, stronghold of the Sandfang Marauders | https://crimsondesert.gaming.tools/knowledge/node_crim_howlsandscamp (via WebSearch synthesis, single-source) |
| Border Trail | Named area with a bandit camp | via WebSearch synthesis, no specific wiki URL found (single-source, low confidence) |
| Izvatu | Site of the largest raider base in the Crimson Desert (the Dusksongs, said to originate from Demeniss) | https://crimsondesert.gaming.tools/territories/node_crim_isvatufortress (via WebSearch synthesis, single-source) |
| Twinpath | Black Bear-built outpost monitoring the road toward Pailune and Denn River / near The Sage's Peak — likely a Hernand/Pailune border area rather than squarely in one region | https://crimsondesert.gaming.tools/knowledge/node_kwe_doublesteppass (via WebSearch synthesis, single-source) |

Unconfirmed against any source read (kept out of the tables above, see Gaps):
Valley of Grief, Crimson Plateau, Crimson Valley, Sandshift Basin (one weak
single-source hit as an "Ironcrawler Station", region unclear), Desert Pass,
Snowfield, Frost, Redrock, Sena River, Coastal Cliff (only found as a Delesyia
bandit-camp name, not confirmed as a named area in its own right), Jungle,
Desertshade, Saltshade, Wasteshade, Rockshade, Sunrise Cliff, Riverside Cliff,
Rockledge, Greenhill (only found as a Hernand bandit-camp name), Whisperleaf.

## 3. Settlements

Region column: a bare region name means a source stated it (see the row's
URL); "(inferred from position)" means no source gave the region and the call
comes only from the map-pixel coordinates in the task brief compared against
the confirmed settlements/sub-areas around them. Blank cells mean no fact was
found — left blank per instructions rather than guessed.

| Name | Region | Kind | Ruling house/faction | Notable NPCs/vendors/services | Chapter(s) | Facts | URL(s) |
|---|---|---|---|---|---|---|---|
| Hernand Castle (City of Hernand) | Hernand | city (castle is its stronghold) | House Celeste (ducal); House Serkis (marquis house, runs internal administration) | | Prologue-6 (capital of the region across most of the early game); named directly in Ch1 | Capital of the Duchy of Hernand; "rich with water resources," defensible | https://crimsondesertgame.wiki.fextralife.com/Hernand; https://game8.co/games/Crimson-Desert/archives/585761; docs/RESEARCH-MAIN-STORY.md |
| Calphade Castle | Hernand (Calphadean Territory) | castle | House Lanford | | Ch6 ("Cracks in the Shield," set in the Calphadean Territory) | Chief stronghold of a frontier territory that guards Hernand's northern march against Black Bear incursions; defined by border war and military production | https://crimsondesertgame.wiki.fextralife.com/Locations; https://crimsondesert.gaming.tools/territories/hernand (via WebSearch synthesis); docs/RESEARCH-MAIN-STORY.md |
| Demeniss Castle | Demeniss | castle | House Thorel (nominal ruling family, in a succession crisis) | | Ch8, Ch10, Ch12 (Demeniss's main-story chapters) | Political capital of Pywel; site of aristocratic power struggles among several noble houses | https://crimsondesertgame.wiki.fextralife.com/Locations (via WebSearch synthesis for the political facts); docs/RESEARCH-MAIN-STORY.md |
| Dewhaven Castle | Delesyia | castle | Ironwheel of Dewhaven (a production/workshop faction based there) | | | Site of an "Ironwheel" workshop; the Ironwheel of Dewhaven believes machines should assist humans rather than replace them (a stance opposed to Marni's) | https://game8.co/games/Crimson-Desert/archives/585763; https://game8.co/games/Crimson-Desert/archives/588601 |
| Fort Musket | Demeniss | fort | | | | Forward base built by Demeniss for its expansion/invasion into the Crimson Desert; sits north of Demeniss and south of the Valley of the Moon | https://crimsondesert.gaming.tools/knowledge/node_crim_fortmusket (via WebSearch synthesis, single-source) |
| Hexe Sanctuary | Demeniss | other (sanctuary/landmark) | | | possibly Ch9 (single-source inference: Hexe Marie, a Ch9 boss per docs/RESEARCH-MAIN-STORY.md, shares the name) | | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Kweiden | Pailune | town/village | No single ruling faction stated — described as a mix of local Pailune clans, Greymane clan members and mercenaries (single-source) | | | Rugged mountain gateway settlement built in Pailune's Norse-influenced timber-longhouse style; principal staging point for expeditions into Pailune's higher/more dangerous reaches; has a full vendor set, a blacksmith and a bounty/delivery notice board; Kliff (the protagonist) is said to hail from Kweiden | https://crimsondesertwiki.net/wiki/locations/Kweiden; https://crimsondesert.app/en/wiki/locations/kweiden; https://crimsondesertwiki.org/locations/kweiden-mountains/ (all via WebSearch synthesis) |
| Pailune (Pailune Castle) | Pailune | city/castle | Pailune Militia | | Ch7 ("Homecoming") | Treated as Pailune's capital in the faction writeup; its fast-travel bell is locked behind a conflict area until Chapter 7 | https://game8.co/games/Crimson-Desert/archives/585764 |
| Skoghorn | Pailune | village | Skoghorn Tribe | | | Mountain tribe village in western Pailune, one of the region's coldest/most isolated territories; survives on cold-resistant farming, ranching and fishing; worships a "mountain spirit" of the snowy highlands (single-source for the religious detail) | https://crimsondesert.gaming.tools/faction-quests/kweiden/skoghorn; https://crimsondesert.fandom.com/wiki/Skoghorn_Tribe (both via WebSearch synthesis) |
| Steel Mountains | Demeniss per the two location indexes; **but see Gaps** — its task-given coordinates sit inside the southern Hernand village cluster, far from Demeniss Castle | landmark | | | | Mountain range name doubling as a fast-travel point; no settlement-level facts found (kind is a best guess — it may be a landmark rather than a settlement) | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/591407 |
| Thoron Town Hall Ruins | (inferred from position — ambiguous between Crimson Desert and Delesyia) | ruins | | | | No facts found beyond the name; not located in either location index read | |
| Castlewood Ruins | Hernand (inferred from position) | ruins | | | | No facts found beyond the name | |
| Arboria | Hernand | village | | | | Fextralife's Hernand list also names a separate "Arboria Castle" and "Arboria Craftshop" at the same place | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Arcosa | Crimson Desert | village/town | Arcosa Tribe | | | Described as the region's "most prosperous village," constantly defended against bandit raids; has watchtowers | https://gfuel.com/blogs/news/crimson-desert-map-full-region-map-cities-and-more; https://game8.co/games/Crimson-Desert/archives/588601 |
| Arcosa Trade Depot | Crimson Desert (inferred — satellite of Arcosa) | other (trade depot) | | | | No facts found beyond the name | |
| Batihar | Crimson Desert | village | The Helms (seized it by force) | Rusten (named as "their weapon" used to take the village) | | The Helms use Batihar as a captured base | https://crimsondesert.gaming.tools/territories/node_crim_batiharvillage (via WebSearch synthesis, single-source) |
| Beighen | Pailune | village | Beighen Tribe; Blue Fangs (a resistance militia also called the "Beighen Militia") | | | Described as Pailune's "southern village" | https://game8.co/games/Crimson-Desert/archives/585764; https://game8.co/games/Crimson-Desert/archives/588601 |
| Burhum | Crimson Desert | town | Disciples of Master Du | Master Du (named resident; also named as a Ch9 boss in docs/RESEARCH-MAIN-STORY.md) | possibly Ch9 (single-source inference) | Known for a labyrinth-like tower architectural style | https://crimsondesert.gaming.tools/territories/node_crim_burhumvillage (via WebSearch synthesis, single-source) |
| Caledora | Crimson Desert | village | | | | In the Tashkalp sub-area near Tommaso; known for vibrant dyed fabrics | https://crimsondesert.gaming.tools/territories/node_crim_caledoravillage (via WebSearch synthesis, single-source) |
| Duzhar | Crimson Desert | village (ruins per source) | | | | Small village near Fort Manub, reduced to ruins after the "Twilight Messengers" faction set up a base there and began kidnapping residents | https://crimsondesert.gaming.tools/knowledge/node_crim_duzharvillage (via WebSearch synthesis, single-source) |
| Easelbury | Hernand (inferred from position) | village | | | | No facts found beyond the name | |
| Florindale | Hernand | village | | | | No facts found beyond the name | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Helmara | Crimson Desert | village | The Helms | | | Base of operations for The Helms; described as "the hub of their engineering prowess" despite the faction's reputation as bandits | https://crimsondesert.gaming.tools/territories/node_crim_helmaravillage (via WebSearch synthesis, single-source) |
| Ivynook | Hernand | village | House Serkis | | | Village in the vine-choked wilds; residents cultivate and process vines for a living | https://crimsondesert.gaming.tools/territories/node_her_ivyvillage (via WebSearch synthesis); https://crimsondesertgame.wiki.fextralife.com/Ivynook |
| Muiquun | Crimson Desert | village | Muiquun Outlaws | | | Village at the eastern edge of Tashkalp; scorched by heat and sandstorms, sustained by a small nearby stream | https://crimsondesert.gaming.tools/territories/node_crim_muiquunvillage (via WebSearch synthesis, single-source) |
| Nahab | Crimson Desert | village | The Faceless | | | Small village near Fort Manub kept alive by a well, one of the desert's most valuable resources, despite a nearby Twilight Messengers base | https://crimsondesert.gaming.tools/territories/node_crim_nahabvillage (via WebSearch synthesis, single-source) |
| Odeck | Pailune | village | Odeck Tribe | | | Has its own faction questline (Executioner of Justice, Slumbering Soul per a secondary source not independently verified here) | https://game8.co/games/Crimson-Desert/archives/588601 |
| Pororin | Hernand | village | Pororin Forest Guardians | | | Hidden village of shais and Fadus inside Pororin Forest | https://game8.co/games/Crimson-Desert/archives/585761; https://game8.co/games/Crimson-Desert/archives/588601 |
| Senia | Hernand | village | | | | No facts found beyond the name | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Tariv | Demeniss per faction source (Tariv Sorcerers); position places it inside the Crimson Desert village cluster — **see Gaps** | village | Tariv Sorcerers | | | | https://game8.co/games/Crimson-Desert/archives/588601 |
| Tinkerton Dig Site | Delesyia | other (dig site) | | | | "Tinkerton" is named alongside "Timberton" as places populated by Marni's residents; no further dig-site-specific facts found | https://game8.co/games/Crimson-Desert/archives/585763 |
| Totemfelt | Pailune (inferred from position) | village | | | | No facts found beyond the name | |
| Vellua | Hernand | village | Vellua Fishermen's Guild | | | Southern fishing village; has its own Church of Vellua per the Fextralife location list | https://crimsondesertgame.wiki.fextralife.com/Locations; https://game8.co/games/Crimson-Desert/archives/585761; https://game8.co/games/Crimson-Desert/archives/588601 |

33 of the task's 34 named settlements are covered above (the brief's list, as
given, enumerates 33 distinct names once "Pailune (Pailune Castle)" and
"Hernand Castle (the City of Hernand)" are each counted once).

## 4. Camps

"-jahr" and "-ram" camps: these are all outposts of the several hostile
factions grouped under a "Crimson Desert Outlaws" heading in one source's
territory database — they are not one unified faction. Two examples with a
named parent faction: Khafi-jahr Camp is a Dusksong outpost at World's Navel;
Makha-ram Camp is a Goldenscale Bandits outpost near an "Iguana Hatchery." The
other "-jahr"/"-ram" camps in the task list were found in the same grouping
but without an individual faction attribution. Source (via WebSearch
synthesis, single-source): https://crimsondesert.gaming.tools/knowledge/topography/crimsondesert/crimsondesert_jahrcamp

Region column conventions match Section 3: a bare region name means some
source placed the camp or its named sub-area there; "(inferred)" marks a
call made only from the sub-area it's named after being confirmed to a
region in Sections 1-2, with no source naming the camp itself; blank means no
region evidence was found at all.

### Hernand (26)

| Name | Region | Kind | URL |
|---|---|---|---|
| Anvil Hill Bandit Camp | Hernand | bandit | https://crimsondesert.gaming.tools/territories/hernand/hernand_banditcamp (via WebSearch synthesis) |
| Anvil Riverside Bandit Camp | Hernand | bandit | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Arboria Forest Bandit Camp | Hernand | bandit | https://crimsondesert.gaming.tools/territories/hernand/hernand_banditcamp (via WebSearch synthesis) |
| Argent Peaks Bandit Camp | Hernand | bandit | https://crimsondesert.gaming.tools/knowledge/node_her_whitemountainbanditcamp (via WebSearch synthesis) |
| Argent Peaks Sentry Camp | Hernand (inferred) | sentry | |
| Calphade Logging Camp | Hernand (Calphadean Territory) | logging | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Deepwoods Bandit Camp | Hernand (inferred) | bandit | |
| Drakesfall Gorge Bandit Camp | Hernand | bandit | https://crimsondesert.gaming.tools/territories/hernand/hernand_banditcamp (via WebSearch synthesis) |
| Duskwood Bandit Camp | Hernand | bandit | https://crimsondesertgame.wiki.fextralife.com/Locations; https://crimsondesert.gaming.tools/territories/hernand/hernand_banditcamp (via WebSearch synthesis) |
| Frowde Camp | Hernand | other (camp, kind not further specified) | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Grace Falls Expedition Camp | Hernand (inferred, low confidence — "Grace" may reference House Grace) | research/expedition | |
| Greenfield Bandit Camp | Hernand | bandit | https://crimsondesert.gaming.tools/territories/hernand/hernand_banditcamp (via WebSearch synthesis) |
| Greenfield Camp | Hernand (inferred) | other | |
| Greenfield Highlands Camp | Hernand | other | https://crimsondesert.gaming.tools/territories/hernand/hernand_banditcamp (via WebSearch synthesis) |
| Greenhill Bandit Camp | Hernand | bandit | https://crimsondesert.gaming.tools/territories/hernand/hernand_banditcamp (via WebSearch synthesis) |
| Haunted Hill Camp | Hernand | other | https://crimsondesertgame.wiki.fextralife.com/Locations; https://crimsondesert.gaming.tools/territories/hernand/hernand_banditcamp (via WebSearch synthesis) |
| Hernandian Mountains Bandit Camp | Hernand | bandit | https://crimsondesert.gaming.tools/territories/hernand/hernand_banditcamp (via WebSearch synthesis) |
| Mistwind Bandit Camp | Hernand (inferred) | bandit | |
| Northern Riverside Bandit Camp | Hernand (inferred) | bandit | |
| Northern Rocca's Hill Bandit Camp | Hernand | bandit | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Perwin Prison Camp | Hernand | prison | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Southern Deepwoods Bandit Camp | Hernand | bandit | https://crimsondesertgame.wiki.fextralife.com/Locations; https://crimsondesertgame.wiki.fextralife.com/Southern_Deepwoods_Bandit_Camp |
| Southern Riverside Bandit Camp | Hernand | bandit | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Southern Rocca's Hill Bandit Camp | Hernand (inferred) | bandit | |
| Sunrise Cliff Bandit Camp | Hernand (inferred) | bandit | |
| Sunrise Plains Bandit Camp | Hernand | bandit | https://crimsondesertgame.wiki.fextralife.com/Locations |

### Pailune (9)

| Name | Region | Kind | URL |
|---|---|---|---|
| Black Wall Bandit Camp | Pailune (inferred) | bandit | |
| Camp Bjornlund | Pailune | other | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Five-Finger Mountain Bandit Camp | Pailune (inferred) | bandit | |
| Northern Pailune Bandit Camp | Pailune | bandit | |
| Pailune Camp | Pailune | other | |
| Snowfield Bandit Camp | Pailune (inferred, low confidence — "Snowfield" itself unconfirmed as a named sub-area) | bandit | |
| Southern Pailune Bandit Camp | Pailune | bandit | |
| Trovak Camp | Pailune | other | https://crimsondesertgame.wiki.fextralife.com/Locations |
| Wayward Woods Bandit Camp | Pailune (inferred) | bandit | |

### Demeniss (10)

| Name | Region | Kind | URL |
|---|---|---|---|
| Crescent Camp | Demeniss (inferred, low confidence — Crescent Lake is a Demeniss sub-area) | other | |
| Demeniss Sentry Camp | Demeniss | sentry | |
| Demeniss Supply Camp | Demeniss | supply | |
| Denn River Bandit Camp | Demeniss (inferred) | bandit | |
| Ironwood Bandit Camp | Demeniss | bandit | https://crimsondesert.gaming.tools/territories/demenisswest/demeniss_banditcamp (via WebSearch synthesis) |
| Ironwood Basin Bandit Camp | Demeniss | bandit | https://crimsondesert.gaming.tools/territories/demenisswest/demeniss_banditcamp (via WebSearch synthesis) |
| Ironwood Forest Bandit Camp | Demeniss | bandit | https://crimsondesert.gaming.tools/territories/demenisswest/demeniss_banditcamp (via WebSearch synthesis) |
| Riverside Cliff Bandit Camp | Demeniss | bandit | https://crimsondesert.gaming.tools/territories/demenisswest/demeniss_banditcamp (via WebSearch synthesis) |
| Steel Mountains Camp | Demeniss per the Steel Mountains sub-area sourcing — same region conflict noted in Sections 2-3 applies here | other | |
| Valley of the Moon Bandit Camp | Demeniss (inferred) | bandit | |

### Delesyia (7)

| Name | Region | Kind | URL |
|---|---|---|---|
| Benus River Bandit Camp | Delesyia | bandit | https://crimsondesert.gaming.tools/territories/delesyian/delesyian_banditcamp (via WebSearch synthesis) |
| Coastal Cliff Bandit Camp | Delesyia | bandit | https://crimsondesert.gaming.tools/territories/delesyian/delesyian_banditcamp (via WebSearch synthesis) |
| Dewhaven Logging Camp | Delesyia (inferred) | logging | |
| Gate of Peace: Northern Camp | Delesyia (Gorthak territory, on the Demeniss border) | other | https://crimsondesert.gaming.tools/knowledge/node_neut_delpheonnorthcamp (via WebSearch synthesis) |
| Gate of Peace: Western Camp | Delesyia (Gorthak territory, on the Demeniss border) | other | https://crimsondesert.gaming.tools/territories/node_neut_delpheonwestcamp (via WebSearch synthesis) |
| Gorthak Logging Camp | Delesyia (Gorthak territory) | logging | https://game8.co/games/Crimson-Desert/archives/585763 |
| Timberdale Bandit Camp | Delesyia | bandit | https://crimsondesert.gaming.tools/territories/delesyian/delesyian_banditcamp (via WebSearch synthesis) |

### Crimson Desert (23)

| Name | Region | Kind | URL |
|---|---|---|---|
| Arima-jahr Camp | Crimson Desert | tribal ("-jahr", Crimson Desert Outlaws) | https://crimsondesert.gaming.tools/knowledge/topography/crimsondesert/crimsondesert_jahrcamp (via WebSearch synthesis) |
| Baisun-jahr Camp | Crimson Desert | tribal ("-jahr") | https://crimsondesert.gaming.tools/knowledge/topography/crimsondesert/crimsondesert_jahrcamp (via WebSearch synthesis) |
| Border Trail Bandit Camp | Crimson Desert | bandit | |
| Damp Rainforest Bandit Camp | Crimson Desert (inferred — the region's "Rainforest" sub-area) | bandit | |
| Desert Freesword Camp | Crimson Desert | freesword | https://crimsondesert.gaming.tools/knowledge/node_crim_desertfreeswordcamp (via WebSearch synthesis) |
| Desertshade Bandit Camp | Crimson Desert (inferred, low confidence) | bandit | |
| Freesword Encampment | Crimson Desert | freesword | |
| Ghadir-jahr Camp | Crimson Desert | tribal ("-jahr") | https://crimsondesert.gaming.tools/knowledge/topography/crimsondesert/crimsondesert_jahrcamp (via WebSearch synthesis) |
| Giant's Yard Resource Camp | Crimson Desert (inferred — Giant's Yard is a Crimson Desert sub-area with a named "Giant Yard's Research Group" faction) | research | |
| Gloomy Forest Bandit Camp | Crimson Desert (inferred) | bandit | |
| Hariyah-ram Camp | Crimson Desert | tribal ("-ram") | https://crimsondesert.gaming.tools/knowledge/topography/crimsondesert/crimsondesert_jahrcamp (via WebSearch synthesis) |
| Howlsands Camp Hearth | Crimson Desert | other (Sandfang Marauders stronghold) | https://crimsondesert.gaming.tools/knowledge/node_crim_howlsandscamp (via WebSearch synthesis) |
| Izvatu Bandit Camp | Crimson Desert | bandit (the Dusksongs, said to originate from Demeniss) | https://crimsondesert.gaming.tools/territories/node_crim_isvatufortress (via WebSearch synthesis) |
| Khafi-jahr Camp | Crimson Desert | tribal ("-jahr", a Dusksong outpost at World's Navel) | https://crimsondesert.gaming.tools/knowledge/topography/crimsondesert/crimsondesert_jahrcamp (via WebSearch synthesis) |
| Kharati-ram Camp | Crimson Desert | tribal ("-ram") | https://crimsondesert.gaming.tools/knowledge/topography/crimsondesert/crimsondesert_jahrcamp (via WebSearch synthesis) |
| Kuhte-ram Camp | Crimson Desert | tribal ("-ram") | https://crimsondesert.gaming.tools/knowledge/topography/crimsondesert/crimsondesert_jahrcamp (via WebSearch synthesis) |
| Makha-ram Camp | Crimson Desert | tribal ("-ram", a Goldenscale Bandits outpost) | https://crimsondesert.gaming.tools/knowledge/node_crim_makharamcamp (via WebSearch synthesis) |
| Mustawi-jahr Camp | Crimson Desert | tribal ("-jahr") | https://crimsondesert.gaming.tools/knowledge/topography/crimsondesert/crimsondesert_jahrcamp (via WebSearch synthesis) |
| Qudim-jahr Camp | Crimson Desert | tribal ("-jahr") | https://crimsondesert.gaming.tools/knowledge/node_crim_qudimjahrcamp (via WebSearch synthesis) |
| Sakha-jahr Camp | Crimson Desert | tribal ("-jahr") | https://crimsondesert.gaming.tools/knowledge/topography/crimsondesert/crimsondesert_jahrcamp (via WebSearch synthesis) |
| Saltroad Edge Bandit Camp | Crimson Desert (inferred — Saltroad is a Crimson Desert sub-area) | bandit | |
| Shiqar-jahr Camp | Crimson Desert | tribal ("-jahr") | https://crimsondesert.gaming.tools/knowledge/topography/crimsondesert/crimsondesert_jahrcamp (via WebSearch synthesis) |
| Yalwi-jahr Camp | Crimson Desert | tribal ("-jahr") | https://crimsondesert.gaming.tools/knowledge/topography/crimsondesert/crimsondesert_jahrcamp (via WebSearch synthesis) |

### No region found (16)

No source (direct or via search synthesis) placed these in a region, and no
sub-area they might be named after was confirmed either, so the region cell
is left blank rather than guessed.

| Name | Kind | URL |
|---|---|---|
| Bloodsteel Hearth | other | |
| Bordig Camp | other | |
| Duskway Camp | other | |
| Duskway Camp Ironcrawler Station | other (possibly a stop on a cross-region rail line — see the Sandshift Basin note in Section 2) | |
| Eastern Goblin Camp | goblin | |
| Frost Camp | other | |
| Jungle Research Camp | research | |
| Logging Camp Flag Stop | logging | |
| Mountain Bandit Camp | bandit | |
| Redrock Bandit Camp | bandit | |
| Rockledge Bandit Camp | bandit | |
| Rockshade Bandit Camp | bandit | |
| Saltshade Bandit Camp | bandit | |
| Sandshift Basin Bandit Camp | bandit | |
| Shadow Cliff Watch Camp | sentry/watch | |
| Wasteshade Bandit Camp | bandit | |

## 5. Gaps

### Failed / low-value fetches
- Every `crimsondesert.fandom.com` URL attempted (6 distinct pages, one twice) returned HTTP 402 Payment Required to WebFetch — a systematic block, not a per-page issue. Facts from those pages were instead drawn from WebSearch snippets that quote them; flagged inline throughout.
- `crimsondesert.gaming.tools/territories/kweiden` and `.../hernand/hernand_calphadecastle` — HTTP 403.
- `thegameswiki.com/crimson-desert/wiki/{demeniss-region-guide,kweiden,calphade}` — HTTP 429 (rate-limited; not retried a third time).
- `crimsondesertgame.wiki.fextralife.com/Crimson+Desert+(Region)` — HTTP 404 (wrong guessed slug; the working page is `/Crimson_Desert`, which itself had little content).
- The Fextralife per-region pages (Demeniss, Pailune, Delesyia) and the three "Interactive Map" pages for Hernand/Demeniss/Delesyia all loaded (HTTP 200) but are unfinished templates or navigation stubs with no prose facts — only sub-area name lists were usable from them.
- `crimsondesert.app/en/guides/all-regions` loaded fully but its content (specific numeric level ranges per region, a chapter-to-region table, "underground dwarven city" for Delesyia, "Akum oasis" as the Crimson Desert hub) is not corroborated anywhere else and contradicts confirmed facts (no traditional XP/leveling; this project's own chapter-region research). Treated as unreliable and excluded from Sections 1-4.

### Facts not found
- No capital/hub settlement name was confirmed for Delesyia beyond "Marni's castle/clocktower" (unnamed) — see Section 1.
- No numeric level range was found for any region from a source judged reliable; the game appears to use an Abyss-Artifact power system instead of traditional levels (see the Abyss entry in Section 1), which may mean "level range" is simply not a fact that exists for this game — worth confirming with the person turning this into JSON records before adding a level-range field at all.
- No named NPCs, vendors or services were found for most settlements in Section 3 beyond faction/tribe names already covered in Section 1 — the sources read (mostly region-, faction- and location-index pages) don't go down to individual-NPC detail; that would need per-settlement pages, which the task's fetch budget and the persistent fandom.com block made impractical to chase for all 33 settlements.
- Roughly a third of the sub-area names hinted at in the task brief could not be confirmed as real named areas by any source read: Valley of Grief, Crimson Plateau, Crimson Valley, Sandshift Basin (weak single-source hit, region unclear), Desert Pass, Snowfield, Frost, Redrock, Sena River, Coastal Cliff (only as a bandit-camp name), Jungle, Desertshade, Saltshade, Wasteshade, Rockshade, Sunrise Cliff, Riverside Cliff, Rockledge, Greenhill (only as a bandit-camp name), Whisperleaf. Some of these may simply be camp/rest-point names invented for fast travel rather than named geographic areas — plausible given several ("Desertshade," "Saltshade," "Wasteshade," "Rockshade") share a "-shade" pattern that never turned up as a place name in any location index, only ever as part of the task's own hint list.
- 16 of the 91 camps (Section 4) got no region and no URL at all: Bloodsteel Hearth, Bordig Camp, Duskway Camp, Duskway Camp Ironcrawler Station, Eastern Goblin Camp, Frost Camp, Jungle Research Camp, Logging Camp Flag Stop, Mountain Bandit Camp, Redrock Bandit Camp, Rockledge Bandit Camp, Rockshade Bandit Camp, Saltshade Bandit Camp, Sandshift Basin Bandit Camp, Shadow Cliff Watch Camp, Wasteshade Bandit Camp.
- Fort Manub (mentioned in the task's fort/place list) was never itself directly described by a source — its existence and approximate location are known only because two Crimson Desert villages (Duzhar, Nahab) are each described as "near Fort Manub." Treated as a Crimson Desert-region fort by that association only.

### Conflicts between sources
- **Steel Mountains**: two independent location indexes (the Fextralife Locations page and Game8's "All Region Locations" page, archive 591407) both place Steel Mountains and its Bay of Steel in Demeniss. But a separate Game8 page specifically about the Hernand region (archive 585761) lists "Steel Mountains" among Hernand's geographic features, and the task's own map-pixel coordinate for the "Steel Mountains" fast-travel point (2921, 5887) sits deep inside the southern cluster of confirmed Hernand villages (Florindale, Pororin, Senia, Vellua, Castlewood Ruins), nowhere near Demeniss Castle (3431, 5036). This is a real, unresolved conflict — not just a wording difference — and affects Sections 1, 2, 3 and 4 wherever Steel Mountains appears. Recommend treating the coordinate as the stronger signal (Hernand) unless a fourth source breaks the tie.
- **Kweiden's status**: the task asked whether Calphade and Kweiden are sub-areas of a region or regions in their own right.
  - **Calphade** is well-corroborated as a sub-region/territory *of Hernand* — the "Calphadean Territory," a frontier march of the Duchy of Hernand held by House Lanford, bordering Pailune. Not a region in its own right. Confidence: solid (multiple independent sources agree, including the game's own main-story chapter table, which places Chapter 6 "in the Calphadean Territory" as a Hernand sub-setting).
  - **Kweiden** is less clean. Every prose source read describes it as a *settlement* — a mountain town within Pailune, the gateway to the region's high country, and the protagonist Kliff's home village. But one source's territory-database hierarchy (`crimsondesert.gaming.tools`) files all of Pailune's tribal lands under a top-level node whose URL slug is literally `kweiden`, displayed as "Tribal State of Pailune," with other Pailune territories (e.g. Skoghorn) nested underneath it as children of that node. That could mean the game's own internal data model uses "Kweiden" as a name for Pailune's tribal territory as a whole (parallel to how "Calphade" names a sub-territory of Hernand) — in which case Kweiden might belong in this project's data as a region-level or near-region-level entity after all, not just a settlement. No prose source states this explicitly, so it is flagged here rather than asserted. Recommend the JSON-record author decide based on how the game's own fast-travel UI actually presents it (which this file's author could not access), rather than purely on the wiki prose.
- **Tariv**: Game8's faction list (archive 588601) places the "Tariv Sorcerers" faction under Demeniss. But the task's map-pixel coordinate for Tariv (3441, 4145) sits inside the tight cluster of confirmed Crimson Desert villages (Caledora, Burhum, Batihar, Helmara, Nahab, Duzhar, Muiquun, Arcosa all within roughly 1,300px), not near Demeniss Castle (3431, 5036, over 800px south). Possible explanations not distinguishable from the sources read: the Tariv Sorcerers are a Demeniss-founded order with an outpost/village in the Crimson Desert; the coordinate is for a different "Tariv" than the one hosting the Sorcerers; or the faction-list categorization is simply wrong. Region left as "Demeniss per source, conflicts with position" in Section 3.
- **Fort Hellwood**: one source's own internal categorization names it "Crimson Desert House Celeste" (i.e. a Hernand-house asset, since House Celeste is Hernand's ducal house) while a WebSearch synthesis of the same family of pages separately described it as "south of Senia" (also Hernand, consistent) but additionally mentioned "the Grace domain" (House Grace, also a Hernand house) — internally consistent on region (Hernand) but inconsistent on which Hernand house it belongs to.
- **Hernand chapter range**: this file uses this project's own `docs/RESEARCH-MAIN-STORY.md` chapter table (Hernand = Prologue-6, with cameo appearances later) rather than `crimsondesert.app`'s claimed "Chapters 1-3," because the internal document is built from multiple higher-preference sources (GameRant, Game8 per-chapter pages, Vulkk) and is more detailed and self-consistent than the single unverified aggregator page.

### Not attempted
- No official Pearl Abyss page (crimsondesert.pearlabyss.com) was found with world/region lore content via search — the domain only surfaced in searches as a platform-store listing, not a region-guide page. If the official site has a "World" or "Regions" section, it was not located within this task's search budget.
- Individual settlement pages were not fetched for most of the 21 villages (per the task's own budget guidance to prioritize castles/cities); their region and one or two facts came from WebSearch snippets over a territory-database site rather than a directly-read wiki article. A future pass with a working fandom.com/thegameswiki.com fetch path could add named NPCs and services for these.

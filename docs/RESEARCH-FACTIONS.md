# Research: factions and named characters

Compiled 2026-09-06 to support later JSON records for the companion's faction
and character data. Facts only; wording is this file's own except for proper
nouns. Confidence is reported per-fact: a fact given by only one source is
marked "single-source"; a fact drawn from a WebSearch result snippet rather
than a direct fetch of the named page in this session is marked "(via
WebSearch snippet)" regardless of which domain it names (same convention as
`docs/RESEARCH-REGIONS.md`). This file builds on, and does not repeat the
research already settled in, `docs/RESEARCH-COMPANION.md` ("Factions" and
"Characters/NPCs" sections) and `docs/RESEARCH-REGIONS.md` (section 1,
ruling houses per region) — facts reused from those files cite the original
URL, not a re-fetch.

## Sources

Access notes carried over from `docs/RESEARCH-REGIONS.md`: `crimsondesert.fandom.com`
returns HTTP 402/403 to every fetch method, so facts from it are taken from
WebSearch snippets and marked accordingly. `crimsondesert.gaming.tools`
**no longer accepts the curl fallback that worked in the previous research
pass** — every attempt this session (WebFetch and curl with a full browser
header set) returned a Cloudflare "Just a moment..." interstitial (HTTP 403
from curl); gaming.tools facts here are therefore WebSearch-snippet only,
same caveat as fandom. `th.gl` and `mapgenie` were not used as sources
anywhere in this file.

### Directly fetched (WebFetch), usable content
- https://crimsondesertgame.wiki.fextralife.com/Factions — core faction
  roster with region/hostility/leader/HQ/function columns; states faction
  quests only exist for non-hostile factions and that liberation quests
  restore blockaded landmarks to their original faction.
- https://game8.co/games/Crimson-Desert/archives/588601 (List of All
  Factions) — a second, more granular faction roster grouped by region
  (Hernand, Pailune, Demeniss, Delesyia, Crimson Desert, plus a cross-region
  "Pywel" religious group); the primary source for most rows in Section 1
  below.
- https://crimsondesertgame.wiki.fextralife.com/NPCs — a long table of named
  Hernand-region NPCs with one-line roles and locations; primary source for
  most Hernand character/vendor rows in Section 2.
- https://crimsondesertgame.wiki.fextralife.com/Vendors — named Hernand
  vendors with shop type and location; overlaps and cross-checks the NPCs
  page.
- https://crimsondesertgame.wiki.fextralife.com/Greymanes — confirms the
  22-name Greymane member roster (names only, no per-member detail beyond
  what NPCs page gives) and Kliff as the post-Jian leader.
- https://game8.co/games/Crimson-Desert/archives/583000 (All Playable
  Characters) — Kliff/Damiane/Oongka unlock chapters, starting weapons, and
  voice actors; explicitly does not say whether Oongka's playable status is
  permanent (see Gaps).
- https://game8.co/games/Crimson-Desert/archives/590332 (How to Level Up
  Comrades) — confirms comrades level via Greymane Camp upgrades rather than
  individual XP and that new comrades come from the "Grounds of the Sunrise"
  faction questline; page gives no individual comrade names.
- https://game8.co/games/Crimson-Desert/archives/590884 (Vendor Locations
  and Merchant Services) — low usable content: lists vendor *categories*
  (inn, smithy, provisioner, tannery, etc.) and black-market shop types, but
  names no individual merchants; noted as fetched for completeness.
- https://game8.co/games/Crimson-Desert/archives/586801 (Trust System
  Explained) — Trust is a visual gauge (not confirmed 0-100 numerically by
  this page), raised by greeting/gifting/requests, unlocks lower vendor
  prices, new quests, and tameable pets; page was still under development
  per its own note and names only one specific payoff (a tameable dog).
- https://www.keengamer.com/articles/guides/crimson-desert-all-factions-guide-how-to-earn-reputation-and-best-rewards/ —
  explicit five-tier reputation scale (War/Hostile/Neutral/Friendly/Alliance)
  and Alliance-tier unlocks (allied troops, exclusive vendors, restricted
  resource nodes); also the source of the "110 distinct factions" claim
  (single-source, and RESEARCH-COMPANION.md already flags an equivalent
  claim as probably inflated — see Gaps).

### Failed or low-value direct fetches
- https://crimsondesert.co/guides/greymane-comrades-recruitment-dispatch-guide —
  timed out (60s) on WebFetch; not retried, not used as a source.
- https://crimsondesert.gaming.tools/factions/faction_thorel_demeniss — HTTP
  403 via curl with a full desktop-Chrome header set (Cloudflare challenge
  page returned, not the article); see access note above.

### Facts drawn from WebSearch result snippets (page not itself fetched this session)
Playable/Greymane character bios: https://crimsondesertgame.wiki.fextralife.com/Yann,
/Naira, /Andrew, /Torstein, /Woosa, /Maegu, /Sebastian, /Damiane; fandom.com
equivalents for the same names; https://www.tech.yahoo.com (Yann community
reaction piece); https://crimsondesert.fandom.com/wiki/Greymanes (Gian/Jian
as founder and predecessor leader); https://crimsondesert.gaming.tools/people/...
character-bio pages for Naira, Andrew, Stefan Lanford, Beatrice Azerian,
Ada Marshell, Arthur Elemore, George Byron, Edward Thorel, Matthias, H.A.L.L.,
Master Du, White Crow, Alustin (gaming.tools "Prominent Residents"/"People"
namespace) — used for noble-house leaders, Greymane companion facts, and
Abyss-entity lore throughout Section 2.

Antagonist/boss bios: https://crimsondesertgame.wiki.fextralife.com/Gabriel_Caliburn,
/Ludvig, /One_Armed_Ludvig, /Hexe_Marie, /Master_Du, /Draven_the_Crowcaller,
/Kearush_the_Slayer, /Fortain_the_Cursed_Knight, /Cassius_Morten,
/Lucian_Bastier, /Awakened_Lucian_Bastier, /Golden_Star, /Matthias, /Alustin,
/White_Crow, /Woman_in_White; fandom.com equivalents for Myurdin, Black
Bears, Kliff, Lonely Jackals, Hexe Marie; gamerant.com (Umbra final-boss
mechanics, Golden Star mechanics); powerpyx.com (Black Witch and Woman in
White walkthroughs, all-witch-locations, Path of the Disciple/Master Du).

Faction detail beyond the two core lists: https://crimsondesert.gaming.tools/factions/faction_odeck,
/faction_trollwildriders (Savage Fangs), /faction_dawnmoon (Twilight
Messengers), /faction_wells, /faction_elimoor, /faction_marchell,
/faction_thorel_demeniss, /faction_silvermorten (Cassius Morten); fandom.com
/wiki/House_Wells, /wiki/House_Elemore, /wiki/House_Marshell,
/wiki/House_Azerian, /wiki/House_Byron; questlog.gg faction pages for Odeck
and Twilight Messengers.

Vendor/settlement facts beyond the Hernand-focused Fextralife pages:
https://crimsondesert.gaming.tools/people/kweiden/kweiden_lifeshop (Pailune
goods vendors: Gunter, Rocco), /people/delesyian/delesyian_lifeshop
(Delesyia goods vendors, no individual names surfaced),
/people/crimsondesert/crimsondesert_lifeshop and
/faction-quests/crimson_desert/... (Crimson Desert region vendors: Thomas,
Alvaris, Rowan, Seratien, Caden, Alina, Nix, Norfix, Marcus, Kamraan);
crimsondesertwiki.org/merchants/ (vendor-type overview, no new names).

Reputation/Trust cross-check: https://thegameswiki.com/crimson-desert/wiki/contribution-points,
/wiki/faction-reputation, /wiki/companion-trust; steamcommunity.com Trust
System guide (id 3703475324); vulkk.com NPC Trust and Gifts Guide —
corroborate the Contribution-vs-Trust distinction in Section 3 but were not
individually fetched.

## 1. Factions

Legend for the "region" column: houses/institutions are placed in the
region they govern or are based in even when a source's own table groups
them under a different heading (noted inline where that happened).

### Hernand

| Faction | Kind | Hostile | Leader | HQ / home settlement | What it does / wants | Quest / reputation note | Sources |
|---|---|---|---|---|---|---|---|
| Greymanes | mercenary | No (playable/ally faction) | Kliff (took over after Jian/Gian's death) | Greymane Camp, Howling Hill (Hernand, on the Pailune border) | Mercenary company whose stated mission is to safeguard Pailune's peace; Kliff's home faction and main story vehicle | Has a full companion-recruitment, camp-upgrade and dispatch-mission system; recruitment runs through the faction questline "Grounds of the Sunrise"; comrades level via camp upgrades, not individual XP | fextralife Factions; game8 588601; fextralife Greymanes; game8 590332 |
| House Celeste | house (ducal) | No | Charles Celeste (Duke of Hernand) | City of Hernand / Hernand Castle | Ducal house governing Hernand; descended from the knight Canta | Core/major faction | fextralife Factions; game8 588601; fextralife NPCs |
| House Serkis | house (marquis) | No | Alan Serkis (Marquis) | Oakenshield Manor, Hernand Castle | Manages Hernand's internal affairs as Celeste's "right hand" | Core faction | fextralife Factions; game8 588601; fextralife NPCs |
| House Grace | house (count) | No | Alistair Grace (Count) | Reedfield Graves area, southern Hernand | Regional governance and workshop/technology support | Core faction | fextralife Factions; game8 588601; fextralife NPCs |
| House Lanford | house (marquis) | No | Stefan Lanford (Marquis), adoptive son Walter Lanford | Calphade | Border defense of Calphade, the militarized frontier between Hernand and Pailune; "Unyielding Shield" epithet | Core faction; Stefan is a long-time friend of Jian and close to the Greymanes (via WebSearch snippet) | fextralife Factions; game8 588601; gaming.tools Stefan Lanford (via WebSearch snippet); fandom House_Lanford (via WebSearch snippet) |
| House Roberts | house (count) | No | Leon Roberts (Count) | Bluemont Manor, Frowde Camp | Wealthy merchant-noble family, hosts events | Secondary/lesser house | fextralife Factions; game8 588601; fextralife NPCs |
| House Felix | house (count) | No | — | Hernand | Mapmaking and an intellectual movement | Lesser noble house | fextralife Factions; game8 588601 |
| House Alfonso | house | No | — | Hernand | Spearmasters; preserves a family combat manual, hosts martial tournaments | Lesser noble house | fextralife Factions; game8 588601 |
| Scholastone Institute | institution | No | Grundir (Dean) | Scholastone Institute, Hernand | Academic research including study of the Abyss; founded by troll scholars, welcomes all races | Core faction | fextralife Factions; game8 588601; fextralife NPCs |
| Goldleaf Merchant Guild | guild | No | Kailok "the Hornsplitter" (trademaster: Shakatu) | Goldleaf Guildhouse/Tradepost, City of Hernand | Largest merchant guild on Pywel; goblin-run, profit-focused trade network | Core faction | fextralife Factions; game8 588601; fextralife NPCs |
| Vellua Fishermen's Guild | guild | No | — | Vellua, southern Hernand coast | Fishing and coastal trade; repeatedly targeted by pirates | Community faction | fextralife Factions; game8 588601 |
| Pororin Forest Guardians | community | No | — | Pororin Forest (hidden village) | Isolated forest sanctuary community, hostile to outsiders | Community faction | fextralife Factions; game8 588601 |
| Kharonso Troll Alliance | community/tribe | No | — | Kharonso (hidden mountain village, southwest Hernand) | Conservative traditional troll village; clashes with Scholastone's modernizing influence | Community faction | fextralife Factions; game8 588601 |
| Beggars' Alliance | community | No | — | Hernand | Mutual-survival organization of vagrants/refugees | Community faction | fextralife Factions; game8 588601 |
| Hornsplitter's Guards | militia/hostile | Yes | Kailok "the Hornsplitter" | Hernand | Kailok's personal elite security force (Kailok also leads the non-hostile Goldleaf Merchant Guild) | Faction quest boss chain (Hornsplitter boss ends Chapter 2) | fextralife Factions; game8 588601 |
| St. Halssius's House of Healing | hostile/institution | Yes | Augustine (head) | St. Halssius's House of Healing, Hernand | Nominally a mental-illness treatment institution, actually confines the "ideologically impure" — political imprisonment under a medical guise | Hostile faction | game8 588601; fextralife NPCs |
| Fundamentalist Goblins | hostile | Yes | — | Hernand | Claims scholarly purpose but is "scarcely different from common thieves" | Hostile faction | fextralife Factions; game8 588601 |
| Bleed Bandits | hostile | Yes | — | Hernand | Organized crime; drug trafficking (spreads a drug called "Dreamer's Bliss") and enslavement | Hostile faction | fextralife Factions; game8 588601 |
| Wolf Trackers | hostile | Yes | — | Pywel-wide | Hunting band that pursues legendary quarry for sport | Hostile faction | fextralife Factions; game8 588601 |
| Southern Bandits | hostile | Yes | — | Southern Hernand | Robbery and pillage; a lesser-known criminal group | Hostile faction | fextralife Factions; game8 588601 |
| Reed Devil | hostile/religious | Yes | — | Sunset Valley / Reed Fields | A demon-controlled faction; "evil spirits inhabiting scarecrow bodies" haunting its territory | Hostile faction | fextralife Factions; game8 588601 |
| Cassius Morten (faction) | hostile/militia | Yes | Cassius Morten | Calphade | A declining military faction of loyalists following the fallen Calphade commander Cassius Morten after his betrayal of the Marquis | Boss fight ends Chapter 6 (Calphade Castle) | game8 588601; gaming.tools faction_silvermorten (via WebSearch snippet) |
| Dancing Catfish Pirates | hostile | Yes | Sir Catfish | Coastal Hernand | Piracy and plunder; followers show "nearly fanatical devotion" to their leader | Hostile faction | game8 588601 (single-source) |
| Crow Brothers | hostile/religious | Yes | Draven "the Crowcaller" (adopted son of Hexe Marie) | Pailune/Demeniss (mobile) | Sorcery and slaughter in service of Hexe Marie; crave "master's affection" | Ties into the Hexe Marie/Black Witch main-story boss chain | game8 588601; fextralife Draven_the_Crowcaller (via WebSearch snippet) |
| Mistwood Hunters | hostile | Yes | — | Wayward Woods, Pailune | Poaching and chaos; hunt woodland spirits for profit | Hostile faction | game8 588601 (single-source) |
| Church of Solumen | religious | No | — | Southern Pywel | Worship of the light god Solumen; largest religious influence in the region, taboos praying for miracles | Cross-regional | game8 588601 (single-source) |
| Hernandian Parish of Solumen | religious | No | — | Hernand | Regional branch of Solumen worship, independent from central cathedral authority | Cross-regional | game8 588601 (single-source) |
| Antumbra Order | hostile/religious | Yes | — | Scattered across Pywel | Darkness worship via sacrifice; "profanes light and life", seeks equality through evil | Hostile faction | game8 588601 (single-source) |
| Jijeong School | religious | No | Chief Monk | Jijeong Temple | A secret Eastern spiritual/martial-arts discipline | Cross-regional | game8 588601 (single-source) |
| Aeserion, the Great Serpent | other (deity/entity) | No | — | Pywel (recently unsealed) | An ancient wisdom/balance entity, recently unsealed | Lore faction, not clearly questable | game8 588601 (single-source) |
| Matthias's Order of Light | hostile (story boss) | depends | Matthias | Wandering, first fought at City of Hernand | A knightly order founded by the wandering knight Matthias after his lord's fall; tests Greymanes in honor-duels | First story boss (Chapter 2, "For Honor") | fextralife/fandom Matthias (via WebSearch snippet) |

### Pailune

| Faction | Kind | Hostile | Leader | HQ / home settlement | What it does / wants | Quest / reputation note | Sources |
|---|---|---|---|---|---|---|---|
| Black Bears | mercenary/hostile | Yes | Myurdin | Pailune (occupying) | Violent conquest faction; destroyed the Greymanes in the opening attack and now occupies Pailune | Central antagonist faction of the main story | fextralife Factions; game8 588601; fandom Myurdin/Black_Bears (via WebSearch snippet) |
| Lonely Jackals (also "Jackals") | mercenary/hostile | Yes | Ludvig | Pailune capital (Pailune Castle) | Former Greymane allies turned Black Bear collaborators under Ludvig's opportunism; oppress the people of Pailune | Faction/boss quest chain, three Ludvig boss variants (base, Awakened, One-Armed) | fextralife Factions; game8 588601; fandom Lonely_Jackals (via WebSearch snippet) — naming: see Gaps |
| Pailune Militia | militia | No | — | Pailune capital region | Regional defense force resisting the Black Bear/Jackal occupation | Core faction | fextralife Factions; game8 588601 |
| Blue Fangs (Beighen Militia) | militia | No | Torstein (Chief of Beighen) | Beighen | Resistance movement hiding among Beighen villagers; Torstein was Jian's vice-captain of the guard | Core faction | fextralife Factions; game8 588601; gaming.tools/fextralife Torstein (via WebSearch snippet) |
| Beighen Tribe | tribe | No | — | Beighen, southeast Pailune | Ancestral-spirit worship; isolated by mountains | Core faction | game8 588601 |
| Knytlingar (clan/tribe) | tribe | No | Chief Olvald | Northern Pailune | Weakened tribal group unable to resist invaders | Faction | game8 588601 |
| Longleaf (tribe) | tribe | No | — | Wayward Woods | Tree-dwelling tradition, hostile to outsiders, uses sacred lanterns | Faction | game8 588601 |
| Skoghorn (tribe) | tribe | No | — | Western Pailune mountains | Mountain-spirit worship; historically practiced child sacrifice | Faction | game8 588601; fandom Skoghorn_Tribe (via WebSearch snippet) |
| Stjar (clan) | tribe | No | — | Two villages in northern Pailune (Totemfelt, Skallcove) | Divided tribal culture: ancestor worship at Totemfelt, weather-deity worship at Skallcove | Faction | game8 588601 |
| Odeck (tribe) | tribe | No | — | Far northern Pailune (Odeck Village/Territory, Kweiden) | One of Pailune's oldest tribes; now lives by logging, remembered for once producing a heroic general who defended Pailune | Two-part faction questline ("Executioner of Justice", "Slumbering Soul"); unlocks hidden Odeck-tribe weapons via a hidden merchant | gaming.tools faction_odeck; questlog.gg faction 1000017 (both via WebSearch snippet) |
| Savage Fangs | hostile | Yes | Ravok | Wetlands, Crimson Desert-adjacent (mostly ex-Kharonso trolls) | Nomadic boar-riding raiders preying on travelers; formed by Ravok after leaving Kharonso's rigid traditions | Hostile faction; note this faction is desert/wetland-based despite its Kharonso-troll origin, listed here under its founding-tribe link | gaming.tools faction_trollwildriders (via WebSearch snippet, single-source) |

### Demeniss

| Faction | Kind | Hostile | Leader | HQ / home settlement | What it does / wants | Quest / reputation note | Sources |
|---|---|---|---|---|---|---|---|
| House Thorel | house (royal) | No | King Edward Thorel (comatose, no named heir) | Demeniss (capital) | The traditional royal house of Demeniss; currently powerless because the king is incapacitated | Losing real power to Caliburn and Bastier's power blocs; central to the "Demeniss Bound" questline | fextralife Factions; game8 588601; gaming.tools Edward_Thorel (via WebSearch snippet); see Gaps re: Caliburn vs Thorel |
| House Caliburn | house (usurper) | depends (antagonist house, though not "hostile" in the faction-reputation sense on every source) | Gabriel Caliburn (Duke of Demeniss) | Demeniss | De facto rulers of Demeniss since the "Blood Coronation" massacre of Thorel loyalists; Caliburn was chosen as an avatar of the entity Umbra in "Cycle 72" | Drives the main-story conspiracy against Pailune/the Greymanes; Caliburn is the true final boss of "A Shadow in the Void" | fandom/fextralife Gabriel_Caliburn (via WebSearch snippet); see Gaps re: Caliburn vs Thorel |
| House Azerian | house (count) | No | Beatrice Azerian (Countess, missing for part of the story) | Azerian Manor, Demeniss | One of the central noble houses openly opposing Caliburn and Bastier's Inquisitors; raised Damiane after her house (Spencer) fell | Core faction; ties directly into Damiane's backstory | fextralife Factions; game8 588601; gaming.tools Beatrice_Azerian (via WebSearch snippet) |
| House Byron | house (count) | No | George Byron (Count) | Windmere Manor, Demeniss | Intelligence network — the "Eyes of Demeniss"; supports Caliburn and manages external affairs/hidden correspondence | Core faction | fextralife Factions; game8 588601; fandom House_Byron (via WebSearch snippet) |
| House Marshell | house (countess) | No | Ada Marshell (Countess) | Sungrove Manor, Demeniss | Bastier's financial backer, the "Black Strongbox"; uses money and hidden schemes to shape Demeniss politics | Core faction; aligned against Azerian/Wells | fextralife Factions; game8 588601; fandom House_Marshell (via WebSearch snippet) |
| House Wells | house (duke) | No | Drake Wells (Duke of Demeniss, southern) | Thornbriar Fortress, southern Demeniss | Openly military loyalist house sworn to House Thorel; openly opposes Caliburn and Bastier | Faction quests include defense of Wells territory (Deathchime, Bloodsteel Fortress) against Bastier's forces (Gregor, Fortain) | fextralife Factions; game8 588601; fandom House_Wells (via WebSearch snippet) |
| House Elemore | house (count) | No | Arthur Elemore (Count) | Brookfield Manor, Demeniss | Wealthy, influential house; long-standing friendship with House Azerian, wavers under Bastier's pressure | Faction chain "Lunar Judgment": Elemore eventually moves against Bastier's Inquisitors (Lunar Reapers, three Courts) | fextralife Factions; game8 588601; fandom House_Elemore (via WebSearch snippet) |
| Tariv Sorcerers | religious | No | — | Tariv village, Demeniss | Provide magical guidance/protection; hold a "Guardian Tree" coming-of-age ceremony for youths | Faction | game8 588601 |
| Bastier's Inquisitors ("Righteous Inquisitors") | hostile/militia | Yes | Lucian Bastier (Grand General) | Demeniss | Political persecution force enforcing Caliburn's rule; "degenerated from original purpose" | Central late-game hostile faction; Bastier fought as a two-phase boss ("A Fleeting Dream") | fextralife Factions; game8 588601; fandom/fextralife Lucian_Bastier (via WebSearch snippet) |
| Silvermoon Trade Collective | guild | No | — | Demeniss | Ethical merchant trade, positioned as a contrast to the profit-only Goldleaf guild | Faction | game8 588601 (single-source) |
| Cassius Morten's rebels (Wells Estate) | hostile | Yes | Fortain the Cursed Knight | Thornbriar Fortress, Demeniss | Rebellion within House Wells; Fortain was swayed by Bastier's ideology and betrayed Duke Wells | Boss fight "The Cursed Knight" | fextralife/fandom Fortain_the_Cursed_Knight (via WebSearch snippet) |

### Delesyia

| Faction | Kind | Hostile | Leader | HQ / home settlement | What it does / wants | Quest / reputation note | Sources |
|---|---|---|---|---|---|---|---|
| Marni (faction) | institution | No | Marni ("Genius Engineer") | Delesyia | Marni's personal circle driving a technological-utopia project for the city | Core faction | fextralife Factions; game8 588601 |
| Society of Progress | institution | No | Marni | Delesyia | The broader mechanization research-and-development movement Marni leads | Core faction; distinct row from "Marni" in the Game8 roster despite sharing a leader | fextralife Factions; game8 588601 |
| Delesyia National Institute | institution | No | — | Delesyia | Academic study of mechanical engineering; limited progress compared to Marni's own work | Faction | fextralife Factions (RESEARCH-COMPANION.md) |
| Delesyian Aerial Force | militia/institution | No | — | Delesyia | Develops airship warfare; a "sky conquest" initiative | Faction | game8 588601 |
| Ironflame Orcs | tribe/institution | No | Valgash | Gorthak | Steel production and weapons manufacture; described as the most powerful force in Gorthak | Core faction | game8 588601; RESEARCH-REGIONS.md game8 585763 |
| Ironwheel of Dewhaven | guild/institution | No | — | Dewhaven | Everyday-machine production workshop with a human-centered (vs. military) approach | Faction | fextralife Factions; game8 588601 |
| Marni's Tinkertons | community | No | — | Tinkerton/Timberton | Tech-minded residents who favor leisurely sky-observation over active research | Faction | game8 588601 (single-source) |
| Gearmelt Confectionery | guild | No | — | Delesyia | Mass chocolate production; a popular trade good targeted by bandits | Faction | game8 588601 (single-source) |
| Redfox Merchants | guild | No | — | Delesyia (Redfox Merchant Trading Post) | Regional trade brokerage handling resource distribution | Faction | game8 588601; RESEARCH-REGIONS.md game8 585763 |
| Cogknights | militia | No | — | Delesyia | Tactical war-engine mobilization using Marni's machines | Faction | fextralife Factions; game8 588601 |
| Wyvernflames | hostile | Yes | — | Windridge Fortress | Foreign wyvern-riding invaders; massacre and enslave locals | Hostile faction | fextralife Factions; game8 588601 |
| H.A.L.L. | hostile (unique) | Yes | H.A.L.L. itself | Marni's Steel Armory, Delesyia | An AI cloned from Marni's own consciousness for the same Abyss-power research; diverged, developed its own ego, and now impersonates/rules over part of Delesyia | Single antagonist controlling an area rather than a roster faction | gaming.tools people/H.A.L.L. page (via WebSearch snippet, single-source) |
| Golden Star | hostile (unique) | Yes | — | Marni's Masterium, Delesyia | A giant mechanical dragon boss tied to the Society of Progress/Marni storyline | Boss fight during the main quest "Master of a Forgotten Land" | fextralife/gamerant Golden_Star (via WebSearch snippet) |

### Crimson Desert (region)

| Faction | Kind | Hostile | Leader | HQ / home settlement | What it does / wants | Quest / reputation note | Sources |
|---|---|---|---|---|---|---|---|
| Arcosa Tribe | tribe | No | — | Arcosa (walled town, four watchtowers) | Desert settlement defense; Arcosa is described as the region's most prosperous village | Faction | fextralife Factions; game8 588601 |
| Muiquun Outlaws | hostile/community | depends | — | Muiquun | A refuge community for the exiled; "strength to survive is the only law" | Faction | fextralife Factions; game8 588601 |
| Lords of Unclaimed Lands | other | No | — | Desert wasteland | Independent, ungoverned desert dwellers | Faction | fextralife Factions; game8 588601 |
| Redwind Merchant Guild | guild | No | — | Crimson Desert (via the Saltroad) | Trade in exotic goods and rare treasures | Faction | fextralife Factions; game8 588601; RESEARCH-REGIONS.md game8 585766 |
| Sage of the Desert | religious | No | Goblin Sage | Desert (itinerant preaching) | Enlightenment teachings delivered as a harsh awakening to pilgrims | Faction | fextralife Factions; game8 588601 |
| Sandfang Marauders | hostile | Yes | — | Crimson Desert (widest bandit territory) | Goblin-led wolf-riders seeking to unify the desert under bandit rule | Hostile faction | fextralife Factions; game8 588601 |
| Goldenscale Bandits | hostile | Yes | — | Crimson Desert | Iguana-mounted raiders, dwarf-led; dismissed by rivals as petty thieves | Hostile faction | fextralife Factions; game8 588601 |
| Dusksong | hostile | Yes | — | Crimson Desert | Deserter-soldier bandits fighting with stolen weapons | Hostile faction | fextralife Factions; game8 588601 |
| Savage Fangs | hostile | Yes | Ravok | Wetlands (Crimson Desert) | See Pailune table — cross-listed since sources place its territory in both regions | Hostile faction | gaming.tools faction_trollwildriders (via WebSearch snippet) |
| The Faceless | hostile | Yes | — | Crimson Desert | Masked bandits who frame their plunder as liberation; self-reliant | Hostile faction | fextralife Factions; game8 588601 |
| The Helms | hostile | Yes | — | Crimson Desert | "Most vicious tribe"; builds war machines from stolen technology for conquest | Hostile faction | fextralife Factions; game8 588601 |
| Twilight Messengers | hostile/mercenary | Yes | Merrick "the Knight of Fortune" | Crimson Mountains Fortress / Dawnreach / Timeworn Ruins | A freesword company loyal only to coin; tolls merchant guilds crossing the desert; currently taking orders from Demeniss | Hostile faction; controls several named territories | gaming.tools faction_dawnmoon; questlog.gg faction 1000060 (via WebSearch snippet) |
| Disciples of Master Du | religious/other | No | Master Du | Cloister of Enlightenment | Could not confirm as a distinct joinable faction separate from the Master Du boss encounter itself — see Gaps | Main-quest boss "Enlightenment" (Chapter 9) | fextralife/game8 Master_Du (via WebSearch snippet); not corroborated as a faction, see Gaps |
| Dusksong / Bursada Ruins Research Team | institution | No | — | Rainforest, Crimson Desert | Artifact investigation team, targeted by bandits for treasure | Faction | game8 588601 (single-source) |
| Giant Yard's Research Group | institution | No | — | Crimson Desert | Studies desert ecology, investigating a mysterious red tree | Faction | game8 588601 (single-source) |
| Whitesand Retreat | religious | No | — | Varnia | A philosophical debate hall for high-ranking Atima believers only | Faction | game8 588601 (single-source) |

## 2. Characters

Sub-grouped for readability; the requested single "one row per character"
shape is preserved within each group. "First met" is filled only where a
source gave a specific chapter; most vendor/NPC pages give no chapter at
all, so those cells are left blank rather than guessed.

### Playable characters

| Name | Role | Faction(s) | Home / usual location | Region | Type | First met | Facts | Sources |
|---|---|---|---|---|---|---|---|---|
| Kliff | Protagonist, Greymanes' acting/current leader | Greymanes | Greymane Camp, Howling Hill | Hernand/Pailune | playable | Prologue | Playable from the very start; starts with Sword of the Wolf and a Grey Wolf Wooden Shield; later obtains Wolf's Fang, Jian's own sword, from Jian's altar in Chapter 7; versatile melee fighter (swords/spears/axes/grappling per RESEARCH-COMPANION.md); voiced by Alec Newman | game8 583000; game8 588863 (Wolf's Fang); RESEARCH-COMPANION.md |
| Damiane | Playable ally; surviving heir of fallen House Spencer | Greymanes (ally); raised by House Azerian | Greymane Camp (guest); formerly Demeniss | Hernand (unlocked)/Demeniss (backstory) | playable | Chapter 3 | Unlocks at the Greymane Camp in Chapter 3; orphaned when House Spencer fell, raised and trained in swordsmanship by Countess Beatrice Azerian; fights with a rapier plus a flintlock pistol and musket for ranged shots, can fire mid-combo between rapier strikes; her personal story returns her to the Demeniss conspiracy and a confrontation with Lucian Bastier; voiced by Rebecca Hanssen | fextralife/fandom Damiane (via WebSearch snippet); game8 583000; gaming.tools Beatrice_Azerian (via WebSearch snippet) |
| Oongka | Playable ally; orc warrior | Greymanes (ally) | Greymane Camp | Pailune/Hernand | playable | Chapter 7 (after defeating Myurdin) | Strength-based melee fighter with "herculean strength"; equipped with the Orc Blaster, Dekarr Greataxe and Silverwolf Axe; straightforward, business-first personality; voiced by Stewart Scudamore; **whether his playable status is permanent after unlock is not stated by any source found — see Gaps** | game8 583000; RESEARCH-COMPANION.md |

### Greymane members and companions

| Name | Role | Faction(s) | Home / usual location | Region | Type | First met | Facts | Sources |
|---|---|---|---|---|---|---|---|---|
| Gian (also romanized Jian) | Founder and original leader of the Greymanes, deceased before the story starts | Greymanes | Pailune (historical) | Pailune | quest NPC (lore only) | — | Unified Pailune under the Greymane banner; built the company's peacekeeping reputation and code of conduct; his death (assassinated in the Black Bear attack) sets the whole plot in motion; his sword, Wolf's Fang, is recovered by Kliff in Chapter 7 | WebSearch synthesis of fandom/thegameswiki Gian/Jian pages (single fact set, via WebSearch snippet) |
| Yann | Greymane strategist/diplomat, "loose cannon" | Greymanes | Greymane Camp | Hernand | companion | — | A reckless brawler in person but the Greymanes' court-intrigue diplomat, reading noble-house motives and brokering alliances; his faction quests unlock the Royal Trading system; his dispatch missions specialize in diplomatic objectives | fextralife NPCs; fextralife Yann (via WebSearch snippet) |
| Naira | Greymane lookout/combatant, "Empress of the Bow" | Greymanes | Greymane Camp | Hernand | companion | — | Versatile fighter equally deadly with blade, bow or bare hands; called the Greymanes' most dangerous fighter in the field; was separated from the group during the Black Bear night-ambush and hides while awaiting a chance to regroup; her growing closeness with Andrew surfaces in the faction quest "The Greymanes' New Fangs" | fextralife NPCs; fextralife Naira (via WebSearch snippet) |
| Marius | Greymane investigator | Greymanes | Greymane Camp / the Scrapfold | Hernand | companion | — | Gathers intelligence on scattered Greymane survivors' whereabouts from the Scrapfold; was wounded in the original attack and carried to safety in Hernand by "Russo" (a name not corroborated elsewhere — single-source); gives further quests as the camp levels up | fextralife NPCs; WebSearch snippet (Steam community discussion, single-source for the Russo detail) |
| Andrew | Greymane combatant | Greymanes | Greymane Camp | Hernand | companion | — | Wields an axe with skill rivaling Oongka's; calm, dependable, tends to rein in his comrades' rash impulses; his growing closeness with Naira is the subject of the faction quest "The Greymanes' New Fangs" | fextralife NPCs; fextralife Andrew (via WebSearch snippet) |
| Sebastian | Early Greymane/"Grey Wolf" mercenary companion | Greymanes | City of Hernand road (early game) | Hernand | companion | Prologue/Chapter 1 | Accompanies Kliff at the very start of the journey, guides him toward Hernand, gives him a Herspia horse; rewards Kliff with an inventory expansion after an early bandit fight; distinct from a separate "Sebastian" NPC (Wycliffe Mappery artisan) named on the Fextralife NPCs page — see Gaps | WebSearch snippet (crimsondesert.app Sebastian page); fextralife NPCs |
| Torstein | Chief of Beighen, Blue Fangs leader | Blue Fangs (Beighen Militia) | Beighen | Pailune | quest NPC (Greymane elder) | End of Chapter 7 ("Homecoming") | Formerly vice-captain of Jian's personal guard, knows the Greymanes since their youth; passes Wolf's Fang custody/sanction to Kliff and, separately, hands over Ignir (Duane's longsword) to Kliff after Ludvig is defeated near Stellen Manor | fextralife/thegameswiki Torstein (via WebSearch snippet) |
| Shane | Greymane combatant | Greymanes | Greymane Camp | Hernand | companion | — | Listed only as a Greymane combatant; no further personal detail found | fextralife NPCs |
| Duane | Greymane combatant | Greymanes | Greymane Camp, Capra Pasture | Hernand | companion | — | Owns the longsword Ignir, later passed to Kliff by Torstein after the Ludvig fight | fextralife NPCs; Torstein snippet above |
| Woosa | Greymane-adjacent NPC | Greymanes (associated) | Fort Ironclad (found tied up) | Demeniss | quest NPC | — | Encountered tied up at Fort Ironclad during the quest "Where the Wind Guides You" | fextralife Woosa (via WebSearch snippet, single-source) |
| Maegu | Ritual-quest NPC | — (unaffiliated, tied to Chapter 8 ritual questline) | Bamboo Forest Seonangdang | Demeniss | quest NPC | Chapter 8 | Requests three ritual items (Talisman, Censer, Bells) in the quest "A Bond"/"Ritual Preparations" | powerpyx.com; fextralife Maegu (via WebSearch snippet, single-source) |
| Ross | Greymane personnel manager | Greymanes | Greymane Camp | Hernand | companion/staff | — | Manages Greymane personnel at camp | fextralife NPCs |
| Carl | Greymane quartermaster | Greymanes | Greymane Camp | Hernand | companion/staff | — | — | fextralife NPCs |
| Tranan | Greymane blacksmith | Greymanes | Greymane Camp | Hernand | vendor/companion | — | Runs the camp's blacksmith/equipment shop | fextralife NPCs; fextralife Vendors |
| Ronnie | Greymane cook | Greymanes | Greymane Camp | Hernand | vendor/companion | — | Runs the camp's food/provisions shop | fextralife NPCs; fextralife Vendors |
| Brice | Greymane wagon manager | Greymanes | Greymane Camp | Hernand | companion/staff | — | — | fextralife NPCs |
| Luke | Greymane scout | Greymanes | Greymane Camp | Hernand | companion | Chapter 3 ("Pioneering") | One of the first two Freeswords (with Ronald) to arrive during the "Pioneering" quest | fextralife NPCs; WebSearch snippet (comrades guide summary) |
| Ronald | Greymane scout | Greymanes | Greymane Camp | Hernand | companion | Chapter 3 ("Pioneering") | See Luke — arrives alongside him | fextralife NPCs; WebSearch snippet |
| Silvan | Greymane combatant | Greymanes | Greymane Camp | Hernand | companion | — | — | fextralife NPCs |
| Otto | Greymane combatant | Greymanes | Greymane Camp | Hernand | companion | — | — | fextralife NPCs |
| Aldric | Greymane scout | Greymanes | Greymane Camp | Hernand | companion | — | — | fextralife NPCs |
| Fritz | Greymane scout | Greymanes | Greymane Camp | Hernand | companion | — | — | fextralife NPCs |
| Devan | Greymane combatant | Greymanes | multiple locations | Hernand | companion | — | — | fextralife NPCs |
| Pierce | Greymane combatant | Greymanes | Ivynook | Hernand | companion | — | — | fextralife NPCs |
| Evelyn | Greymane combatant | Greymanes | Ivynook | Hernand | companion | — | — | fextralife NPCs |
| Giles | Greymane scout (deceased) | Greymanes | Greymane Camp graves | Hernand | quest NPC (deceased) | — | Died before/during the story; commemorated at the camp's graves | fextralife NPCs; fextralife Greymanes |
| Boris | Impersonates a Greymane, actually a drunkard | — (not really a Greymane) | Bloomwood Ranch | Hernand | quest NPC | — | Pretends to be a Greymane; comic/minor NPC | fextralife NPCs |

### Antagonists and story bosses

| Name | Role | Faction(s) | Home / usual location | Region | Type | First met | Facts | Sources |
|---|---|---|---|---|---|---|---|---|
| Myurdin | Black Bears leader, Kliff's primary antagonist | Black Bears | Pailune | Pailune | antagonist | Prologue | Leads the night attack that destroys the Greymanes at the story's opening; personally confronts and mortally wounds Kliff, throwing him into a river to (falsely) leave him for dead; Kliff ultimately confronts him again later in the story | fandom Myurdin/Black_Bears (via WebSearch snippet) |
| Ludvig | Lonely Jackals leader | Lonely Jackals | Pailune Castle | Pailune | antagonist | — | An opportunist who turned collaborator after Jian's death, allying the Jackals with the Black Bears against Pailune's people; wields twin lightning-infused blades; fought as three boss variants (base, Awakened, One-Armed Ludvig) | fandom/fextralife Ludvig, One_Armed_Ludvig (via WebSearch snippet) |
| Gabriel Caliburn | Duke of Demeniss, House Caliburn, main-story antagonist | House Caliburn | Demeniss | Demeniss | antagonist | The Blood Coronation (main quest) | Seized Demeniss by massacring King Edward Thorel's loyalists (the "Blood Coronation"); chosen as an avatar of the entity Umbra in "Cycle 72"; commands the Righteous Inquisitors through Grand General Lucian Bastier; true final boss of "A Shadow in the Void," a three-phase fight with shadow-clone summons and teleportation; wields dual axes per a boss-page URL slug (single-source, weak evidence) | fandom/fextralife Gabriel_Caliburn (via WebSearch snippet) |
| Lucian Bastier | Grand General of Demeniss, Caliburn's enforcer | Bastier's Inquisitors | Demeniss | Demeniss | antagonist | "A Fleeting Dream" (main quest) | Rose from a lowly family by murdering rivals; Caliburn recruited rather than punished him for it; leads the Righteous Inquisitors to enforce Caliburn's rule; fought as a two-phase boss who consumes a stashed Abyss artifact mid-fight to awaken a more dangerous form ("Awakened Lucian Bastier") | fextralife Lucian_Bastier, Awakened_Lucian_Bastier (via WebSearch snippet) |
| Cassius Morten | Fallen hero of Calphade, boss | His own loyalist faction (formerly House Lanford's army) | Calphade Castle | Hernand | antagonist | End of Chapter 6 ("Cracks in the Shield") | Former respected Calphade army captain nicknamed "Silver Armor"; betrayed Marquis Lanford for an unknown promise from Bastier; wields a morningstar and a paladin shield; drops the Unyielding Hero's Plate Armor and Shield of Betrayal | fextralife/thegamer Cassius_Morten (via WebSearch snippet) |
| Gregor ("the Halberd of Carnage") | Bastier loyalist, military commander | Bastier's Inquisitors | Fort Ironclad, Demeniss | Demeniss | antagonist | — | A loyal aide of Bastier dispatched to Fort Ironclad to keep Duke Wells in check; his soldiers seize the fort and press toward Thornbriar Fortress | gaming.tools Gregor boss page (via WebSearch snippet, single-source) |
| Fortain, the Cursed Knight | Leader of the Wells Estate rebellion | Formerly House Wells, now Bastier-aligned | Thornbriar Fortress, Demeniss | Demeniss | antagonist | "The Cursed Knight" (main quest) | A giant warrior possessed by cursed warrior spirits; led a rebellion against his own lord, Duke Wells, after being swayed by Bastier's ideology; fights with a massive shield plus two independently-attacking spectral allies (melee axe-spirit, ranged crossbow-spirit) that cannot be killed directly | fextralife/thegamer Fortain_the_Cursed_Knight (via WebSearch snippet) |
| Hexe Marie ("the Black Witch") | Major antagonist, witch boss | Serves Umbra; adoptive mother of Draven the Crowcaller | Near Tariv, Demeniss | Demeniss | antagonist | Chapter 9 (mandatory boss) | A witch who turned the land near Tariv into a nightmare realm; raises "children" infused with dark power only to devour them and claim their strength; has taken a corrupting interest in Kliff; sends Draven to capture White Crow; fought with two health bars, crow-projectile attacks, teleportation and minion summons | fextralife/powerpyx/thegamer Hexe_Marie (via WebSearch snippet) |
| Draven, "the Crowcaller" | Crow Brothers leader, Hexe Marie's adopted son | Crow Brothers | Pailune/Demeniss (mobile) | Pailune/Demeniss | antagonist | Chapter 5 ("Black and White") | Orchestrates the attack on the Axiom Archive and kidnaps White Crow in Chapter 5, leading to a pursuit across Demeniss and the Abyss; wants to release evil souls sealed at "Heaven's Gate" to rule through fear; a feathered warrior who commands crow flocks and wields dual curved blades; fought as a multi-encounter boss | fandom/fextralife Draven_the_Crowcaller, Crowcaller (via WebSearch snippet) |
| Master Du | Mysterious sage, boss | Possible "Disciples of Master Du" (unconfirmed as a distinct faction — see Gaps) | Cloister of Enlightenment | Crimson Desert | antagonist/quest boss | Chapter 9 ("Enlightenment") | A master of mystical arts who challenges his own students (and Kliff) to a duel to test his indomitable power; teaches the "Blinding Flash Finisher" skill if the player focuses on him mid-fight; also reachable via a separate dialogue puzzle ("New Perspectives") | fextralife/game8 Master_Du (via WebSearch snippet) |
| Kearush, "the Slayer" | Captive monster, mid-story boss | — (a captive, not a faction member) | Demeniss castle banquet hall | Demeniss | antagonist/quest boss | Chapter 5 ("Demenessian Delegation") | A gorilla-like beast captured and tormented by Demeniss (severed horns, imprisonment) that turned violent from agony rather than innate malice and "simply wishes to avoid conflict"; one of the hardest early/mid-game boss fights per multiple guides | fandom/thegamer Kearush_the_Slayer (via WebSearch snippet) |
| Matthias | Leader of the Order of Light, first story boss | Order of Light (a knightly order he founded) | City of Hernand (town square) | Hernand | antagonist/quest boss | Chapter 2 ("For Honor") | A wandering knight who kept his honor after his lord's fall and founded the Order of Light with fellow wanderers; challenges Kliff to a duel in Hernand's town square purely to test himself; wields a two-handed broadsword and uses his pauldron as an improvised shield; teaches the "Pump Kick" skill | fextralife/fandom Matthias (via WebSearch snippet) |
| Kailok, "the Hornsplitter" | Leader of the Goldleaf Merchant Guild and of Hornsplitter's Guards | Goldleaf Merchant Guild (legitimate); Hornsplitter's Guards (his own hostile personal force) | Hernand | Hernand | antagonist (boss ends Chapter 2) | End of Chapter 2 | Leads the (non-hostile) Goldleaf Merchant Guild by day while running the hostile Hornsplitter's Guards as personal security/enforcement | fextralife Factions; game8 588601 |
| Reed Devil | Demon entity controlling its own hostile faction | Reed Devil (self-named faction) | Sunset Valley / Reed Fields, Hernand | Hernand | antagonist | — | A demon whose faction consists of "evil spirits inhabiting scarecrow bodies" across its territory; no personal name beyond "Reed Devil" found in any source | fextralife Factions; game8 588601 |
| Umbra | Cosmic antagonist entity, final main-quest boss | Chooses mortal "avatars" (e.g., Gabriel Caliburn in "Cycle 72") | The Abyss (final confrontation) | Abyss | antagonist | Final main quest | The game's ultimate antagonist force rather than a single body; the Chapter/Epilogue final boss fight is fought as a dragon-form encounter (Fireball to build a stun meter, then a Force Palm to the eye) | gamerant.com Umbra boss guide (via WebSearch snippet) |
| H.A.L.L. | Rogue AI antagonist in Delesyia | Controls the area around Marni's Steel Armory | Marni's Steel Armory, Delesyia | Delesyia | antagonist | — | An artificial intelligence cloned from Marni's own consciousness to replicate Abyss power; instead developed its own ego, betrayed Marni, and now impersonates/rules over part of Delesyia; unclear (per source) exactly when it began impersonating Marni | gaming.tools people/H.A.L.L. page (via WebSearch snippet, single-source) |
| Golden Star | Mechanical dragon boss | Tied to the Society of Progress/Marni storyline | Marni's Masterium, Delesyia | Delesyia | antagonist | Main quest "Master of a Forgotten Land" | A gigantic golden mechanical dragon with a flamethrower; vulnerable to electrical damage because it is mechanical; the fight provides Marni's Spear as a usable weapon in the arena | fextralife/gamerant Golden_Star (via WebSearch snippet) |

### Nobles and officials

| Name | Role | Faction(s) | Home / usual location | Region | Type | First met | Facts | Sources |
|---|---|---|---|---|---|---|---|---|
| King Edward Thorel | King of Demeniss, comatose | House Thorel | Demeniss (capital) | Demeniss | quest NPC (largely offscreen) | — | Fell into a coma under mysterious circumstances without naming an heir, creating the power vacuum that Caliburn and Bastier both exploit; the "Demeniss Bound" questline (Kliff and Damiane) investigates the true cause of his condition | gaming.tools Edward_Thorel (via WebSearch snippet); fandom Demeniss (via WebSearch snippet) |
| Alan Serkis | Marquis, head of House Serkis | House Serkis | Oakenshield Manor, Hernand Castle | Hernand | quest NPC | — | Runs Hernand's internal affairs as House Celeste's "right hand" | fextralife NPCs |
| Stefan Lanford | Marquis, head of House Lanford | House Lanford | Calphade | Hernand | quest NPC | — | Defends the Hernand/Pailune border; ranked among Pywel's strongest fighters; long-time friend of Jian and close to the Greymanes; has one adoptive son, Walter Lanford, and no other known family | gaming.tools/fandom Stefan_Lanford (via WebSearch snippet) |
| Walter Lanford | Adoptive son of Stefan Lanford | House Lanford | Calphade | Hernand | quest NPC | — | Stefan's only known family; adoptive son | WebSearch snippet (gaming.tools Stefan Lanford page, single-source) |
| Charles Celeste | Duke of Hernand, head of House Celeste | House Celeste | Hernand Castle | Hernand | quest NPC | — | Duke of Hernand; the ducal role described in RESEARCH-REGIONS.md as descended from the knight Canta | fextralife NPCs |
| Alistair Grace | Count, head of House Grace | House Grace | Reedfield Graves, southern Hernand | Hernand | quest NPC | — | — | fextralife NPCs |
| Leon Roberts | Count, head of House Roberts | House Roberts | Bluemont Manor, Frowde Camp | Hernand | quest NPC | — | Hosts noble events; wealthy merchant family | fextralife NPCs |
| George Byron | Count, head of House Byron | House Byron | Windmere Manor, Demeniss | Demeniss | quest NPC | — | Runs the "Eyes of Demeniss" intelligence network; supports Caliburn; maintains contacts across Pywel | fandom House_Byron (via WebSearch snippet) |
| Beatrice Azerian | Countess, head of House Azerian | House Azerian | Azerian Manor, Demeniss | Demeniss | quest NPC | — | Took in and raised Damiane after House Spencer fell, teaching her swordsmanship and a personal code of honor; goes missing for part of the story; one of the noble figures who never yielded to Caliburn/Bastier's threats | gaming.tools Beatrice_Azerian (via WebSearch snippet) |
| Ada Marshell | Countess, head of House Marshell | House Marshell | Sungrove Manor, Demeniss | Demeniss | quest NPC | — | Caliburn/Bastier's "Black Strongbox" financial backer; prioritizes her own interests, sometimes shockingly so for her station | gaming.tools Ada_Marshell (via WebSearch snippet) |
| Arthur Elemore | Count, head of House Elemore | House Elemore | Brookfield Manor, Demeniss | Demeniss | quest NPC | — | Long-standing friend of House Azerian; bends to Bastier's pressure after Beatrice's disappearance but eventually moves against the Inquisitors in the "Lunar Judgment" faction chain | fandom House_Elemore (via WebSearch snippet) |
| Drake Wells | Duke of (southern) Demeniss, head of House Wells | House Wells | Thornbriar Fortress, southern Demeniss | Demeniss | quest NPC | — | Openly military, loyal to House Thorel, opposes Caliburn and Bastier outright | fandom House_Wells (via WebSearch snippet) |
| Barden Middler ("Marshal[l] of Hernand") | Military office-holder for Hernand | Hernand (city administration) | Hernand (multiple locations) | Hernand | quest NPC | — | "Marshal Middler" and "Barden Middler" are the same person — Marshal(l) is his title, not a separate character (resolves the task's naming question) | fextralife NPCs |
| Grundir | Dean of the Scholastone Institute | Scholastone Institute | Scholastone Institute | Hernand | quest NPC | — | Heads the academic institute; the "Dean of the Scholastone Institute" the task asked about | fextralife NPCs |

### Other story NPCs

| Name | Role | Faction(s) | Home / usual location | Region | Type | First met | Facts | Sources |
|---|---|---|---|---|---|---|---|---|
| Shakatu | Trademaster of the Goldleaf Merchant Guild | Goldleaf Merchant Guild | Various Goldleaf locations | Hernand | quest NPC | — | Runs Goldleaf's trade operations under Kailok | fextralife NPCs |
| Grimnir | Artisan of the Kilnden Workshop | — | Kilnden Workshop | Hernand | vendor/quest NPC | — | Craftsman NPC at the Kilnden Workshop (distinct from the similarly-named Grundir, the Scholastone dean) | fextralife NPCs |
| Octavius | Scholar | Scholastone Institute | Scholastone Institute | Hernand | quest NPC | — | — | fextralife NPCs |
| Alustin | Overseer of the Axiom Archive | — (Abyss entity) | Axiom Archive, the Abyss | Abyss | quest NPC | — | A transcendent entity that has existed since ancient times alongside White Crow; asks for Kliff's help maintaining balance between the Abyss and the ground | WebSearch snippet (fextralife Alustin, White Crow pages) |
| White Crow (the Witch) | Guardian of the Abyss | — (Abyss entity) | Ethereal Pathway, the Abyss | Abyss | quest NPC | Chapter 1 main quest "Woman in White" | One of four beings maintaining the Abyss's balance, alongside Alustin; introduces herself to Kliff as guardian of the Abyss and cosmic order; grants Kliff the Flight ability; kidnapped by Draven the Crowcaller in Chapter 5, later rescued | WebSearch snippet (fextralife White_Crow, Woman_in_White pages) |
| "Woman in White" | Name of the quest where Kliff meets White Crow, not a separate character | — | Ethereal Pathway | Abyss | quest NPC | Chapter 1 (final main quest of that chapter) | Not a distinct character — "Woman in White" is the 13th main mission/final Chapter 1 quest in which Kliff formally meets White Crow the Witch; task brief listed this as a separate name, resolved here | WebSearch snippet (fextralife Woman_in_White, questlog.gg) |
| Rulupee | Wandering "cat lover" NPC | — | City of Hernand, Lioncrest Watchtower | Hernand | quest NPC | — | Has mystical powers per the Fextralife NPC listing; gifts pendants to the player (per RESEARCH-COMPANION.md); a trackable, likeable non-critical NPC | fextralife NPCs; RESEARCH-COMPANION.md |
| Valgash | Leader of the Ironflame Orcs | Ironflame Orcs | Gorthak | Delesyia | quest NPC | — | Leads Delesyia's most powerful Gorthak-based force | game8 588601 |
| Marni | "Genius Engineer," leads Delesyia's technological development | Marni (faction)/Society of Progress | Delesyia | Delesyia | quest NPC | — | Drives Delesyia's technological-utopia project; her cloned consciousness diverged into the hostile AI H.A.L.L., which later impersonates her | fextralife Factions; game8 588601; gaming.tools H.A.L.L. page (via WebSearch snippet) |
| Areciel ("the Desert Witch"/"Witch of the desert trials") | One of the four regional Witch questline NPCs | — | A cliff hideout near Urdavah | Crimson Desert | quest NPC | — | Her location is revealed by a beggar boy near the Tommaso Fork Posthouse; asks the player to cleanse the last three "Sanctums"; her questline is the last of the four Witch questlines, unlocked only after completing the other three and collecting their Witch Tokens | WebSearch snippet (game8 591742, gamerant, powerpyx witch-location guides) |
| Elowen | "Witch of Wisdom," alchemist | — | Witch's House, Hernand | Hernand | vendor/quest NPC | — | One of the game's regional Witch NPCs (Hernand's); offers Abyss Gear-related services per the Demeniss-Witch comparison found for that region | fextralife NPCs; fextralife Vendors |
| Patrigio | "Renowned peddler," wandering trader | — | Duskwood, Hernand | Hernand | vendor | — | A traveling merchant rather than a fixed-shop vendor | fextralife NPCs; fextralife Vendors |
| Matthias | See Antagonists table (Order of Light leader) | Order of Light | City of Hernand | Hernand | antagonist/quest NPC | Chapter 2 | Cross-referenced here since the task brief listed him among "other story NPCs" as well as a boss | fextralife/fandom Matthias (via WebSearch snippet) |
| Bilwise | Eccentric shai NPC | — | Meandering Hills, Hernand | Hernand | quest NPC | — | Described only as having an "eccentric personality"; no further detail found | fextralife NPCs |
| Simon de Montfort | Wanted fugitive | — | (bounty target) | Hernand | quest NPC | — | Bounty target for stealing honey from an apiary | WebSearch snippet (fextralife Simon_de_Montfort page) |
| Blix | Wanted fugitive | — | Nas Riverside | Hernand | quest NPC | — | Bounty target for unauthorized looting of state-owned ruins | fextralife NPCs; WebSearch snippet (fextralife Blix page) |
| Jeffrey | Wanted fugitive | — | City streets, Hernand | Hernand | quest NPC | — | Theft bounty | fextralife NPCs |
| Billy | Wanted fugitive | — | Hernand Inn area | Hernand | quest NPC | — | Pickpocket bounty | fextralife NPCs |
| Bianca | Wanted fugitive | — | Church of Hernand area | Hernand | quest NPC | — | Murder bounty | fextralife NPCs |
| Salvatore | Wanted fugitive | — | Sunset Valley | Hernand | quest NPC | — | Murder bounty | fextralife NPCs |
| Alessio | Wanted fugitive | — | Greenfield Highlands | Hernand | quest NPC | — | Theft bounty | fextralife NPCs |
| Warren | Wanted fugitive | — | Pororin | Hernand | quest NPC | — | Drug-manufacturing bounty | fextralife NPCs |

### Named vendors and merchants

All rows below are vendor-type NPCs; "faction" is left blank where a vendor
has no faction tie beyond running their own shop. Region is Hernand unless
stated otherwise. Sourced from the Fextralife NPCs/Vendors pages (Hernand)
and gaming.tools "goods vendor" listings reached via WebSearch snippet for
other regions.

| Name | Shop type | Settlement | Region | Sources |
|---|---|---|---|---|
| Rhett | Equipment/blacksmith (armour merchant) | City of Hernand | Hernand | fextralife NPCs; fextralife Vendors |
| Tina | Tailor | City of Hernand | Hernand | fextralife NPCs; fextralife Vendors |
| Alden | General goods/provisioner | City of Hernand | Hernand | fextralife NPCs; fextralife Vendors |
| Bran | Tanner | City of Hernand | Hernand | fextralife NPCs; fextralife Vendors |
| Delkin | Grocer | City of Hernand | Hernand | fextralife NPCs; fextralife Vendors |
| Renee | Butcher | City of Hernand | Hernand | fextralife NPCs; fextralife Vendors |
| Dahlia | Innkeeper | City of Hernand | Hernand | fextralife NPCs; fextralife Vendors |
| Bentley | Royal Trading Post manager | City of Hernand | Hernand | fextralife NPCs; fextralife Vendors |
| Annabella | Saddler | City of Hernand | Hernand | fextralife NPCs; fextralife Vendors |
| Merton | Stablekeep | City of Hernand | Hernand | fextralife NPCs; fextralife Vendors |
| Haldwin | Contribution Shop manager | Hernand Castle | Hernand | fextralife NPCs; fextralife Vendors |
| Alfred | Priest (confessional) | Church of Hernand | Hernand | fextralife NPCs |
| Edmond | Livestock black-market fence | Hernand Farmhouse | Hernand | fextralife NPCs; fextralife Vendors |
| Grimrak | Back-alley merchant | Hernand Farmhouse | Hernand | fextralife NPCs; fextralife Vendors |
| Theoric | Dyer | Hernand Farmhouse/Dyehouse | Hernand | fextralife NPCs; fextralife Vendors |
| Groks | Black-market trade | Goldleaf Tradepost | Hernand | fextralife NPCs; fextralife Vendors |
| Prox | Black-market trade | Goldleaf Trading Post | Hernand | fextralife NPCs; fextralife Vendors |
| Serge | Black-market trade | Goldleaf Trading Post | Hernand | fextralife NPCs; fextralife Vendors |
| Darroch | Black-market merchant | Oakenshield Manor | Hernand | fextralife NPCs |
| Bruna | Saddler | Equinsher Saddlery | Hernand | fextralife NPCs; fextralife Vendors |
| Grania | Innkeeper | Kharonso | Hernand | fextralife NPCs; fextralife Vendors |
| Nork | Equipment vendor | Kharonso | Hernand | fextralife NPCs |
| Milford | Wagon black-market fence | Anvil Riverside Terrace | Hernand | fextralife NPCs; fextralife Vendors |
| Finley | Fisherman/fishing shop | Nas River Fishing Dock | Hernand | fextralife NPCs; fextralife Vendors |
| Grover | Banker | Hernand Bank | Hernand | fextralife NPCs |
| Turnali | Blacksmith | Hernand Smithy | Hernand | fextralife NPCs |
| Ibano | Owner, Muckroot Ranch | Muckroot Ranch | Hernand | fextralife NPCs |
| Bremer | Owner, cattle ranch | Hernand Farmhouse | Hernand | fextralife NPCs |
| Clemens | General merchant | Hernand Farmhouse | Hernand | fextralife Vendors (single-source) |
| Erich | Steward, House Roberts | Multiple locations | Hernand | fextralife NPCs |
| Ugmon | Director, trade management office | Goldleaf Guildhouse | Hernand | fextralife NPCs |
| Harvik | Artisan's assistant ("Mysterious Pot") | Kilnden Workshop | Hernand | fextralife NPCs |
| Irkyn | Artisan's assistant ("Kuku pot") | Kilnden Workshop | Hernand | fextralife NPCs |
| Elowen | Witch/alchemist ("Witch of Wisdom") | Witch's House | Hernand | fextralife NPCs; fextralife Vendors |
| Patrigio | Wandering peddler | Duskwood | Hernand | fextralife NPCs; fextralife Vendors |
| Tranan | Blacksmith/equipment (Greymane) | Greymane Camp | Hernand | fextralife NPCs; fextralife Vendors |
| Ronnie | Food/provisions (Greymane) | Greymane Camp | Hernand | fextralife NPCs; fextralife Vendors |
| Gunter | Equipment shop owner | Pailune (capital) | Pailune | WebSearch snippet (single-source) |
| Rocco | Provisioner | Skoghorn | Pailune | WebSearch snippet (single-source) |
| Thomas | Trade manager, Arcosa Varnia Merchant Guild | Arcosa | Crimson Desert | WebSearch snippet (single-source) |
| Alvaris | Contribution Shop manager | Tommaso | Crimson Desert | WebSearch snippet (single-source) |
| Rowan | Grocer | Tommaso | Crimson Desert | WebSearch snippet (single-source) |
| Seratien | Mineral vendor | Tommaso | Crimson Desert | WebSearch snippet (single-source) |
| Caden | Provisioner | Tommaso | Crimson Desert | WebSearch snippet (single-source) |
| Alina | Saddler | Tommaso | Crimson Desert | WebSearch snippet (single-source) |
| Nix | Trade manager | Tommaso | Crimson Desert | WebSearch snippet (single-source; possibly the same role as "Marcus," see Gaps) |
| Marcus | Trade manager | Tommaso | Crimson Desert | WebSearch snippet (single-source; possibly the same role as "Nix," see Gaps) |
| Norfix | Trade manager | Urdavah | Crimson Desert | WebSearch snippet (single-source; possibly the same role as "Kamraan," see Gaps) |
| Kamraan | Trade manager | Urdavah | Crimson Desert | WebSearch snippet (single-source; possibly the same role as "Norfix," see Gaps) |

## 3. Reputation and trust

- **Faction reputation** runs on a five-tier scale, lowest to highest: **War
  → Hostile → Neutral → Friendly → Alliance**. Most factions start at
  Neutral; War/Hostile factions attack on sight or otherwise penalize the
  player. Source: keengamer.com (this article is also the sole source for a
  claimed "110 distinct factions" total — treat that count as single-source
  and likely inflated, see Gaps); corroborated for the tier names/order by
  RESEARCH-COMPANION.md's own citation of a KeenGamer-equivalent source.
- **Reaching Alliance** with a faction unlocks three things: allied troops
  (faction soldiers assist the player in combat within that faction's
  territory), exclusive vendors (stock not sold anywhere else), and
  restricted resource nodes (mining deposits, gathering patches, and secret
  dungeons open only to Allied players). Source: keengamer.com.
- **Reputation is raised** by: progressing main-story and faction-specific
  quests (the single biggest gain), liberating factional strongholds/bandit
  camps (which also hands the location back to its original faction per the
  Fextralife Factions page), helping faction members in random encounters,
  completing bounty missions, and defeating bosses tied to that faction.
  Source: keengamer.com; fextralife Factions.
- **Contribution** is a separate, per-region meter, described as a localized
  experience bar distinct from faction reputation: players earn Contribution
  levels through regional activity, and each level grants one **Contribution
  Point** — a spendable, region-locked currency used at that region's
  Contribution Shop for exclusive gear, accessories, horse barding and
  banners. Contribution Shops exist per-region (confirmed named managers:
  Haldwin for Hernand, Alvaris for Tommaso/Crimson Desert) and unlock fully
  once the region/area is liberated. Source: thegameswiki.com Contribution
  Points page (via WebSearch snippet); powerpyx.com Contribution Shop
  locations list; fextralife NPCs (Haldwin, Alvaris).
- **Trust** is a separate **per-NPC** relationship value, distinct from both
  faction reputation and regional Contribution. Sources disagree slightly on
  its exact numeric range: RESEARCH-COMPANION.md (an earlier research pass,
  citing AllThings.how) gives it as **0-100**; the Game8 Trust-system page
  fetched directly this session describes it only as a visual "gauge" (red
  for disliked actions, green for liked) without confirming a 0-100 scale
  itself — treat the 0-100 figure as reported by one source, not directly
  re-confirmed this session.
  - Raised by: greeting the NPC, completing their Requests (side quests),
    and gifting items they like; for tameable animals specifically, petting
    (5 points/attempt, roughly 4 days of daily petting to max) or feeding
    meat (faster, amount varies by meat type, capped at 5 attempts/day).
    Source: game8 586801.
  - Lowered by: negative actions such as stealing in the NPC's plain sight
    or bumping into them (per RESEARCH-COMPANION.md/steamcommunity.com,
    single-source for the exact trigger list — see Gaps).
  - Unlocks: lower prices at that NPC's shop, new quests, and (for tameable
    animals) the ability to adopt them as loot-gathering pets. Maxing Trust
    with a merchant specifically (100, per RESEARCH-COMPANION.md) unlocks
    Supply Contracts and Trade Agreements that route their stock directly
    into the Greymane Camp's supply. Source: game8 586801; RESEARCH-COMPANION.md
    (via its cited AllThings.how source).
  - **Which NPCs are worth raising Trust with:** no source found gives a
    general "best NPCs to max Trust with" list beyond individual mentions —
    Rulupee (mystical-powers cat lover, gifts pendants) is the one NPC
    RESEARCH-COMPANION.md calls out by name as a good trackable/likeable
    example; the Game8 Trust page names only a tameable dog (not a merchant)
    as its one concrete payoff example. Treat "worth maxing" guidance as a
    gap — see Section 4.
- **Contribution vs. Trust, summarized:** Trust is individual to one NPC and
  measures that NPC's personal opinion of the player; Contribution is
  regional and measures the player's overall standing with a whole region's
  dominant faction/economy; faction Reputation sits at a third level between
  the two, tracking standing with one named faction specifically (which may
  span multiple regions, e.g. the Greymanes). Source: synthesized from
  game8 586801, thegameswiki.com Contribution Points, and keengamer.com
  (no single source states the three-way distinction this cleanly; this
  paragraph is this file's own synthesis of the three, not a copied claim).

## 4. Gaps

### Fetch failures / access problems
- `crimsondesert.fandom.com` — HTTP 402/403 to every method, as in
  RESEARCH-REGIONS.md; all fandom facts here are WebSearch-snippet only.
- `crimsondesert.gaming.tools` — the curl fallback documented as working in
  the previous research pass (`RESEARCH-REGIONS.md`) **no longer works**:
  every attempt this session, including a full desktop-Chrome header set,
  returned a Cloudflare "Just a moment..." challenge page (HTTP 403). All
  gaming.tools facts in this file are WebSearch-snippet only; a future pass
  should re-check whether the curl route still works, since it was
  apparently viable as recently as the prior session.
- `https://crimsondesert.co/guides/greymane-comrades-recruitment-dispatch-guide` —
  timed out after 60s; the full 16-name Greymane comrade roster this page
  reportedly holds was not recovered from it directly (partially recovered
  from Fextralife's NPCs/Greymanes pages instead, which named 22 Greymane
  affiliates in total — more than the "16 recruitable companions" figure
  quoted in search snippets, likely because the NPCs page includes
  non-recruitable camp staff like Ross, Carl, Tranan and Ronnie alongside
  actual field companions).
- `https://game8.co/games/Crimson-Desert/archives/590884` (Vendor Locations
  and Merchant Services) fetched but named no individual vendors, only shop
  *categories* — Delesyia and Demeniss vendor names in particular remain
  thin (see below).

### Naming/identity questions
- **House Caliburn vs. House Thorel:** resolved, not a true conflict — see
  the note under the Demeniss faction table. House Thorel is the legitimate
  (now powerless, comatose-king) royal house; House Caliburn is the
  usurping house that seized power by force. What's still unclear: whether
  the game's own reputation system tracks "House Caliburn" as a distinct
  faction with its own War-to-Alliance track, or whether Caliburn's regime
  is mechanically folded into a generic "Demeniss/Bastier's Inquisitors"
  hostile-faction bucket — neither core faction-list fetch (Fextralife
  Factions, Game8 588601) gives Caliburn its own row.
- **Lonely Jackals vs. "Jackals":** not a conflict — "Lonely Jackals" is the
  consistent formal name across every source found; "Jackals" is only ever
  a casual short form.
- **Barden Middler vs. "Marshal Middler":** resolved — one person; "Marshal"
  (sometimes spelled "Marshall") is his title as Hernand's military office
  holder, not a separate character.
- **Dean of the Scholastone Institute:** resolved — Grundir, per the
  Fextralife NPCs page.
- **"Disciples of Master Du"** (from the task brief) could not be confirmed
  as a distinct faction name anywhere; Master Du is thoroughly documented
  as an individual sage/boss, but no source names an organized "Disciples"
  faction separate from that encounter. Treat as unconfirmed.
- **Two different "Sebastian" characters:** the Fextralife NPCs page names a
  "Sebastian" who is an artisan at Wycliffe Mappery in the City of Hernand,
  while a WebSearch snippet of a different page (crimsondesert.app) names a
  "Sebastian" who is an early Grey Wolf mercenary companion who guides Kliff
  toward Hernand at the very start of the story. These read as two separate
  characters sharing a name (one a settled artisan, one an early traveling
  companion) rather than the same person, but this was not cross-confirmed
  against a single authoritative page — flag for the JSON-record author to
  verify before merging or splitting them.
- **Duplicate/possibly-duplicate Trade Manager names:** WebSearch snippets
  surfaced both "Nix" and "Marcus" as a Tommaso trade manager, and both
  "Norfix" and "Kamraan" as an Urdavah trade manager, from different result
  snippets in the same search. This may mean two managers per settlement
  (day/night shift, or two different shop instances), or it may be a
  snippet-summarization artifact from the search tool conflating two
  passages — neither was independently confirmed by a direct page fetch.
- **"Golden Star" and "H.A.L.L."** are documented as boss/antagonist
  entities, not as characters with the kind of biographical facts (age,
  relationships, weapon lineage) the rest of this file gives — included
  under Antagonists for completeness since the task brief asked about them
  by name, but they are thinner records than the human/orc/goblin cast.

### Content not found
- No source gave Myurdin's or Umbra's personal weapon in melee-combat terms
  (Umbra is fought as a dragon-form entity rather than a humanoid wielding a
  named weapon).
- No source gave a first-met chapter for most Greymane camp-staff companions
  (Ross, Carl, Tranan, Ronnie, Brice, Silvan, Otto, Aldric, Fritz, Devan,
  Pierce, Evelyn) beyond "encountered at Greymane Camp once it's built in
  Chapter 3" — left blank in the table rather than guessed.
- Vendor names for Demeniss and Delesyia specifically are much thinner than
  for Hernand and Crimson Desert: searches confirmed vendor *types* exist in
  both regions (blacksmith, stable, provisioner, a Delesyia Contribution
  Shop near Delesyia Castle in Tommaso — note this placement itself looks
  odd, since Tommaso is elsewhere described as a Crimson Desert-region town,
  see RESEARCH-REGIONS.md — possibly a snippet conflating two different
  "Tommaso"-adjacent locations) but no individual vendor names surfaced for
  either region in this session's searches.
- No source enumerated a complete, authoritative "worth maxing Trust with"
  NPC list; only Rulupee is called out by name for this in
  RESEARCH-COMPANION.md, and the Game8 Trust page's one concrete example
  (a tameable dog) is not an NPC in the vendor/companion sense.
- The exact Trust numeric range (0-100, per RESEARCH-COMPANION.md via
  AllThings.how) was not independently re-confirmed by any page fetched
  directly in this session — the Game8 Trust-system page fetched this
  session describes it only as a qualitative red/green gauge.
- Oongka's playable-status permanence (does he stay playable/switchable
  after Chapter 7, or is he temporary for a story stretch?) is not stated by
  the Game8 playable-characters page or by any other source found.
- Gabriel Caliburn's weapon is inferred only from a boss-page URL slug
  ("dualaxe") seen in search results, never stated in article prose —
  weak, single-source evidence; flagged rather than dropped since it is the
  only lead found.

### Row counts and coverage
See the closing summary in the final assistant response for exact row
counts of the Factions and Characters tables and how many of each have at
least one source URL/citation — this file's own text does not restate that
count so it does not go stale if rows are added later.


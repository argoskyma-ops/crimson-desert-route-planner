> Build-time working document from the 2026-09-05 companion planning pass, kept for history and not maintained. Two research sweeps by Claude subagents; facts are tagged verified / reported / unverified inline. Companion design: docs/COMPANION-SPEC.md.

# Research: game content and data sources for the companion

Part 1 surveys what the game contains (patch state, regions, quest and faction systems, collectibles, items, skills, mounts, bosses) and what an acquisition guide has to model. Part 2 surveys where the facts can come from and under what terms. Both were written on 2026-09-05.

---

# Part 1. Game content


## 1. Release and patch state

- **Release date:** March 19, 2026, simultaneous global unlock at 3PM PT / 6PM
  ET / 11PM GMT. [Pearl Abyss notice](https://crimsondesert.pearlabyss.com/en-us/News/Notice/Detail?_boardNo=50), [Vice](https://www.vice.com/en/article/crimson-desert-release-time-heres-when-you-can-play-on-ps5-pc-and-xbox/)
- **Platforms at launch:** Windows (PC), PlayStation 5, Xbox Series X/S, macOS.
  Also day-one on GeForce NOW (RTX 5080-class tier) and available through
  Xbox Cloud/Boosteroid cloud services. [Wikipedia](https://en.wikipedia.org/wiki/Crimson_Desert), [CGMagazine](https://www.cgmagonline.com/news/geforce-now-90-fps-vr-plus-day-one-aaa/)
  - **Nintendo Switch 2:** NOT out yet as of 2026-09-05. A port is in active
    development ("basic gameplay is possible" as of August 2026) targeting
    **first half of 2027**. Treat any "Switch 2" platform listing as
    forward-looking, not current. [Nintendo Life](https://www.nintendolife.com/news/2026/08/crimson-desert-switch-2-port-now-in-a-playable-state-release-targeting-first-half-of-2027)
- **Developer/Publisher:** Pearl Abyss, self-published. ~7-year development
  cycle, built on their proprietary "BlackSpace" engine; originally conceived
  as a *Black Desert Online* prequel before becoming a standalone IP.
  [Wikipedia](https://en.wikipedia.org/wiki/Crimson_Desert)
- **Current version as of today (2026-09-05):** The game was rebranded
  **"Crimson Desert Enhanced"** with the version **2.0** update on
  **August 25-26, 2026** — a free, packaged rollup of the ~5 months of
  post-launch patches plus new cutscenes/story beats, expanded voice-over
  (German, French, Spanish, Brazilian Portuguese, Japanese), skill-menu
  changes, etc. Anyone buying the game today gets "Enhanced" by default;
  existing owners updated for free (~33.5GB on PC). This is confirmed a
  **marketing rebrand**, not a paid edition. [Push Square](https://www.pushsquare.com/news/2026/08/crimson-desert-enhanced-edition-out-now-on-ps5-featuring-story-improvements), [Forbes](https://www.forbes.com/sites/paultassi/2026/08/26/crimson-desert-literally-patched-its-story-in-a-huge-way-transforming-kliff/), [VULKK 2.0 notes](https://vulkk.com/2026/08/26/crimson-desert-update-2-0-enhanced-edition-patch-notes/)
  - The Steam store page itself is titled **"Crimson Desert Enhanced"**
    (app id 3321460), confirmed by direct fetch of the store page.
  - The latest incremental patch on top of that is **2.01.00**, published
    **September 4, 2026** (~3.7GB on Steam): fixed a quest-completion bug on
    "The Cursed Knight," fixed camp-donation resource-cost display, added a
    new dispatch mission ("Gold Bar Investment Mission"), added skill-menu
    visual indicators, minor rain visual-noise and photo-mode (camera tilt)
    tweaks, horse-health-on-retry fix for riding quests. [VULKK 2.01](https://vulkk.com/2026/09/04/crimson-desert-update-2-01-improves-photo-mode-camp-funds-visual-noise-bugfixes/), [Steam news](https://store.steampowered.com/news/app/3321460/view/689767689898427146?l=english)
- **DLC / major content:**
  - **"Charting the Unknown"** — first major paid expansion, announced at
    the September 3, 2026 PlayStation State of Play, **releasing October 15,
    2026** on PC/PS5/Xbox Series X|S. Continues the story of Kliff, Oongka,
    and Damiane at a later point in their lives; adds naval combat, underwater
    exploration/exploration-with-a-shark-mount, homesteading/base-building
    with expanded housing customization, and reportedly romance features.
    [FandomWire](https://fandomwire.com/crimson-desert-charting-the-unknown-expansion-officially-releases-on-october-15th-2026/), [WCCFTech](https://wccftech.com/pearl-abyss-doubles-down-on-crimson-desert-as-charting-the-unknown-expansion-launches-on-october-15/), [GamingBible](https://www.gamingbible.com/news/crimson-desert-expansion-announced-007216-20260903)
  - A free OST ("Volume 1") is listed on Steam alongside a cosmetic "Deluxe
    Pack."
- **Roadmap:** Yes — Pearl Abyss published a public infographic roadmap
  covering **June–September 2026** (narrative-flow fixes for Kliff's story,
  more spotlight content for Damiane/Oongka, trading/farming adjustments),
  and has separately confirmed: an upcoming update adding new special mounts
  and a refinement-material "extraction/recovery" feature; planned
  **cross-save** across PC/PlayStation/Xbox; the Switch 2 port (H1 2027);
  and that multiplayer is under "technical and design research" with no
  confirmed feature or date. [Insider Gaming](https://insider-gaming.com/new-crimson-desert-roadmap-update-revealed/), [Inven Global infographic coverage](https://www.invenglobal.com/articles/24853/pearl-abyss-releases-crimson-desert-post-launch-update-infographic), [Aprasi](https://www.aprasi.com/blogs/trending-topics/crimson-desert-developer-pearl-abyss-reveals-future-plans-dlc-roadmap-switch-2-ports-and-multiplayer-r-d)

---

## 2. World structure

The continent is **Pywel**. It is consistently described across sources as
divided into **five ground-level regions**, plus a distinct vertical/aerial
layer:

1. **Hernand** — the starting region, most fleshed-out in wiki coverage
   today. Fertile, green, forested; epicenter of noble-house political
   intrigue. Contains the City of Hernand plus 150+ named sub-locations
   (villages, estates, ruins) per fan cataloguing — e.g. Pororin Village/
   Pororin Forest, Scholastone Ruins, Roothold. [Fandom/Fextralife Hernand pages], [G FUEL map guide](https://gfuel.com/blogs/news/crimson-desert-map-full-region-map-cities-and-more)
2. **Pailune** — cold, mountainous/snow-capped north; home turf of the
   Greymanes and the site of the game's opening catastrophe (Black Bear
   attack on Greymane Camp); Pailune Castle is a named location.
3. **Demeniss** — political/religious capital-region of Pywel: castles,
   temples, regal architecture, House Caliburn's power base.
4. **Delesyia** — most "advanced"/exotic region: described (with some
   inconsistency across low-tier sources — treat mechanical-being/robot
   claims here as **unverified**) as a commerce/trade hub with an active
   criminal underworld.
5. **Crimson Desert** (the namesake region) — lawless red-sand desert with
   no central government; named settlements include Tommaso (gambling at
   "the Bonepit"), Varnia (holy city), Urdavah (pilgrimage gateway village),
   Arcosa ("most prosperous village" in the region). [G FUEL](https://gfuel.com/blogs/news/crimson-desert-map-full-region-map-cities-and-more)
6. **The Abyss** — not a ground region but a separate vertical/sky layer
   "above" the main map, with floating islands/platforms, its own fast-travel
   nodes (inside the "Axiom Archive," per lower-tier sources — **unverified**
   name), and Abyss-tier gear/bosses tied into it.

No sources found describe a second continent beyond Pywel; the upcoming
"Charting the Unknown" DLC adds naval/underwater areas but these read as an
extension of Pywel's coastline, not a separate landmass (unconfirmed pending
its Oct 15 release).

Region → sub-area pattern (best evidenced for Hernand, the most-documented
region): **region → named sub-zone (forest/mountain-range/coastline) →
settlement/estate/dungeon/POI**. Fextralife's faction list (below) doubles as
a location index since most factions are settlement- or estate-bound (e.g.
"House Lanford" ties to the sub-region "Calphade").

---

## 3. Content categories

### Quests
In-game/community vocabulary distinguishes: **Main Quests** (story),
**Faction Quests** (the primary side-quest system, organized per named
faction/house), **Commissions** (short repeatable tasks — e.g. "Greymane
Commissions," pay out a flat reward like one Medium Bag, refresh roughly
daily), **Requests** (some are time-limited/window-based), **Bounties**
(hunt named targets, e.g. for House Celeste), and **Challenges** (a distinct
tracked-progress system, separate from quests, feeding trophies). Sources
do not cleanly define "contract" as its own category — it appears to be used
loosely/interchangeably with commission/bounty. [Games.gg faction quests](https://games.gg/crimson-desert/guides/crimson-desert-faction-quests-guide/), [CD Guru commission/bounty guide](https://osrsguru.com/guides/crimson-desert/crimson-desert-commission-bounty-guide-2026.html)

Counts (Game8/GameRant/TalkEsport, **treat as approximate — not cross-verified
against an official count**): **12 numbered chapters + a prologue ("Dead of
Night") + an epilogue = 14 story sections**; **168 individual main-quest
mission steps**; **~430-442 total missions** once faction quests/side
quests/requests are included. [Game8](https://game8.co/games/Crimson-Desert/archives/582136), [GameRant](https://gamerant.com/crimson-desert-main-story-quests-chapter-list/)

### Factions
Confirmed via Fextralife's dedicated Factions page (most reliable single
list found) plus cross-referenced character/lore pages:
- **Greymanes** — Kliff's mercenary company, "protectors of Pailune."
- **Black Bears** — Myurdin's hostile faction, shattered the Greymanes.
- **Jackals** ("Lonely Jackals") — led by Ludvig; also complicit in the
  Greymanes' destruction; controls Pailune Castle.
- **House Celeste** — old-nobility house allied with Roothold (Hernand);
  early Greymane ally, united by shared distrust of Myurdin.
- **House Caliburn** (Demeniss) — Duke Gabriel Caliburn's house; drives the
  regional conspiracy against Pailune.
- **House Serkis, House Grace, House Lanford (Calphade), House Roberts,
  House Felix, House Alfonso** — Hernand-region noble houses, each with a
  described specialty (internal affairs, technology, regional defense,
  merchant wealth, spearmastery, etc.).
- **Scholastone Institute** — academic faction studying the Abyss.
- **Goldleaf Merchant Guild** — Hernand's largest merchant guild (run by
  goblins in-fiction).
- **Vellua Fishermen's Guild, Pororin Forest Guardians, Kharonso Troll
  Alliance, Beggars' Alliance** — smaller Hernand community factions.
- Hostile/antagonist factions: **Hornsplitter's Guards, Fundamentalist
  Goblins, Bleed Bandits, Wolf Trackers, Southern Bandits**, and the
  "Reed Devil" (a demon-controlled faction of its own reed-field territory).
[Fextralife Factions](https://crimsondesertgame.wiki.fextralife.com/Factions)

I could **not verify** a faction literally named "Ruhilinn" or "Demeniss"
(Demeniss is a region/political power, not a faction name per se) —
treat any such name as **unverified/likely mistaken**. One low-tier source
claimed "110 factions" total; this could not be corroborated by any
better-evidenced source and likely conflates faction with per-settlement
reputation tracking — **unverified, probably inflated**.

**Reputation system:** two layers appear in sources — (a) faction Reputation
with a five-tier scale **War → Hostile → Neutral → Friendly → Alliance**,
raised via faction quests/defending territory/escorts, unlocking
faction-exclusive vendors, materials, schematics, and restricted resource
nodes/dungeons at Alliance; (b) a separate per-NPC **"Trust"** system
(0-100) for individual vendors — gifting liked items raises Trust and
unlocks discounts/unique stock/quests. Also a **regional "Contribution"**
meter that yields Contribution Points as a distinct currency for
faction-reward shops. [KeenGamer factions guide](https://www.keengamer.com/articles/guides/crimson-desert-all-factions-guide-how-to-earn-reputation-and-best-rewards/), [AllThings.how Trust](https://allthings.how/crimson-desert-trust-system-every-npc-worth-maxing-to-100/)

### Characters/NPCs
- **Playable:** Kliff (versatile melee — swords/spears/axes/grappling,
  Greymanes' acting leader), **Damiane** (rapier+pistol glass cannon,
  unlocked ~Chapter 3), **Oongka** (fierce melee fighter, unlocked
  ~Chapter 7). [Game8 playable characters](https://game8.co/games/Crimson-Desert/archives/583000)
- **Key Greymane companions:** Yann (diplomat/strategist), Naira
  (blade/bow/unarmed all-rounder, "most dangerous fighter"), Marius (first
  survivor Kliff finds, holds intel on the others).
- **Antagonists:** Myurdin (Black Bears leader), Gabriel Caliburn (Duke of
  Demeniss, House Caliburn), Ludvig (Jackals leader).
- **Notable recurring NPC:** Rulupee, a wandering "cat lover" NPC who gifts
  pendants — a good example of a non-quest-critical but trackable/likeable
  NPC for a companion-guide data model.

### Collectibles
Distinct types found across sources:
- **Treasure items / unique treasures** (boss drops, e.g. "Memory of
  Turbulence," "Mossy Secret Map," "Phoenix Feather").
- **Memory fragments** and **lore documents/notes** (non-progression, kept
  for reference/lore).
- **Learned recipe books** (cooking / alchemy / refining — once learned,
  stored, not consumed).
- **Sealed Abyss Artifacts** — small wooden roadside altars; each unlocks a
  challenge, success grants a unique Abyss-tier weapon.
- **Abyss Artifacts** more generally, tied to a "Bells of Pywel" collectible
  questline (**unverified specifics** — one source claims 8 bells whose
  ringing clears regional fog and reveals hidden "Mysterious Energy"
  markers; treat exact count/name with caution).
- **Gatherables** (per Fextralife categorization): Meats and Grains, Fruits
  and Vegetables, Mushrooms and Herbs, Minerals, Crafting Materials.
- **Wardrobe/cosmetic items**, obtained via dedicated collectible chests.
- **Legendary/named horses** (see Mounts) function as a collectible-mount
  category of their own.
[Fextralife wiki homepage categories](https://crimsondesertgame.wiki.fextralife.com/Crimson+Desert+Wiki), [The Gamer wardrobe/chests guide](https://www.thegamer.com/crimson-desert-wardrobe-gatherables-collectible-chests-location-how-to-get-explained-guide/)

There is a dedicated **Collectibles Chest** — a 1,000-slot stash unlocked via
a short quest ("Early Encounter" near the Timberturner Wainwright, north of
the Nas River, Hernand) purely for quest items/collectibles/lore notes/
learned-recipe books, separate from combat/crafting inventory — notable
precedent for an "item category" split in a data model.

### Points of interest types
- **Fast travel:** two waypoint types — **Abyss Nexus** (plain, no
  challenge) and **Abyss Cresset** (puzzle/challenge-gated, rewards an
  Abyss Artifact on first unlock). 160+ confirmed fast-travel points across
  the five regions plus extra nodes tied to a special zone (called "Axiom
  Archive" by one source — **unverified name**). [GameSpot fast travel](https://www.gamespot.com/gallery/crimson-desert-fast-travel-abyss-nexus-teleporter-locations/2900-7591/)
- **Bandit/hostile camps**, cleared for loot/XP/faction reputation.
- **Caves and multi-room dungeons** with puzzles/enemies/treasure (a dozen+
  in Hernand alone per fan cataloguing).
- **Ruins** (e.g. Scholastone Ruins), **estates** (noble estates with
  puzzle-locked strongboxes), **arenas, quarries, prisons, lodges**, and
  assorted unique landmarks.
- **Fishing spots** (rivers/lakes/coastline), **mining/gathering nodes**,
  agricultural sites tied into faction/camp supply chains.
- Boss arenas are generally embedded in the above POI types rather than a
  separate category (per boss-list sources, each boss has a named location).

### Vendors/stores and currencies
Vendor types confirmed across sources: **blacksmith/equipment shop,
general-goods merchant/grocer, stable/saddler, tailor, innkeeper (10 named
Inns, selling meals/drinks/base ingredients and sometimes physical Cooking
Recipe scrolls), tavern, furniture shop, provisioner, witch/alchemist
(Elowen/Elowenn), and at least one hidden wandering trader (Patrigio)**.
[Games.gg vendor discussion](https://steamcommunity.com/app/3321460/discussions/0/805722030393541337/)

**Currency:** three-tier system — **Copper** (common enemy drop, smallest
unit) → **Silver** (standard vendor/blacksmith currency, 100 copper = 1
silver) → **Gold Bars** (highest denomination, mainly for bank
investment/high-value trades; 500 silver = 1 gold bar at a bank, though a
random merchant only pays ~190 silver for one). Separate **Contribution
Points** exist as a faction-reward-shop currency. [KeenGamer / TheGamesWiki currency guides]

### Items
- **Weapons, armor (headgear/gloves/body/cloaks/footwear), shields,
  accessories, projectiles, tools** — standard equipment slots per
  Fextralife's item taxonomy.
- **Abyss Gear** — a distinct highest-tier equipment category with sockets/
  passive modifiers, crafted from Abyssal-zone materials and Abyss boss
  drops.
- **Gear rarity:** a color-coded rarity ladder (base stats + number of Abyss
  Gear sockets scale with rarity) — exact tier names/count not confirmed
  from a single authoritative source; **treat tier names as unverified**.
- **Upgrading = "Refinement"**: every equipment piece has **10 Refinement
  levels**; no gold/silver cost, only raw materials. Levels 1-2 use common
  ores/pelts, level 3 needs region-specific drops, level 4 needs boss-only
  materials, and beyond level 4 only Abyss artifacts (Abyss boss drops /
  deep-dungeon finds) progress it further. Material type depends on gear
  category (ores for metal/plate, timber for wood shields, hides for
  leather, textiles for cloth). [KeenGamer refinement guide](https://www.keengamer.com/articles/guides/crimson-desert-refinement-guide-how-to-upgrade-weapons-and-armor/)
- **Note on set bonuses:** at least one source states armor sets in Crimson
  Desert do **not** grant a bonus for wearing a full matched set — armor
  choice is largely cosmetic/stat-only per piece. Relevant if the data model
  is tempted to add "set bonus" fields.
- **Unique/legendary weapons and armor pieces** are individually named
  (e.g. "Frozen Anguish," "Bringer of Balance," "Blackwing," "Frostcursed,"
  "Canta Plate") and cannot be upgraded via duplicates — see Section 5 for
  worked acquisition examples.

### Skills/abilities/stats
Skill tree is split into **three color-coded branches** mapped to three
core stats: **Stamina (Blue)** — endurance for sprinting/climbing/gliding/
heavy attacks/riding; **Spirit (Green)** — "Mind," resource for special
abilities, upgradeable to level 14 per one source; **Health (Red)** —
includes elemental infusions. Each of the three playable characters (Kliff/
Damiane/Oongka) has **their own skill tree** (per Fextralife's page
structure: "Kliff Skills," "Oongka Skills," "Damiane Skills"). Skills are
unlocked by finding Abyss-artifact fragments or "observing skills in
action," and can be leveled multiple times to unlock sub-branches. No
"Blessing"-named subsystem was found in any reputable source — likely a
mismatch with another game (possibly Black Myth: Wukong or an ARPG); treat
"Blessing" as **unverified/likely not the correct term** for this game.
[Fextralife Skills](https://crimsondesertgame.wiki.fextralife.com/Skills)

### Mounts / rideable / gliding
- **Regular horses**, tamed by sneaking up unaware and triggering a
  stick-direction minigame (fill a taming bar by pushing opposite to the
  horse's facing); horses level up with use (speed/stamina/defense).
- **Three named Legendary horses:** **Rokade** (black horse, southern
  Hernand "Steel Mountains," near "Spire of Insight," requires Stamina
  Lv.6+ to tame comfortably), **Royler**, and **Camora**. [PowerPyx legendary horse locations](https://www.powerpyx.com/crimson-desert-legendary-horse-locations/)
- **Gliding:** unlocked automatically via the mandatory Chapter 2 main quest
  "Trial of the Winds" at the first Ancient Obelisk; deployed with a
  double-jump input.
- Broader "mounts and vehicles" marketing material references wolves,
  wild cats, and other tameable animals, plus more exotic/mechanized
  options — treat anything beyond horses/wolves/standard wildlife (e.g.
  dragons, "All-Terrain Armored Gear" mechs) as likely **conflated with the
  upcoming "Charting the Unknown" DLC** (which does add mechs/underwater
  mounts) rather than base-game content — **flag as needing re-verification
  once the DLC ships Oct 15, 2026.**
- Vehicles/mechanized transport reportedly obtained via crafting
  commissions/projects (**unverified specifics**).

### Minigames
Six broad activity types found consistently: **arm wrestling** (mash
input to fill/hold a gauge), **archery/shooting contests, horse racing,
card games** (named variants: **Duo** — similar to Korean Seotda, **Five-
Card** — poker-style hand-ranking, **Thrones**), **Rock-Paper-Scissors, and
unarmed duels**. Rewards vary: faction reputation, gold, or unique items.
Fishing and cooking are typically classed as "life skills"/gathering-craft
activities rather than "minigames" proper, though guide sites sometimes
lump them together.

### Bosses / named monsters
Sources disagree sharply on the total: one aggregator claims **76 per the
in-game codex**, others cite **80** or **87**, and a further source says
"75+." **Treat the exact boss count as unverified/contested** — a mid-70s
to high-80s figure is the safest characterization pending an authoritative
count. Boss categories: **World Bosses, Elite Bosses, Legendary Animals**,
each with unique fight mechanics (e.g. destroy the Reed Devil's totems;
plunge-attack the Queen Stoneback Crab's shell). Notable named bosses:
Matthias (Hernand City, an early main-quest boss), Kailok "the Hornsplitter"
(early challenging optional boss), Reed Devil (Chapter 3 field boss),
Gabriel Caliburn (Demeniss story boss/antagonist), Crowcaller (source of
the Blackwing armor set).

### Achievements/trophies
**PS5 trophy list: 35 total** — 1 Platinum ("Pywel Legend"), 4 Gold, 10
Silver, 20 Bronze; **Steam: 34 achievements** (no platinum-equivalent
capstone). One source breaks the list into five rough categories: **Story
(10), Weapon Mastery (8), Combat (5), Exploration (6), Collection &
Minigame (6)** — numbers don't sum cleanly to 35 across sources, so treat
this breakdown as approximate. "Master of ___" weapon-mastery trophies
exist per weapon type (Swords, Shields, Bows, Spears, Two-Handed Weapons,
Artillery, Rapiers, Firearms). **No missable trophies** — consistently
confirmed by multiple sources; useful constraint for a completion-tracking
data model. [PSNProfiles](https://psnprofiles.com/trophies/40482-crimson-desert), [8BitToast](https://8bittoast.com/crimson-desert-achievements-trophy-guide/)

### Codex/Compendium/Bestiary
Mixed signal here: one source describes an in-game **"Knowledge Codex"**
covering **401 creatures**; another claims the base game currently has **no
built-in bestiary/lore-codex UI** and that comprehensive bestiary/item
databases exist only as **fan-made** resources (e.g. "Greymane Codex,"
"Codex Desert," "Crimson Desert Companion," multiple wiki mirrors). Given
the contradiction, **treat "in-game Codex with 401 creatures" as
unverified** — it's plausible the 2.0 "Enhanced" update (which added
"knowledge, items, memory fragments, dialogue" per its patch notes) also
added or expanded an in-game knowledge/bestiary panel, but this should be
confirmed against the patch notes directly before being treated as fact.
This is directly relevant: this project may effectively need to **build the
compendium the game itself may be missing**, similar to what "Greymane
Codex"/"Codex Desert" fan sites already attempt.

---

## 4. Naming that matters for a data model

- **Stable identifiers:** quest names, unique item/weapon/armor names, named
  NPCs, and named locations (settlements, camps, dungeons) are the anchors
  every wiki and guide site converges on and cites consistently — these are
  safe primary keys for a data model.
- **Instability/patch churn:** the 2.0 "Enhanced" patch explicitly reworked
  main-story narrative content, dialogue, and boss-related "knowledge, items,
  memory fragments," meaning quest text, item flavor text, and possibly some
  item names have already shifted once since launch (5 months in). A
  Facebook-sourced claim that Pearl Abyss "quietly renamed every 'Fat Cat' to
  'Loafy Cat'" in a patch, and a separate claim that "Vellua Pirates Banner
  Pike" became "The Dancing Catfish Pirates' Banner Pike," illustrate the
  *kind* of low-stakes cosmetic-name churn to expect — **both individual
  examples are low-confidence/unverified single-source claims**, but the
  *pattern* (patches quietly renaming flavor items) is corroborated by the
  general 2.0 patch notes and should be assumed likely to recur.
- **Localization:** the game shipped with expanded voice-over as of 2.0
  (German/French/Spanish/Brazilian Portuguese/Japanese added on top of
  whatever shipped at launch), and at least one patch (1.17.00) specifically
  fixed Russian localization/mechanics bugs — implying translated string
  tables are actively maintained and can diverge from English, and that
  English itself isn't necessarily "final" even 5+ months post-launch.
- **Internal IDs (datamine-visible):** Yes — modding tooling exists and
  documents the internal format. Items live in a header/body pair
  (`iteminfo.pabgh` header of `(item_key u32, body_offset u32)` entries;
  `iteminfo.pabgb` body). Internal string keys (e.g. `item_currency_pywel_01`)
  must be globally unique across the iteminfo table (duplicates cause a
  "failed to save data" error in the dev tooling). Localization string IDs
  are **computed from the numeric item_key** at runtime via
  `name_id = (item_key << 32) | 0x70` and `description_id = (item_key << 32)
  | 0x71` — i.e., the engine does not read a human-readable ID string, it
  derives the two localization slots from the item's integer key. This
  comes from a GitHub modding-tool README
  ([Benreuveni/crimson-desert-add-item](https://github.com/Benreuveni/crimson-desert-add-item))
  and should be treated as credible-but-community-sourced (not an official
  Pearl Abyss disclosure) — useful if this project ever wants a stable
  "canonical ID" scheme mirroring the game's own, but not something to
  depend on for correctness.
- **Practical implication for this project:** use **display names** (quest
  title, item name, place name) as the primary human-facing identifier since
  that's what every source, wiki, and the player sees, but keep an internal
  slug/ID layer independent of display text so a future rename patch doesn't
  break references — exactly the problem the game's own internal
  `item_key`-based system exists to solve.

---

## 5. What an "acquisition guide" looks like for this game — 3 worked examples

These illustrate the step/field structure a guide/quest-chain data model
needs to support: prerequisite, location, action, cost, repeatable?,
missable?

**Example A — Legendary mount "Rokade" (mount / exploration reward)**
- *Prerequisite:* none strictly required, but Stamina skill level 6+
  strongly recommended (taming drains stamina; running out mid-tame knocks
  you off and resets progress).
- *Location:* southern Hernand, "Steel Mountains" area, near a lake by the
  "Spire of Insight," in "Grace Estate."
- *Action:* approach unseen, mount to trigger a taming minigame (push the
  stick opposite the horse's facing repeatedly until a bar fills).
- *Cost:* none (no currency), but a stamina-resource cost during the attempt.
- *Repeatable:* no — one-time capture per playthrough (like all wild
  animal/legendary-horse taming).
- *Missable:* not story-locked, but effectively "geography-gated" — nothing
  prevents you from taming it, but nothing tells you where it is either;
  functionally missable without a guide. [PowerPyx](https://www.powerpyx.com/crimson-desert-legendary-horse-locations/), [Method.gg](https://www.method.gg/crimson-desert/crimson-desert-legendary-horses-how-to-find-and-tame-royler-rokade-and-camora)

**Example B — Unique weapon "Bringer of Balance" (hidden-chest exploration
reward)**
- *Prerequisite:* none (no quest gate); pure exploration/navigation.
- *Location:* south of the "Forbearers Barons" map label, west of Tashelp;
  descend through a trap door into an underground ruin.
- *Action:* find and use the trap door, navigate to an altar, retrieve the
  weapon from the altar.
- *Cost:* none.
- *Repeatable:* no — singular world placement, one-time pickup.
- *Missable:* yes in the sense that it's easy to gallop past unnoticed and
  there's no in-game marker pointing to it directly; not permanently lost
  (can return any time), so "missable" here means "easy to miss," not
  "lost forever." [FandomWire unique weapons](https://fandomwire.com/all-unique-weapons-in-crimson-desert/)

**Example C — "Canta Plate" starter armor set vs. "Blackwing" armor set
(vendor purchase vs. mixed boss+exploration set)**
- *Canta Plate (simple case):* Prerequisite — reach Hernand Town and unlock
  the relevant vendor (Rhett). Location — Rhett's shop, Hernand Town.
  Action — straightforward gold purchase. Cost — silver (exact price
  unconfirmed). Repeatable — yes, it's a standard vendor SKU. Missable — no.
- *Blackwing (composite case):* Prerequisite — capable of reaching and
  defeating the "Crowcaller" boss (mask + armor piece drop here); remaining
  pieces are separately hidden as exploration loot at other locations
  (unspecified). This is the harder case for a data model: a single named
  "item" (an armor *set*) is actually a **multi-step acquisition tree**
  with a boss-kill branch and 1+ independent exploration-loot branches that
  must all be completed to "finish" the set. [VULKK armor catalog](https://vulkk.com/2026/05/09/crimson-desert-armor-sets-catalog/), [GamingBolt best armor](https://gamingbolt.com/crimson-desert-guide-the-best-armor-sets-and-how-to-get-them)

**Structural takeaway for the data model:** a guide "step" needs at minimum:
`prerequisite (quest/level/item/none)`, `location (region → sub-area →
precise landmark)`, `action (buy/loot/defeat/tame/solve-puzzle/craft)`,
`cost (currency + amount, or none)`, `repeatable (bool)`, `missable
(bool/enum: not-missable / easy-to-miss / permanently-lost-if-X)`. Sets/
composite rewards need a **one-to-many** relationship from "reward" to
"acquisition steps," since a single named item (Blackwing set) can require
multiple independent sub-acquisitions.

---

## 6. Missables and branches

- **Official/community consensus: there are effectively no *permanent*
  missables by design**, and specifically **no missable trophies/
  achievements** (confirmed by multiple independent trophy-guide sources).
  Crimson Desert is explicitly described by guide writers as a "forever
  game" you can approach in almost any order.
- However, **point-of-no-return moments do exist within the main campaign**:
  progressing far enough into certain main-story beats "permanently alters
  the world state," can kill off specific NPCs, and locks their associated
  side-questlines for that playthrough if pursued too aggressively. (One
  source's wording named a character "Macduff" in this context — this name
  does not otherwise appear anywhere else in this research and could not be
  cross-verified; **treat that specific name as unverified**, but the
  underlying point-of-no-return mechanic is corroborated by multiple
  sources.)
- **Story branching:** the main campaign is described as essentially
  **linear** (~50 hours for just the main campaign per one estimate; 100+
  hours for "thorough" play per trophy guides). Faction alignment and minor
  dialogue choices reportedly do **not** change the main ending, and you are
  locked into playing Kliff for the main critical-path missions (Damiane/
  Oongka are unlocked as playable but the ending is singular per available
  sources). **Treat "single ending" as reasonably well corroborated but not
  100% certain** — no reputable source explicitly discusses multiple main
  endings, which is itself suggestive there's only one.
- **Faction-choice content locks:** exist at a *side-content* level (e.g.
  killing an NPC tied to a faction locks that faction's remaining
  questline) rather than at the main-story level.
- **A named structural trap (not a missable, but adjacent):** the
  "Challenge" tracking system is called out by a guide source as containing
  a mechanic that can waste "dozens of hours" of progress if approached
  without understanding it first — worth flagging as a UX/data-model
  consideration (i.e., a system where doing things in the "wrong order"
  doesn't destroy content but can waste significant player effort — this
  project's guide should probably surface a warning for this rather than
  model it as a strict missable).

---

## Overall confidence note

Treat this document as a solid map of the **content categories that exist**
(quests, factions, mounts, vendors, refinement, POI types, achievements,
codex) and the **shape of an acquisition step** — high confidence, drawn
from largely consistent cross-source agreement. Treat almost **every
specific numeric count** (faction count, boss count, mount count,
achievement sub-category breakdown, bell count) as **soft/contested** —
guide sites for this game disagree with each other constantly, likely
because the game keeps patching (5 major/40+ minor patches by the "2.01.00"
mark in under 6 months) and because a swarm of very-recently-created,
apparently AI-assisted SEO guide sites (thegameswiki.com, xmodhub.com,
consolepulse.com, dropreference.com, osrsguru.com, egamersworld.com, and
similar) are republishing and probably embellishing each other's numbers.
Fextralife, Fandom, Game8, PowerPyx, Kotaku, Forbes, PC Gamer, GameRant, and
the official Pearl Abyss/Steam channels were treated as the higher-trust
tier in this write-up; anything sourced only from the lower tier is called
out explicitly above.

---

# Part 2. Data sources and licences


## 1. Crimson Desert Fandom wiki

- **URL:** https://crimsondesert.fandom.com/wiki/Crimson_Desert_Wiki
- **Coverage:** Characters, factions, locations, lore. As of this research: 325 articles,
  1,611 edits, 248 images (`Category:Characters`, `Category:Factions`,
  `Category:Locations` populated but thin — the wiki is young, started around the
  game's March 2026 launch). No dedicated quest-database or item-database category
  observed yet; coverage is narrative/lore-first, not stat/data-first.
- **Machine-readable access:** Yes. Every Fandom wiki exposes the standard MediaWiki
  Action API at `https://crimsondesert.fandom.com/api.php` (confirmed pattern — same
  as `community.fandom.com/api.php`), supporting `action=query`, `action=parse`,
  `action=opensearch`, etc. Infobox data is additionally exposed via Fandom's
  **Portable Infobox API** (`dev.fandom.com/wiki/Portable_Infobox_API`), which returns
  structured infobox fields (stats, coordinates, faction, etc.) rather than raw
  wikitext. A full XML dump/archive also exists on the Internet Archive
  (`archive.org/details/wiki-crimsondesertfandomcom`).
- **Licence:** Text content is **CC BY-SA 3.0 (Unported)** unless the wiki explicitly
  states otherwise — this is Fandom's network-wide default per
  `https://community.fandom.com/wiki/Help:Licensing`: "Unless otherwise noted, all text
  content on... [a] wiki is licensed under... Creative Commons Attribution-Share Alike
  License 3.0 (Unported)... you retain copyright to your edits while agreeing to license
  them under CC BY-SA terms, giving blanket and irrevocable permission to the world at
  large to reuse, remix, and transform your work as long as you are attributed as the
  author." Fandom's general licensing page: `https://www.fandom.com/licensing`.
  **Important carve-out:** the CC BY-SA licence covers **text only**. Images, video, and
  other media on Fandom wikis are governed separately (often fair-use screenshots or
  third-party copyrighted art) and are explicitly excluded from the CC BY-SA grant per
  Fandom's own Help:Licensing page ("applies only to text, not other media like images,
  video, or comments").
- **Verdict:** **Reusable for facts/data, with attribution, text only.** Extracting
  structured facts (item names, quest titles, faction names, character names,
  coordinates mentioned in prose) via the API and re-expressing them as JSON rows is
  low-risk and squarely what CC BY-SA anticipates. Do **not**: copy prose paragraphs
  verbatim into the repo without a CC BY-SA notice + link back to the source page (the
  licence requires attribution + share-alike for the *expression*, not the underlying
  facts); download or rehost wiki images without separately checking each image's
  licence tag. Practically: this repo's data files should carry a short per-entry
  `source` field (page URL) and the repo should have a CREDITS/DATA-LICENSE note citing
  CC BY-SA 3.0 and linking `https://creativecommons.org/licenses/by-sa/3.0/`. Coverage
  is currently too thin to be a primary source — best used to backfill lore/character
  fields once populated further, and to cross-check names extracted elsewhere.

## 2. th.gl (The Hidden Gaming Lair) Crimson Desert map

- **URLs:** https://crimsondesert.th.gl/ (map), https://www.th.gl/apps/crimson-desert
  (app/feature page), tile CDN `cdn.th.gl/crimson-desert/...` (already used by this repo
  for base-map tiles per `docs/DECISIONS.md`).
- **Coverage:** Interactive map with markers for stables, trading posts, wells, crafting
  stations, 70+ animal-spawn types, Memory Fragments, treasure chests, shops with vendor
  inventories, plus (per this repo's own extraction) teleports, camps, villages, hearths,
  and map labels — POI/marker data, not quest text or item stat tables.
- **Machine-readable access:** Yes, informally — this repo already fetches
  `cdn.th.gl/crimson-desert/nodes/OpenWorld.<hash>.raw` (a binary node dump) via
  `scripts/fetch-fast-travel.py`, and the map tiles themselves via a predictable CDN URL
  pattern. There is **no documented public API or ToS-sanctioned export** — this is
  reverse-engineered from the site's own network calls, not an intentionally published
  dataset. Their frontend code lives at
  `github.com/The-Hidden-Gaming-Lair/thgl-web-components`.
- **Licence:** No terms-of-service page was found on the site itself (checked
  `th.gl/terms`, homepage footer — footer links only to Status, the developer's personal
  site, the GitHub repo, Patreon, and Discord; no ToS/legal/privacy link at all). The
  **frontend source repo is explicitly proprietary**: its README states verbatim,
  *"This project is not open source. You are not permitted to use or repurpose this code
  for your own projects. All rights reserved © The Hidden Gaming Lair."*
  (`github.com/The-Hidden-Gaming-Lair/thgl-web-components`). The README does not
  separately address data/marker licensing, but the "all rights reserved" stance and
  total absence of any published reuse grant means the data pipeline that produces the
  marker dumps should be assumed closed too.
- **Verdict:** **Do not bulk-redistribute.** This matches and reinforces this repo's
  existing stance in `docs/DECISIONS.md` ("no reuse terms stated... personal, local use
  only... do not redistribute the tiles or anything derived from them except the road
  graph and water mask"). The same logic should extend to any th.gl-derived POI/marker
  data used for quests/items/vendors: fine to consult locally while building your own
  independently-authored dataset (coordinates and names are facts, not protectable
  expression — see Legal framing below), but committing their raw `.raw` node dumps or
  scraped marker JSON wholesale to a public MIT repo is the single highest-risk move in
  this whole list, given the code-repo's explicit all-rights-reserved stance next door.
  Safer path: use th.gl only as a locally-consulted cross-reference to *verify*
  coordinates you also see corroborated elsewhere (official screenshots, your own
  gameplay, another independently-sourced map), then write your own values.

## 3. MapGenie (mapgenie.io/crimson-desert)

- **URL:** https://mapgenie.io/crimson-desert (also `mapgenie.io/crimson-desert/maps/pywel`)
- **Coverage:** 800+ locations, 70+ categories — collectibles, Abyss artifacts, faction
  quests, memory fragments (per Windows Central's coverage). POI-marker-focused, similar
  breadth claim to th.gl. Also ships as mobile apps ("MapGenie: CD Pywel Map" on iOS/
  Google Play).
- **Machine-readable access:** A `window.mapData` JSON blob is embedded in the map page's
  HTML (confirmed by this repo's own `docs/RESEARCH.md`: `curl` of
  `mapgenie.io/crimson-desert/maps/pywel` returned "222,530 bytes; contained
  `window.mapData` JSON with tile config"), but the actual tile assets are served from
  `tiles.mapgenie.io` behind what is effectively an access-gate: every tile request in
  this repo's prior testing returned **HTTP 403 with an S3 `AccessDenied` body**, even
  with Referer/Origin headers set, and the same 403 pattern reproduced on an unrelated
  MapGenie game (Elden Ring) as a control — i.e., MapGenie deliberately blocks
  non-browser/hot-linked tile access. No public API or bulk export was found.
- **Licence:** No ToS document was retrievable (WebFetch blocked by the site; no cached
  terms text found). MapGenie is described everywhere as "an unofficial fan-made map...
  in no way affiliated with Pearl Abyss," and operates as an ad-supported commercial
  product (this repo's own research file already flags: "ad-supported commercial
  product; terms not reviewed, but scraping... low priority").
  **App-store presence + gated tile CDN + no public terms = treat as commercial,
  all-rights-reserved by default.**
- **Verdict:** **Do not scrape or redistribute.** The deliberate 403-gating of tile
  assets is itself a signal of an anti-scraping posture; there is no evidence of any
  licence grant for the marker/location data either. Same guidance as th.gl: consult
  visually as a cross-reference only, never commit their marker data or images.

## 4. Fextralife wiki

- **URL:** https://crimsondesertgame.wiki.fextralife.com/ (also redirects appear under
  `crimsondesert.wiki.fextralife.com`)
- **Coverage:** Broad and structured — Guides & Walkthrough, Interactive Map, Equipment,
  NPCs, Lore, Locations, quest walkthroughs, vendors, mounts, enemies/bosses, an
  "Abyss Nexus"/"Greymane Camp" faction/location breakdown. This is the most
  comprehensively *structured* (stat-table-heavy) wiki source found for items/equipment.
- **Machine-readable access:** None found. No public API; a `data.wiki.fextralife.com`
  subdomain exists but did not resolve (DNS failure) during this research, so no evidence
  of a public data service.
- **Licence:** **Proprietary — owned by Valnet Inc.** The Fextralife "About/wiki-license"
  page (`https://fextralife.com/wiki-license/`) states no CC-style grant at all; it
  points to Valnet's general **Terms of Use** (`valnetinc.com/en/terms-of-use`),
  **Privacy Policy**, and **Editorial Integrity** policy, footed with
  "Copyright © 2026 Valnet Inc." Unlike Fandom, there is no CC BY-SA notice anywhere —
  this is a standard commercial media-company copyright stance (all rights reserved,
  standard media ToS language elsewhere on Valnet properties prohibits copying,
  automated scraping, and derivative-work redistribution without permission).
- **Verdict:** **Prose and stat tables are copyrighted; do not scrape or copy text.**
  As with all proprietary wikis in this list: bare facts you can independently confirm
  (an item exists and is named "X", located near coordinate Y) are not protected by
  copyright once you re-express them in your own words/structure, but downloading their
  page HTML, table markup, or descriptions and dropping them into your JSON verbatim is
  not licensed and should not be done.

## 5. IGN wiki guide

- **URL:** No dedicated "IGN wiki" page for Crimson Desert was located (search turned up
  IGN previews/reviews, not a structured wiki/database as IGN runs for some other
  titles). IGN's interactive-map coverage is referenced secondhand (crimsondesert.pro
  mentions "IGN coverage").
- **Licence:** IGN's Terms of Service explicitly prohibit reuse: *"users agree not to
  copy, reproduce, transmit, publish, display, distribute, commercially exploit or
  create derivative works of such material and content"*, and the site is "copyrighted
  by IGN, with all rights reserved."
- **Verdict:** **Proprietary, confirmed.** No IGN content (text or data tables) should
  be scraped or copied. If a structured IGN wiki page later appears for this game, same
  rule applies as Fextralife: facts you independently verify are fine, IGN's expression
  of them is not.

## 6. PowerPyx

- **URLs:** `https://www.powerpyx.com/crimson-desert-wiki-strategy-guide/`,
  `.../crimson-desert-trophy-guide-roadmap/`, `.../crimson-desert-all-challenges-guide/`,
  `.../crimson-desert-all-secret-places-locations/`. (This repo previously used
  PowerPyx's full-world-map JPEG as its original map source, now retired in favour of
  th.gl tiles — see `docs/DECISIONS.md` "Previous source (retired 2026-09-03)".)
- **Coverage:** 100%-completion strategy guide, trophy/achievement roadmap, challenges
  guide, secret-places/Abyss Cressets guide. Collectible- and completion-checklist
  focused; not a structured item/quest database.
- **Licence:** No explicit reuse terms found on the site (this repo's own prior research
  in `docs/RESEARCH.md` reached the same conclusion: "no explicit reuse terms on the
  page (typical trophy/guide site); this is a third-party [source]"). Standard implicit
  copyright applies — no CC notice, no public-domain dedication, no API.
- **Verdict:** **Proprietary by default; treat prose/guide-structure as copyrighted.**
  This repo already made the correct call once (retiring the PowerPyx image as a *map*
  source and keeping only the geometric transform/coordinates it derived, not the image
  itself) — apply the same pattern to any content data: derive your own facts, don't
  republish PowerPyx's write-ups.

## 7. Game8, GameWith, Gamer Guides, RPG Site, Polygon

- **URLs:** `game8.co/games/Crimson-Desert` (region guides, quest lists, beginner's
  guide), `gamerguides.com/crimson-desert/database` (item/weapon/armor/character/
  collectible database), Polygon coverage (interactive maps referenced alongside IGN
  and Game8), GameWith and RPG Site not independently confirmed to have dedicated
  Crimson Desert hubs at research time.
- **Coverage:** All are commercial games-media outlets with guide/wiki verticals; Game8
  and Gamer Guides in particular have fairly complete quest lists and item databases for
  this game already.
- **Licence:** All are standard commercial media properties — implicit all-rights-
  reserved copyright, standard ToS prohibiting scraping/republication (same pattern as
  IGN/Fextralife/Valnet). None were found to publish an API or a permissive content
  licence.
- **Verdict:** **Proprietary, confirmed by pattern — do not scrape.** Useful only as
  human-read cross-references to verify facts before writing your own entries.

## 8. Steam Community guides

- **URL example:** `https://steamcommunity.com/sharedfiles/filedetails/?id=3724081637`
  ("Crimson Desert Guide Hub – Full Guide & Tools").
- **Coverage:** Community-authored guides of varying depth and quality; one indexed
  "Guide Hub" aggregator was found for this game.
- **Licence:** Governed by the **Steam Subscriber Agreement**
  (`https://store.steampowered.com/subscriber_agreement/`). Per its User Generated
  Content clause: *"By uploading UGC, you grant Valve a broad license to use, modify,
  and distribute your content... you retain ownership of your UGC, but Valve can create
  derivative works and use them without compensation to you."* Critically, this is a
  licence **the guide author grants to Valve** — it says nothing about a licence from
  the author (or Valve) **to third parties** like this repo. The individual guide
  author retains copyright and third-party reuse rights are not addressed at all.
- **Verdict:** **Treat as author-copyrighted, no third-party reuse licence exists.**
  Do not copy Steam guide text/tables into this repo. Facts corroborated there (e.g., a
  quest name, an item's approximate location) can inform your own independent entry, but
  the guide's wording/structure cannot be reused without the individual author's
  permission.

## 9. GitHub datamine / community data repos

- **`NattKh/CRIMSON-DESERT-SAVE-EDITOR-AND-GAME-MODS`**
  (https://github.com/NattKh/CRIMSON-DESERT-SAVE-EDITOR-AND-GAME-MODS) — save editor +
  mod tools. **Licence: MPL-2.0** (repo README: "Both builds are licensed under MPL-2.0;
  see `CrimsonGameMods/LICENSE`"). Contains `item_names.json` (~6,325 items, 6,253
  localized English names) and other data folders (`vanilla_tables/`, `knowledge_packs/`,
  `dropset_packs/`, dye/locale data). Explicitly states: *"Unofficial, non-commercial
  modding utilities... No game assets, binaries, or proprietary data are redistributed —
  all extraction happens locally from your own installed copy."* — i.e. the **tool** is
  MPL-2.0 licensed, but the data files it operates on are still derived from Pearl
  Abyss's own game files, extracted locally per-user; the repo's own disclaimer implies
  the *data tables it ships* (localized names etc.) sit in a legal grey area the
  maintainer manages by disclaiming redistribution of "proprietary data" — worth reading
  literally: check per-file whether a given JSON in that repo is the maintainer's *code*
  (MPL-2.0, reusable) versus a *data table extracted from the game* (ambiguous,
  copyright in Pearl Abyss's underlying compilation/text likely still applies even
  though MPL-2.0 covers the surrounding tool code).
- **`NattKh/CrimsonDesertCommunityItemMapping`**
  (https://github.com/NattKh/CrimsonDesertCommunityItemMapping) — a community item-name
  database ("itemKey → friendly name") used by "Crimson Mod Console." **No LICENSE file
  found** in the repo; contribution flow is "Crimson Mod Console GUI → Item DB tab →
  Copy Contributions" (crowd-sourced from players' local game/mod-console sessions, not
  scraped from a wiki). Absent an explicit licence, GitHub's default terms apply:
  *code hosted publicly is viewable, but has no licence grant for reuse/redistribution
  unless one is stated* — treat as **all-rights-reserved by default** despite being
  public, per GitHub's own ToS guidance on unlicensed repos.
- **`gildyboye/CrimsonDesertShopEditor`** (github.io tool) — a shop/vendor editor;
  licence not checked in depth, same "unofficial modding tool" category as the above.
- General GitHub topic pages exist (`github.com/topics/crimson-desert-mods`,
  `.../crimson-desert-tools`, `.../crimson-desert-json`) but turned up modding tools, not
  curated open datasets with clear licences suitable for direct import.
- **Community spreadsheets (Discord/Reddit-sourced Google Sheets):** none were found
  publicly indexed by search at research time. Community data efforts for this game
  currently live inside dedicated web databases instead (see next paragraph), not shared
  spreadsheets.
- **New community database/wiki sites** (found during this research, not in the original
  candidate list, all post-launch March 2026): `crimsondesert.gaming.tools`,
  `crimsondesert.gg`, `crimsondb.gg`, `questlog.gg/crimson-desert`,
  `crimsondeserthub.com`, `gamerguides.com/crimson-desert/database`. These are all
  commercial/ad-supported guide-database sites in the same category as Game8/GameWith —
  none exposed a documented public API in this research pass, and none published an
  explicit open-data licence; treat all as proprietary by default pending direct
  confirmation.
- **Verdict:** The **erdb precedent is the right model, not these repos.** For a genuine
  Elden Ring parallel, `github.com/EldenRingDatabase/erdb` is **MIT-licensed** and its
  data is *"ripped straight from the game files using Yabber and ERExporter"* — i.e.,
  datamined directly from the shipped game, not copied from any wiki. That is the
  legally cleanest precedent (facts extracted straight from the compiled game data you
  legitimately own a copy of, republished as your own compilation), but it requires
  someone to actually datamine Crimson Desert's game files — a materially different
  (and more technical) effort than transcribing a wiki. Short of that, the NattKh
  MPL-2.0 tool repo's *item_names.json* is the closest thing to a reusable, licensed,
  machine-readable community dataset found — but its licence covers the *tool*, and the
  data table itself should still be treated cautiously (attribute it, don't assume it's
  free of Pearl Abyss's own rights in the underlying localized strings).

## 10. Official Pearl Abyss sources

- **Official site:** https://crimsondesert.pearlabyss.com/ — patch notes, news, media
  kit.
- **Fan Content Guidelines (the operative document):**
  https://crimsondesert.pearlabyss.com/en-us/Policy?_policyNo=130. Key clauses found:
  - Permits fan videos/streams, art, screenshots, community sites/fan pages, and
    **"monetization... through websites or platforms that provide passive ad revenue,
    solicit donation revenue, or subscription benefits."**
  - Prohibits charging fees for access, licensing the content, or transferring ownership
    for payment — i.e., **non-commercial-in-the-sense-of-no-paywall, but ad/donation
    revenue is explicitly fine.**
  - Requires a disclosure that the content is unofficial/not endorsed by Pearl Abyss.
  - Prohibits including other companies' IP without permission or altering Pearl Abyss's
    own logos/trademarks.
  - Confirms creators own their own fan content, while Pearl Abyss retains the
    underlying game IP; a disclaimer does not exempt non-compliant content; contact
    `fancontent@pearlabysscorp.com` for questions.
  - There is also a separate **official Fan Kit download**
    (`crimsondesert.pearlabyss.com/en-us/News/Notice/Detail?_boardNo=25`) of approved
    art assets, explicitly gated on agreeing to the same Fan Content Guidelines.
- **Codex/in-game text:** Not found surfaced anywhere officially online (no "codex.
  pearlabyss.com" or similar was located); any such text would come from third-party
  transcription/datamining, not an official machine-readable source.
- **Verdict:** **This is the single most important source in the whole list, and the
  one to build the whole project's legal posture around.** Pearl Abyss has
  affirmatively pre-authorized exactly this kind of project — a non-commercial,
  ad/donation-supported, clearly-disclaimed fan companion site — *as long as* the repo
  (a) doesn't charge for access or sell the content, (b) discloses "unofficial" status
  prominently, (c) doesn't misuse Pearl Abyss's logos/trademarks, and (d) doesn't
  incorporate other companies' IP without permission. Facts, names, and numbers taken
  from official patch notes are fair game (facts aren't copyrightable; see Legal framing
  below) and additionally the whole project sits inside Pearl Abyss's own explicit
  permission grant, which is a stronger position than "facts aren't copyrightable" alone.
  Screenshots/official art should still only be used via the Fan Kit or your own
  in-game captures, per the guidelines.

## 11. Wikipedia / Wikidata

- **Wikipedia:** https://en.wikipedia.org/wiki/Crimson_Desert — release info,
  reception, development history. Text is **CC BY-SA 4.0** (Wikimedia's standard licence
  since 1 June 2023) plus GFDL; images are individually tagged (many are non-free fair
  use screenshots/boxart not relicensable). Mostly meta/marketing facts (release date,
  sales figures, dev history), not gameplay data (quests/items/POIs).
- **Wikidata:** https://www.wikidata.org/wiki/Q85979990 — structured entity data
  (developer, publisher, release date, platforms) under **CC0 (public domain
  dedication)** — Wikidata's standard licence for all statement data. This is the single
  cleanest-licensed machine-readable source in this entire list, but its scope is
  limited to bibliographic/metadata facts about the game itself, not in-game content.
- **Verdict:** **Safe, trivial, but narrow.** Fine to pull release date/platforms/
  developer/publisher fields from Wikidata's API with no licence friction at all (CC0);
  Wikipedia prose can be paraphrased-and-attributed for any "About this game" blurb, but
  don't be tempted to lean on it for quest/item data — it doesn't have that.

---

## Legal framing (plain English, not legal advice)

**(a) Facts vs. expression.** US copyright law (and most jurisdictions influenced by it)
protects *original expression* — the specific words, sentence structure, table layout,
and artistic choices an author used to describe something — not the *facts* themselves.
An item's name, a quest's title, a set of X/Y coordinates, a character's name and
faction, a vendor's location: these are facts about the game, and a fact does not become
"owned" by whoever first published it. This is why phone books, sports statistics, and
recipe ingredient lists are not copyrightable, even though a particular *cookbook's*
descriptive prose is. Two important nuances: (1) even a "compilation of facts" can get
a thin copyright if the *selection and arrangement* is creative (e.g., a curated "top 10
secrets" list has some protectable structure even though each secret-fact doesn't); (2)
this repo is subject to US practice as a baseline, but Pearl Abyss is a Korean company
and some jurisdictions protect databases more broadly (EU sui generis database right) —
in practice, the safe posture is: **extract the facts, discard the original
sentence/table structure, and write your own descriptions and arrangement.**

**(b) CC BY-SA data next to an MIT code repo.** This is standard practice and the two
licences do not conflict as long as they're kept structurally separate: MIT covers *your
code* (the routing engine, the UI, the build scripts); a CC BY-SA notice covers *the data
files whose content derives from a CC BY-SA source* (e.g., Fandom-sourced text). The
conventional pattern:
1. Put such data in its own directory (e.g. `data/content/` or similar) with its own
   `LICENSE` file stating "This directory's content is licensed CC BY-SA 3.0/4.0,
   attributed to [wiki name/URL], except where noted" — separate from the repository
   root `LICENSE` (MIT, for code).
2. Add a short attribution/credits file or a `source` field per JSON record pointing back
   to the originating wiki page.
3. State in the top-level README that "code is MIT; game-content data in `data/content/`
   is CC BY-SA, see `data/content/LICENSE`" so downstream users know which rules apply
   to which files.
CC BY-SA's "share-alike" clause only binds *derivative works of the CC BY-SA content
itself* (i.e., if someone forks your CC BY-SA data files and republishes them, they must
keep them CC BY-SA and attribute) — it does not "infect" your MIT-licensed code, because
code and data are different files serving different, separable purposes. This is exactly
the pattern OpenStreetMap-based apps use (ODbL data + MIT/Apache app code) and the
pattern Wikipedia-derived tools use (CC BY-SA text + any code licence for the tool).

**(c) What to avoid.**
- **Scraping proprietary wikis' prose** (Fextralife/Valnet, IGN, Game8, GameWith,
  PowerPyx, Gamer Guides, RPG Site, Polygon) and committing their write-ups, tables, or
  HTML structure verbatim. All of these carry standard commercial all-rights-reserved
  copyright with no reuse grant; scraping tooling in their ToS is typically explicitly
  prohibited. Extract facts, write your own words.
- **Hotlinking or rehosting their images/screenshots.** Even where facts are free,
  images are almost never free — official screenshots are Pearl Abyss's copyrighted
  art (usable only under the Fan Content Guidelines / Fan Kit terms), and third-party
  wiki/guide-site images carry their own separate rights that CC BY-SA text licences on
  the same wiki do not cover (Fandom explicitly excludes media from its CC BY-SA text
  grant).
- **Copying th.gl's or MapGenie's marker/node JSON wholesale.** Neither publishes a
  reuse licence; th.gl's own frontend code repo is explicitly "all rights reserved,"
  and MapGenie actively 403-gates its tile CDN (a clear anti-scraping signal). Treat
  both as consult-only references, never as a source you bulk-copy into the repo.
- **Publishing datamined binary/proprietary game files themselves** (textures, meshes,
  raw table dumps straight out of the game's paks) — as opposed to *facts extracted from
  them and re-expressed as your own JSON* — since that crosses from "facts aren't
  copyrightable" into "distributing the compiled game's actual copyrighted assets,"
  which Pearl Abyss's Fan Content Guidelines and general game ToS do not permit.

**How comparable open-source game-companion projects actually handle this:**
- **`EldenRingDatabase/erdb`** (MIT licence) — datamines the actual shipped game files
  directly ("ripped straight from the game files using Yabber and ERExporter") rather
  than scraping any wiki; this is the cleanest precedent because the "source" is the
  game you own, not someone else's copyrighted compilation.
- **`theBowja/genshin-db`** (MIT licence, npm package) — built atop the community
  `GenshinData` datamine repo, again sourced from extracted game files rather than wiki
  scraping; maintainer notes are informally lax about the licence ("I don't really care")
  but the structural pattern — datamine → your own MIT-licensed parsing/packaging layer
  — is the template worth following.
- **`poe.ninja`** — aggregates player-submitted trade/market data (via the official
  Path of Exile API and its own stash-scanning), not wiki content; downstream open-source
  clients (`poe_ninja_client`, MIT) consume *its* API the way this repo might one day
  expose its own JSON, illustrating the "your own compiled API, MIT-licensed wrapper
  code" pattern.
- **OpenStreetMap-style apps generally** pair ODbL-licensed map data with permissively
  licensed (MIT/Apache) application code in clearly separated directories/repos — the
  direct model for recommendation (b) above.

None of these precedents scrape a commercial wiki's prose wholesale; all either datamine
the game directly, consume an official/semi-official API, or crowd-source original
player-submitted data (not copied text) — reinforcing that the safe lane for this
project is the same.

---

## Recommendation: ranked by (safe to use) x (coverage), and how to draw on each

| Rank | Source | Safety | Coverage | How to use |
|---|---|---|---|---|
| 1 | **Pearl Abyss official site/patch notes/Fan Kit** | High — explicit permission via Fan Content Guidelines | Low-medium (meta facts, official names, some art via Fan Kit) | Fetch patch notes/news programmatically where structured; manually transcribe official names/dates with citation; use Fan Kit art only under its terms, always disclosed as unofficial |
| 2 | **Wikidata** | Highest (CC0) | Very low (bibliographic metadata only) | Direct API fetch, no attribution legally required (but good practice to credit) |
| 3 | **Crimson Desert Fandom wiki** | Medium-high (CC BY-SA 3.0, text only) | Low today, will grow | MediaWiki/Portable-Infobox API fetch for structured facts; re-express, don't copy prose; attribute + CC BY-SA notice in a separate data-licence file |
| 4 | **GitHub `NattKh/*` community mod repos** | Medium (MPL-2.0 tool code; data provenance murkier) | Medium (real item names/keys, quest-adjacent editors) | Use as a cross-reference for canonical item names/keys; if importing `item_names.json`-style tables, attribute the repo and treat the underlying strings as Pearl Abyss's own localized text repackaged by the community, not free-and-clear |
| 5 | **Wikipedia** | High (CC BY-SA 4.0) | Very low (game overview only) | Paraphrase for an "About" blurb; do not lean on for gameplay data |
| — | **Everything else (Fextralife, IGN, Game8, GameWith, Gamer Guides, RPG Site, Polygon, PowerPyx, Steam guides, th.gl, MapGenie, and the new gaming.tools/crimsondesert.gg/crimsondb.gg/questlog.gg/crimsondeserthub.com database sites)** | Low — proprietary/all-rights-reserved or undocumented terms | High (these are collectively the richest, most complete quest/item/location data that exists right now) | **Manual transcription with citation only**, never bulk scraping: a human (or an agent under human review) reads a guide page, independently re-derives the fact (item X exists, is located near Y, dropped by Z), and writes an **original** JSON entry + a `source` URL comment/field pointing at the page consulted for verification — the same "verify against, don't copy from" pattern this repo already applies to th.gl/PowerPyx map tiles |

**Recommended pipeline for this project:**
1. **Foundation layer (safe, automatable):** script Wikidata + Pearl Abyss patch-notes
   fetches for metadata; script a MediaWiki API fetch against the Fandom wiki for
   structured facts as its coverage grows, storing a CC BY-SA notice alongside.
2. **Bulk content layer (the hard part — quests, items, POIs, vendors, characters):**
   do **not** automate scraping of Game8/Gamer Guides/Fextralife/PowerPyx/th.gl/MapGenie.
   Instead, treat those sites exactly as this repo already treats PowerPyx's map image
   and th.gl's tiles: **consult them to find and verify facts, then hand-write your own
   JSON records** with your own descriptions, citing the page(s) you cross-checked
   against in a `sources` array per record (URLs, not quoted text). This is slower but
   is the only approach consistent with every proprietary source's ToS and with the
   project's own existing risk posture.
3. **Optional future upside:** if a community datamine repo analogous to `erdb` or
   `GenshinData` ever appears for Crimson Desert (extracting quest/item tables directly
   from the shipped game's data files rather than from any wiki), that would become the
   single best source — MIT/permissively-licensable and traceable to the game files
   themselves rather than anyone else's copyrighted write-up. Nothing at that fidelity
   exists yet as of 2026-09-05; the closest is `NattKh/CRIMSON-DESERT-SAVE-EDITOR-AND-
   GAME-MODS`'s `item_names.json`, which is worth watching and citing if used, but is a
   community mapping layer, not a full quest/item stat datamine.
4. Keep a `docs/DATA-SOURCES.md` (or extend `SOURCE.md`) in the repo listing, per data
   file, which upstream sources were consulted and under what licence terms — the same
   discipline `SOURCE.md`/`docs/DECISIONS.md` already apply to the map tiles.

---

### Sources consulted (URLs)
- https://crimsondesert.fandom.com/wiki/Crimson_Desert_Wiki
- https://community.fandom.com/wiki/Help:Licensing
- https://www.fandom.com/licensing
- https://crimsondesert.th.gl/
- https://www.th.gl/apps/crimson-desert
- https://www.th.gl/
- https://github.com/The-Hidden-Gaming-Lair/thgl-web-components
- https://mapgenie.io/crimson-desert
- https://www.windowscentral.com/gaming/this-crimson-desert-interactive-map-is-already-up-and-covers-all-of-pywel
- https://crimsondesertgame.wiki.fextralife.com/Crimson_Desert_Wiki
- https://fextralife.com/wiki-license/
- https://game8.co/games/Crimson-Desert
- https://www.gamerguides.com/crimson-desert/database
- https://www.powerpyx.com/crimson-desert-wiki-strategy-guide/
- https://steamcommunity.com/sharedfiles/filedetails/?id=3724081637
- https://store.steampowered.com/subscriber_agreement/
- https://github.com/NattKh/CRIMSON-DESERT-SAVE-EDITOR-AND-GAME-MODS
- https://github.com/NattKh/CrimsonDesertCommunityItemMapping
- https://github.com/EldenRingDatabase/erdb
- https://github.com/theBowja/genshin-db
- https://crimsondesert.pearlabyss.com/en-us/Policy?_policyNo=130
- https://crimsondesert.pearlabyss.com/en-us/News/Notice/Detail?_boardNo=25
- https://en.wikipedia.org/wiki/Crimson_Desert
- https://www.wikidata.org/wiki/Q85979990
- https://crimsondesert.gaming.tools/
- https://questlog.gg/crimson-desert/en
- Project files: `docs/DECISIONS.md`, `docs/RESEARCH.md`, `docs/NOTES.md`, `SOURCE.md`,
  `LICENSE` (this repo)

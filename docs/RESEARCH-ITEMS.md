# Research: named unique weapons, armour, shields and accessories

Compiled 2026-09-06 to support later JSON records for the companion's item
data (unique weapons, armour sets/pieces, shields, accessories) and how each
is obtained. Facts only; wording is this file's own — item names, stats and
other proper nouns are copied verbatim since they are not prose. Confidence
is reported per-fact; anything only one source gives is marked
"single-source." Cells are left blank where nothing was found — nothing here
is invented.

Two existing project documents were read first and are folded in below
without being re-fetched: `docs/RESEARCH-COMPANION.md` (section "Items",
~lines 240-265, and section 5's three worked acquisition examples — Rokade,
Bringer of Balance, Canta Plate vs Blackwing) and `docs/RESEARCH-MAIN-STORY.md`
(grepped for gear named as quest rewards). Facts carried from those files
keep their original citation and are marked "(carried from
RESEARCH-COMPANION.md)" / "(carried from RESEARCH-MAIN-STORY.md)" so a
reader can tell they were not independently re-verified this session.

## Sources

Access notes carried from `docs/RESEARCH-REGIONS.md`: `crimsondesert.fandom.com`
returns HTTP 402/403 to every fetch method (not retried here; no fandom URL
ended up needed for gear facts this session — none surfaced in search results
that weren't better covered by Fextralife/Game8/VULKK/KeenGamer). `th.gl` and
`mapgenie` URLs were excluded on sight per instructions even when a search
surfaced them.

**New this session:** `crimsondesert.gaming.tools` returned a Cloudflare
"Just a moment..." JS-challenge page (HTTP 403) to `curl` with a browser
User-Agent on every item-index URL tried, unlike the region pages fetched in
a previous session — the challenge appears to now be enforced on `/items/*`
paths specifically. Not used as a source this session; item facts below come
entirely from the other preferred sources instead.

Directly fetched (WebFetch), usable content:
- https://crimsondesertgame.wiki.fextralife.com/Weapons — weapon type
  categories (Bows, Daggers, Firearms, Hand Cannons, One-Handed Weapons,
  Shields, Two-Handed Weapons) and a large name index per category (hundreds
  of weapons; no rarity or acquisition info on this index page).
- https://crimsondesertgame.wiki.fextralife.com/Armor — armour slot
  categories (Headgear, Gloves, Body Armor, Cloaks, Footwear) and a 40+
  armour-set name index; states sets "grant different types of buffs at
  different levels" and gear "can eventually be repaired or upgraded"; no
  acquisition info on this index page.
- https://crimsondesertgame.wiki.fextralife.com/Armor+Sets — HTTP 404 (wrong
  slug; individual set pages use `/<Name>_Set`, confirmed below).
- https://crimsondesertgame.wiki.fextralife.com/Shields — a 75-shield name
  index grouped by a Light/Medium/Heavy informal defense-tier grouping; no
  acquisition info.
- https://crimsondesertgame.wiki.fextralife.com/Accessories — earring (18),
  necklace (26), ring (26) and bracelet (3) name indexes; states accessories
  come "through completing quests, defeating enemies and bosses, purchasing
  from merchants, crafting through blacksmiths" but with no per-item detail.
- https://crimsondesertgame.wiki.fextralife.com/Unique+Weapons — a WIP page;
  lists ~30 unique weapon/shield names by category with no acquisition text.
- https://crimsondesertgame.wiki.fextralife.com/Ator's_Will_Set,
  /Camouflage_Set, /Crimson_Chaser_Set, /Fallen_Kingdom_Set, /Cursed_Soul_Set,
  /Baltheon_Plate_Set, /Belkandor_Plate_Set, /Duskfang_Leather_Set,
  /Grey_Wolf_Leather_Set, /Helfryn_Leather_Set, /Dulone_Plate_Set,
  /Chelcia_Plate_Set — per-set pages giving piece names and acquisition text;
  detail folded into Section 3.
- https://vulkk.com/2026/05/09/crimson-desert-armor-sets-catalog/ — a
  100+-set catalog; full acquisition detail extracted for Frostcursed,
  Blackwing and Unyielding Warrior's; the rest of the catalog only came back
  as category/region/user summaries, not per-set acquisition (fetch tool
  truncated a very long page).
- https://vulkk.com/2026/05/30/how-to-get-damianes-white-bloodwind-armor-in-crimson-desert-overview-and-stats/
  — full 5-piece acquisition detail for the White Bloodwind set (Trust-100
  NPC rewards/purchases).
- https://vulkk.com/2026/04/17/crimson-desert-abyss-gears-guide-types-tiers-and-sources/
  — Abyss Gear socket counts per equipment type, tier I/II/III/Greater system.
- https://gamingbolt.com/crimson-desert-guide-the-best-armor-sets-and-how-to-get-them
  — Frostcursed, Blackwing and Unyielding Warrior's set acquisition (used to
  corroborate the VULKK detail above).
- https://game8.co/games/Crimson-Desert/archives/587692 (List of Unique
  Weapons) — the single richest acquisition source found: ~50 named weapons
  each with a boss/chest/quest/vendor/starting-kit acquisition line; backbone
  of Section 2.
- https://game8.co/games/Crimson-Desert/archives/582201 (List of All Armor
  Sets) — name/piece index; states sets give no wear-the-whole-set combat
  bonus (corroborates the COMPANION doc's single-source claim, promoting it
  off single-source status), no per-set acquisition text.
- https://game8.co/games/Crimson-Desert/archives/587175 (Best Weapons) —
  handful of named weapons with a short acquisition note each.
- https://game8.co/games/Crimson-Desert/archives/587193 (Best Armor Sets) —
  acquisition notes for Frostcursed, Scorchflame, Blackwing, Fallen Kingdom
  (Kliff), Light of the Battlefield, Official Knight's, Elegant Carmine,
  White Bloodwind (Damiane), Valortread, Ashad (Oongka), and confirms Canta
  Plate is bought from Rhett in Hernand Town.
- https://game8.co/games/Crimson-Desert/archives/594267 (Special Weapons) —
  Mining Knuckledrill, Eastern Witch's Fan, Axe of the Apocalypse (main-story
  completion reward).
- https://game8.co/games/Crimson-Desert/archives/586638 (List of
  Accessories) — ring/earring/necklace/cloak name indexes by category; no
  per-item acquisition text.
- https://game8.co/games/Crimson-Desert/archives/588183 (List of All
  Shields) — stat table only, explicitly states acquisition is not yet
  documented on the page.
- https://game8.co/games/Crimson-Desert/archives/595963 (List of All Damiane
  Armor Sets) — 7 Damiane-only set names and piece-type breakdowns; no
  acquisition text.
- https://game8.co/games/Crimson-Desert/archives/598696 (List of All Oongka
  Armor Sets) — 5 Oongka-only set names and piece-type breakdowns; no
  acquisition text.
- https://game8.co/games/Crimson-Desert/archives/596271 (Best Shields) —
  full acquisition detail for Drake Shield, Ancient Shield, Shield of
  Conviction, Lucon Large Shield, Legion Spearmen's Large Shield.
- https://game8.co/games/Crimson-Desert/archives/590350 (How to Get
  Scorchflame Armor Set) — full 5-piece acquisition detail.
- https://game8.co/games/Crimson-Desert/archives/590132 (How to Get Elegant
  Carmine Leather Armor) — blueprint location, crafting materials, piece
  names (vendor/Trust detail for the boots piece came only from the
  WebSearch snippet of this same URL, not the fetched body — see below).
- https://game8.co/games/Crimson-Desert/archives/583000 (Playable
  Characters) — confirmed starting weapons: Kliff (Sword of the Wolf, Grey
  Wolf Wooden Shield), Damiane (White Wind Rapier, **Absolute Justice
  Greatsword** — i.e. she also wields two-handed swords, refining the
  "rapier+pistol only" characterization in RESEARCH-COMPANION.md), Oongka
  (Orc Blaster, Dekarr Greataxe, Silverwolf Axe).
- https://crimsondeserthub.com/guides/crimson-desert-icons — rarity-tier
  colour names (White/Green/Blue/Purple/Orange). Not on the preferred-source
  list; single-source; flagged accordingly in Section 1.
- https://www.keengamer.com/articles/guides/crimson-desert-10-best-armor-sets-ranked/
  — acquisition summaries (region + notable landmark names) for 10 ranked
  sets: Canta Plate, Fallen Kingdom, Scorchflame, Dark Ringleader's, Icewing
  Plate, Golden Greed, Cursed Soul, Blackwing, Frostcursed, Armor of the
  Shadows.
- https://www.keengamer.com/articles/guides/crimson-desert-how-to-get-plate-armor-of-the-shadows-set/
  — full 5-piece acquisition detail for the Armor of the Shadows / Plate
  Armor of Shadows set.
- https://www.keengamer.com/articles/guides/crimson-desert-best-kuku-weapons-and-gears-guide/
  — the Kilnden Workshop / Kuku crafting system: named Kuku spears and
  elemental-resistance armour, Electro-Mecha Longsword, Ring of Lightning.

Failed direct fetches:
- https://crimsondesertgame.wiki.fextralife.com/Armor+Sets — HTTP 404.
- https://fandomwire.com/all-unique-weapons-in-crimson-desert/ — HTTP 403
  (this source is on the task's preferred list but blocked this session both
  by WebFetch and, unlike gaming.tools, was not retried via curl since it is
  not the domain the task gave a curl workaround for; its Bringer of Balance
  fact is instead carried from RESEARCH-COMPANION.md, which cites this same
  URL from a prior session).
- `curl` against https://crimsondesert.gaming.tools/items/weapons,
  /items/armor/armor, /items/weapons/unique — all returned a Cloudflare
  "Just a moment..." challenge page (effectively HTTP 403) regardless of
  User-Agent/header combination tried.

Facts drawn from WebSearch result snippets only (URL named, page not itself
directly fetched in this session, or the specific sub-fact was not present
in the fetched page's returned text — noted inline in the tables as "(via
WebSearch snippet)"):
- https://www.thegamer.com/crimson-desert-scorchflame-armor-set-location-where-to-find-how-to-unlock-guide/,
  https://gamerant.com/crimson-desert-scorchflame-knight-armor-full-set-locations/
  — corroborate the Scorchflame piece locations fetched directly from Game8.
- https://gamerant.com/crimson-desert-damiane-skirt-location-how-to-get/,
  https://www.gfinityesports.com/article/how-to-get-damianes-white-bloodwind-armor-set-in-crimson-desert
  — corroborate Elegant Carmine / White Bloodwind detail fetched directly
  elsewhere.
- Elegant Carmine Plate Boots — "purchased from the Tailor in Varnia after
  reaching 100 Trust with her" (via WebSearch snippet of the Game8 590132
  page; this specific line did not appear in the directly-fetched body,
  which said only that vendor/Trust detail was missing for the boots).
- A Golden Sword pedestal in the "Vault of Vengeance" puzzle (Spire of
  Stars → Sanctorum of Insight → Secret Garden) — via WebSearch snippet
  naming https://www.powerpyx.com/crimson-desert-vault-of-vengeance-puzzle-solution/
  as its source; single-source, PowerPyx page not independently fetched.
- A Bismuth Spear from "the Well of Enlightenment," obtained after
  defeating a "Bismuth Oreback Crab" boss — via WebSearch snippet; the
  snippet did not clearly attribute this to one of the listed result URLs
  (candidates were egamersworld.com or dropreference.com, neither on the
  preferred list) — treat this fact as **single-source and
  source-uncertain**.

Carried over, not re-fetched this session (see the note at the top of this
file): docs/RESEARCH-COMPANION.md (its own citations: FandomWire for
Bringer of Balance, PowerPyx/Method.gg for Rokade, VULKK/GamingBolt for
Blackwing, KeenGamer for the refinement-levels guide); docs/RESEARCH-MAIN-STORY.md
(its own citations: game8.co/games/Crimson-Desert/archives/586937, 588901,
589366, 590172, gamerant.com/crimson-desert-main-story-quests-chapter-list/,
vulkk.com/2026/04/19/crimson-desert-main-story-walkthrough/ — for the
main-quest-reward gear items in the tables below).

## 1. Item model facts

**Weapon type categories** (the game's own taxonomy, per the Fextralife
index): Bows, Daggers, Firearms, Hand Cannons, One-Handed Weapons, Shields,
Two-Handed Weapons. Source: https://crimsondesertgame.wiki.fextralife.com/Weapons.
Game8's ranged-weapons breakdown further splits "Firearms" into Pistols,
Rifles and Hand Cannons and "Two-Handed" into Spears/Greataxes/Greatswords
(carried from RESEARCH-COMPANION.md, game8.co/games/Crimson-Desert/archives/582200
family of pages, not independently re-fetched this session).

**Weapon types per playable character** — starting kit confirmed this
session (source: https://game8.co/games/Crimson-Desert/archives/583000):
- **Kliff** — Sword of the Wolf (one-handed sword) + Grey Wolf Wooden Shield
  at the start; broader kit per RESEARCH-COMPANION.md (carried, Game8
  archives/583000, same page, general-characterization text) is swords,
  spears, axes, two-handed weapons, shields and bows, plus a grappling
  mechanic.
- **Damiane** — White Wind Rapier + **Absolute Justice Greatsword** at the
  start. This is a refinement of RESEARCH-COMPANION.md's "rapier+pistol
  glass cannon" summary: she is confirmed here to also wield a two-handed
  sword, not only a rapier and firearms. Pistol/firearm use is carried from
  RESEARCH-COMPANION.md (not independently re-verified this session).
- **Oongka** — Orc Blaster (hand cannon) + Dekarr Greataxe + Silverwolf Axe
  at the start, consistent with RESEARCH-COMPANION.md's "fierce heavy melee"
  characterization; confirms hand-cannon use alongside axes/greataxes.

**Rarity tiers:** a five-step colour-coded ladder — White (Common), Green
(Uncommon), Blue (Rare), Purple (Epic), Orange (Legendary) — plus a distinct
"Unknown"-rarity Bracelet group tied to the Axiom bracelets (Axiom, Damiane's
Axiom, Oongka's Axiom; see Section 4). Source:
https://crimsondeserthub.com/guides/crimson-desert-icons — **single-source**,
not on the task's preferred-source list, and RESEARCH-COMPANION.md separately
flagged tier names as "unverified from a single authoritative source," so
treat the exact tier *names* (as opposed to the existence of a rarity system)
with caution.

**Equipment slots:** Headgear, Body/Chest Armor, Gloves, Footwear, Cloak
(armour); plus accessory slots — 2 ring slots, 2 earring slots, 1 necklace
slot, and a separate bracelet slot tied to the Axiom items — per the piece
counts on the Fextralife Accessories page and Game8's accessories list.
Sources: https://crimsondesertgame.wiki.fextralife.com/Accessories,
https://game8.co/games/Crimson-Desert/archives/586638. Weapons and shields
are their own equip slot (one active weapon set + shield/off-hand).

**Abyss Gear as a category:** a distinct highest-tier equipment layer of
modular, movable socketed effects — "Abyss Gears are the main way to
customize your gear," and an effect can be unsocketed and moved from a
less-preferred-looking piece to a preferred one. Socket counts per
equipment type: Headgear 1, Chest Armor 3, Gloves 2, Footwear 2, One-Handed
Weapons 3, Shields 2, Two-Handed Weapons 5, Ranged Weapons 5; Cloaks,
accessories and Daggers carry no sockets. Some sockets are pre-unlocked,
others must be paid for at a Witch (rising cost per additional socket on
the same piece). Generic Abyss Gears come in four tiers — I, II, III and
Greater — with "Greater" being the strongest but carrying limited durability
that breaks after enough uses; two Tier I cores fuse into one Tier II at a
Witch, and two Tier II fuse into one Tier III (Tier III is the highest
permanent tier). Source: https://vulkk.com/2026/04/17/crimson-desert-abyss-gears-guide-types-tiers-and-sources/.
Broader Abyss Gear framing (crafted from Abyssal-zone materials and Abyss
boss drops) is carried from RESEARCH-COMPANION.md.

**Refinement levels and material tiers:** carried from
RESEARCH-COMPANION.md (KeenGamer refinement guide, not re-fetched this
session) — every equipment piece (weapons, armour, shields, and per
KeenGamer's guide-listing text this session, jewelry/accessories too) has
**10 Refinement levels**, costing only raw materials (no gold/silver).
Levels 1-2 use common ores/pelts, level 3 needs region-specific drops,
level 4 needs boss-only materials, and beyond level 4 only Abyss
artifacts/boss drops progress it further.

**Set bonuses:** armour sets do **not** grant a stat bonus for wearing the
full matched set — confirmed by two independent sources this session (Game8
List of All Armor Sets, archives/582201: "they do not provide set bonuses
when equipped. Armor sets mostly impact cosmetics"; RESEARCH-COMPANION.md
carried the same claim single-source from an earlier session), so this is
no longer single-source. There is a narrower, separate mechanic: some
*specific* sets carry their own named non-combat set effect once fully
worn — e.g. the Camouflage Set's civilian-disguise effect, or Ator's Will's
"Daze Immunity / Antumbra Disguise / Lightning Resistance" (see Section 3)
— which is not a generic "full-set bonus" system but a per-set special
property. Source for the Fextralife framing ("grants different types of
buffs at different levels," "can be repaired or upgraded"):
https://crimsondesertgame.wiki.fextralife.com/Armor.

**Kuku crafting (the Kilnden Workshop):** unlocked Chapter 4+, run by a
dwarf NPC named Grimnir; transforms base weapons/armour into
indestructible, high-end gear via blueprints tied to the Witch-questline
Sanctums (Chapter 5+) and named material drops (e.g. Bismuth Ore, Small
Batteries, Electrical Components, Sanctum-puzzle "Power Cores"). Produces
named items not found any other way — see Sections 2-4 for the specific
Kuku items. Source: https://www.keengamer.com/articles/guides/crimson-desert-best-kuku-weapons-and-gears-guide/
— **single-source** for the Kilnden Workshop/Kuku system as a whole.

## 2. Unique and named weapons

85 rows. Acquisition detail is **single-sourced from Game8 (List of Unique
Weapons, archives/587692)** unless a second URL is also listed in the last
column — that page is by far the richest single acquisition source found,
so most rows below rest on it alone. Weapon type is left blank where no
source stated it. "G8-587692" etc. below are shorthand for the archive
numbers listed in Sources; full URLs are `https://game8.co/games/Crimson-Desert/archives/<number>`.

| Name | Weapon type | Character | Rarity | Acquisition kind | Acquisition detail | Region | URL(s) |
|---|---|---|---|---|---|---|---|
| Circling Moon | | | | boss drop | Defeat Full Moon Reaper in the Lunar Judgement quest | | G8-587692 |
| Crow Whisperer | | | | boss drop; also main quest reward | Defeat Hexe Marie in the Veiled Witch quest; RESEARCH-MAIN-STORY.md lists it as a reward of the same "Veiled Witch" quest arc | | G8-587692; main-story |
| Frostfang | | | | boss drop | Defeat Gwen Kraber, in Roothold | Hernand (Roothold) | G8-587692 |
| Golden Vanguard | Two-Handed | | | boss drop; also main quest reward | Defeat Gregor, the Halberd of Carnage, in the Ashen Steps quest (G8-587692); RESEARCH-MAIN-STORY.md separately lists it as a chapter-total reward of the "A Fleeting Dream" chapter — quest-name mismatch, see Gaps | | G8-587692; Fextralife Unique Weapons; main-story |
| Grasping Moon | | | | boss drop | Defeat Half Moon Reaper in the Lunar Judgement quest | | G8-587692 |
| Sanguine Knell | | | | boss drop | Defeat Mazzul in the One Step Ahead quest | | G8-587692 |
| Sword of the Lord | One-Handed | | | boss drop / starting kit (conflict) | G8-587692: defeat Hornsplitter in the End of Greed quest. G8-587175 (Best Weapons) separately calls it "a starting weapon obtained with Abyss Gear" — see Gaps | | G8-587692; G8-587175; Fextralife Weapons |
| Black Sun | Shield | | | chest | Beneath Demeniss Castle Bridge | Demeniss | G8-587692; Fextralife Weapons/Shields |
| Blazing Shield | Shield | | | chest | Unmarked cave in Crimson Desert | Crimson Desert | G8-587692; Fextralife Weapons/Shields |
| Crimson Warden's Bow | Bow | | | chest | Golden Plains treasure chest | Demeniss (Golden Plains) | G8-587692; Fextralife Weapons |
| Darkbringer | Two-Handed | | | chest | White Wastes Sanctuary, Pailune; Best Weapons page: "early acquisition via exploration" | Pailune | G8-587692; G8-587175 |
| Demenissian Hero's Musket | Firearm | | | chest | Lost Song Cave | | G8-587692; Fextralife Weapons |
| Diverging Moon | | | | chest | Southern Court, after its liberation | | G8-587692 |
| Drake Shield | Shield | | | boss drop / chest | Defeat Tristan the Flame Knight and liberate Flame Knight Castle (Flame Knight faction quest); chest is past two Demenissian Soldiers up the stairs | | G8-587692; G8-596271; Fextralife Weapons/Shields |
| Electro-Mecha Spear | Two-Handed | | | chest | Regent's Rise | | G8-587692 |
| Elite Vanguard | | | | chest | Cave in Bowsprit Cape | | G8-587692 |
| Frozen Anguish | | | | chest | Spire of Frost | | G8-587692 |
| Fated Shadow | | | | boss drop | Defeating Goyen, in Chapter 9 | | G8-587692 |
| Golden Shield | Shield | | | chest | Silentwater Grotto | | G8-587692; Fextralife Weapons/Shields |
| Goblin King's Treasure Dagger | Dagger | | | chest | Beneath Mudridge Cabin | | G8-587692; Fextralife Weapons/Unique Weapons |
| Hwando | Two-Handed | | | chest | Lioncrest Manor | | G8-587692; Fextralife Unique Weapons |
| Knightlord's Sword | One-Handed | | | chest | Crescent Lake, in the Dark Justiciar quest | | G8-587692; Fextralife Weapons |
| Shield of Conviction | Shield | | | chest | Bell tower of the Church of Calphade | Hernand (Calphade) | G8-587692; G8-596271; Fextralife Weapons/Shields |
| Shield of Sacrifice | Shield | | | chest | Cave in the Thornbriar Mountains | | G8-587692; Fextralife Weapons/Shields |
| Sigremon Greataxe | Two-Handed | | | chest | Silver Wolf Mountain | Pailune | G8-587692 |
| Soul Spear | Two-Handed | | | chest | Antumbra Ritual Grounds | | G8-587692; Fextralife Unique Weapons |
| Axe of the Apocalypse | Two-Handed (Axe) | | | quest reward | Complete the main story (one-time use, 99999 ATK) | | G8-587692; G8-594267 |
| Ignir | Two-Handed | | | quest reward; also main quest reward | Completing Chapter 7 (both G8-587692 and RESEARCH-MAIN-STORY.md agree) | | G8-587692; Fextralife Unique Weapons; main-story |
| Melted Ambition | One-Handed | | | boss drop | Defeat Myurdin in the Decisive Battle main quest | | G8-587692; Fextralife Unique Weapons |
| Balgran Shield | Shield | | | edition bonus | Deluxe Edition purchase | | G8-587692; Fextralife Weapons/Shields |
| Khaled Shield | Shield | | | pre-order bonus | Pre-order bonus | | G8-587692; Fextralife Weapons/Shields |
| Grey Wolf Bow | Bow | Kliff | | default | Unlocked by default for Kliff | | G8-587692; Fextralife Weapons |
| Grey Wolf Wooden Shield | Shield | Kliff | | default | Unlocked by default for Kliff; confirmed as his starting shield | | G8-587692; G8-583000; Fextralife Weapons/Shields |
| Orc Blaster | Hand Cannon | Oongka | | default | Unlocked by default for Oongka; confirmed as his starting weapon | | G8-587692; G8-583000; Fextralife Weapons |
| Silverwolf Axe | One-Handed (Axe) | Kliff | | boss drop (key item) | Defeat Myurdin in the Decisive Battle main quest; Kliff's key item | | G8-587692 |
| Sword of the Wolf | One-Handed | Kliff | | default | Unlocked by default for Kliff; confirmed as his starting weapon | | G8-587692; G8-583000 |
| Caliburn's Mercy Pistol | Firearm (Pistol) | Damiane | | location | Found at a table in Fort Musket | | G8-587692; Fextralife Weapons |
| Delesyian Ornamental Shield | Shield | | | boss drop | Defeat Storm Crusher in the Brave New World quest | Delesyia | G8-587692; Fextralife Weapons/Shields (as "Delesyian Dagger" category differs — see Gaps on naming) |
| Golden Fire | Hand Cannon | | | boss drop; also main quest reward | Defeat Golden Star in the Foreboding Shadow quest (G8-587692); RESEARCH-MAIN-STORY.md separately names "Golden Fire" among a chapter's unlock bundle alongside "Golden Star Power Core" | | G8-587692; Fextralife Weapons; main-story |
| Guidance of Dark Pursuit | | | | boss drop | Defeat "Antumbra's Staff" | | G8-587692 |
| Leofric Musket | Firearm | | | quest reward | Completing the Greater Firepower quest | | G8-587692; Fextralife Weapons |
| Marni Musket | Firearm | | | boss drop | Defeat Storm Crusher in the Brave New World quest | | G8-587692; Fextralife Weapons |
| Mechanical Clockwork Blaster | Hand Cannon | | | boss drop | Defeat Thunder Tank in the Brave New World quest | | G8-587692; Fextralife Weapons |
| Tauria Curved Sword | One-Handed | | | boss drop; also main quest reward | G8-587692: defeat Crowcaller in a quest it names "Black and White." RESEARCH-MAIN-STORY.md names the same boss (Crowcaller) but a different quest/chapter name ("Toward the Nest," Chapter 12) — see Gaps | | G8-587692; main-story |
| Thorn of Dark Pursuit | | | | boss drop | Defeat "Antumbra's Spear" | | G8-587692 |
| Volcanic Blaster | Hand Cannon | | | boss drop | Defeat Ravok in the Master of the Wetlands quest | | G8-587692; Fextralife Weapons |
| Lightningblade of Greed | | | | enemy drop | Dropped by Sizlek the Insatiable | | G8-587692 |
| Savage Sawblade | | | | enemy drop | Dropped by Giath | | G8-587692 |
| Shackle of Might | One-Handed | | | enemy drop; also main quest reward | G8-587692: defeat Fortain, the Cursed Knight. RESEARCH-MAIN-STORY.md separately lists it as a chapter-total reward of the "A Fleeting Dream" chapter | | G8-587692; Fextralife Unique Weapons; main-story |
| Chillfallen Sword | One-Handed | | | | not stated | | G8-587692; Fextralife Weapons |
| Electro-Mecha Longsword | Two-Handed | | | boss drop | Defeat Machina Knight in Marni's Outpost; tied into the Kuku/Kilnden Workshop system per KeenGamer | | G8-587692; KeenGamer Kuku guide |
| Golden-Knotted Ancestral Bow | Bow | | | | not stated | | G8-587692; Fextralife Weapons |
| Greathammer of Fire | Two-Handed | | | location | Valley in Trader's Expanse | | G8-587692 |
| Hollow Visage | One-Handed | | | location | Dawn Cave | | G8-587692; Fextralife Unique Weapons |
| Hound | | | | boss drop | Defeat Hemon Beindel | | G8-587692 |
| Noble Man's Bow | Bow | | | | not stated (Best Weapons page: "high attack bow obtainable through exploration") | | G8-587692; G8-587175; Fextralife Weapons |
| Righteous Verdict | Two-Handed | | | location | Demeniss Ancestors' Ruins; Best Weapons page: obtainable early with some exploration | Demeniss | G8-587692; G8-587175 |
| Sior Blaster | Hand Cannon | | | location | Bowsprit Cape | | G8-587692; Fextralife Unique Weapons |
| Survivor's Solitude | One-Handed | | | location | Death's Grip Cavern | | G8-587692; Fextralife Unique Weapons |
| Sword of Starlight | | | | quest reward | Completing "Where Starlight Converges" | | G8-587692 |
| The Grove's Thorn | One-Handed | | | not stated; also main quest reward | RESEARCH-MAIN-STORY.md lists it in Chapter 12's unlock bundle alongside Blackwing Leather Armor and Tauria Curved Sword | | G8-587692; Fextralife Unique Weapons; main-story |
| Twisted Verdict | | | | boss drop | Defeat Corrupted Caliburn, in Chapter 12 | | G8-587692 |
| Vessel of Dark Pursuit | | | | | not stated | | G8-587692 |
| Vow of the Dead King | Two-Handed (Spear) | | | location | Frostveiled Castle Ruins; Best Weapons page: early-game, requires exploration, comes with 3 Abyss Gear sockets pre-filled | | G8-587692; G8-587175 |
| Wolf's Fang | One-Handed | | | | not stated | | G8-587692; Fextralife Weapons |
| Rhinard Cannon | Hand Cannon (type conflict, see Gaps) | | | | Best Weapons page: "early game option with projectile stagger ability," grouped under a "Spears" heading there though Fextralife lists it as a Hand Cannon | | G8-587175; Fextralife Weapons |
| Warspike Bow | Bow | | | | "Available early game" | | G8-587175; Fextralife Weapons |
| Combat God's Plate Gloves | Gloves (armour, not a weapon — Game8 lists it under an "Unarmed" weapon-style category) | | | | "best in slot gloves for unarmed combat," Lightning Affinity | | G8-587175 |
| Mining Knuckledrill | One-Handed (utility) | | | | not stated; 30% chance to mine an extra ore per hit | | G8-594267; Fextralife Weapons |
| Eastern Witch's Fan | One-Handed (Fan) | | | | not stated; clears local bad weather (10-minute cooldown), wind/lightning-themed moveset | | G8-594267; Fextralife Weapons |
| Golden Sword | One-Handed | | | puzzle reward | Pedestal in the "Vault of Vengeance" puzzle: Spire of Stars → Sanctorum of Insight → Secret Garden | | (via WebSearch snippet) powerpyx.com/crimson-desert-vault-of-vengeance-puzzle-solution/; Fextralife Weapons |
| Bismuth Spear | Two-Handed (Spear) | | | boss drop | Well of Enlightenment, after defeating a "Bismuth Oreback Crab" boss — **single-source, exact source page uncertain** | | (via WebSearch snippet, source unconfirmed) |
| Kuku Flame Spear | Two-Handed (Spear) | | | craft | Kilnden Workshop (Grimnir), Chapter 4+; fire explosion hitting all nearby enemies on every swing; no durability | | KeenGamer Kuku guide |
| Kuku Lightning Spear | Two-Handed (Spear) | | | craft | Kilnden Workshop; lightning effect with a 10-charge system, 1 charge/2s regen | | KeenGamer Kuku guide |
| Kuku Bismuth Spear | Two-Handed (Spear) | | | craft | Kilnden Workshop; stacking slow + damage-taken debuff, up to 10 stacks | | KeenGamer Kuku guide |
| Bringer of Balance | | | | chest/altar | South of the "Forbearers Barons" map label, west of Tashelp; through a trap door into an underground ruin, to an altar | | carried from RESEARCH-COMPANION.md, cites fandomwire.com/all-unique-weapons-in-crimson-desert/ (blocked, HTTP 403, this session) |
| Acorn Mace | One-Handed (Mace) | | | | not stated | | Fextralife Weapons/Unique Weapons |
| Fallen Kingdom's Rapier | One-Handed (Rapier) | Damiane (rapiers are her weapon type) | | | not stated | | Fextralife Unique Weapons |
| Fallen Kingdom's Sword | One-Handed | | | | not stated | | Fextralife Unique Weapons |
| Legionary's Gladius | One-Handed | | | | not stated | | Fextralife Unique Weapons |
| Ring of the Earth | One-Handed (per Fextralife's weapon-page grouping — name suggests an accessory; flagged in Gaps) | | | | not stated | | Fextralife Unique Weapons |
| Volono Sword | One-Handed | | | | not stated | | Fextralife Unique Weapons |
| Sorcerer's Staff | Two-Handed | | | | not stated | | Fextralife Unique Weapons |
| Reventine Priest's Spear | Two-Handed (Spear) | | | | not stated | | Fextralife Unique Weapons |
| Rokade (legendary horse — a mount, not equipment; listed for completeness only, excluded from row counts) | — | Kliff | | tame | Southern Hernand, Steel Mountains, near the Spire of Insight, in Grace Estate; sneak up, trigger taming minigame | Hernand | carried from RESEARCH-COMPANION.md (PowerPyx, Method.gg) |

## 3. Armour sets and pieces

34 sets, ~130 piece rows (well past the 20-set/80-piece target). One table,
set name repeated per piece row. "Piece name" is filled only where a source
gave a name different from "`<Set name> <Slot>`"; most sets follow that
pattern exactly, so the column is mostly blank by design, not by omission.

| Set name | Piece (slot) | Piece name if different | Acquisition kind | Acquisition detail | Region | URL(s) |
|---|---|---|---|---|---|---|
| Frostcursed (Kliff; formerly worn by Skull Knight, the Frostwarden) | Head | | chest | Southern Chattering Rocks Ancient Ruins, hidden behind vines | Demeniss (NW) | VULKK; GamingBolt; KeenGamer 10 best |
| Frostcursed | Body | | chest | Misthard Cave, north of Deadfire Mountain; break a destructible wall past waterfalls | Demeniss | VULKK; GamingBolt |
| Frostcursed | Cloak | | chest | Sanctum of Expiation | Demeniss (NW) | VULKK; GamingBolt |
| Frostcursed | Gloves | | chest | Lunar Spirit Grotto, Denn River; pass through a waterfall | Demeniss (N) | VULKK; GamingBolt |
| Frostcursed | Feet | | chest | Well of Tragedy cave, Denn River; pass through a waterfall | Demeniss (N) | VULKK; GamingBolt |
| Blackwing (Kliff; leather+plate, formerly worn by the Crowcaller) | Head | Blackwing Mask | boss drop; also main quest reward | Reward for defeating Crowcaller (VULKK/GamingBolt/KeenGamer say Chapter 5; RESEARCH-MAIN-STORY.md's chapter table instead places the Crowcaller fight and this reward in Chapter 12, "Toward the Nest" — direct chapter conflict, see Gaps) | | VULKK; GamingBolt; main-story |
| Blackwing | Body | Blackwing Leather Armor | boss drop; also main quest reward | Same Crowcaller reward and chapter conflict as the mask above | | VULKK; GamingBolt; main-story |
| Blackwing | Cloak | Leather Cloak | chest | Shed in Pororin Village, after completing "The Unreachable Village" quest | Hernand (Pororin) | VULKK; GamingBolt |
| Blackwing | Gloves | Leather Gloves | chest | Sanctum of Penitence, upper floor, accessible through a floor hole | | VULKK; GamingBolt |
| Blackwing | Feet | Leather Boots | chest | House of Healing roof, via an exterior ladder and a leap to a neighboring tower | | VULKK; GamingBolt |
| Unyielding Warrior's (worn by Calphade's finest warriors) | Head | | craft | Blacksmith craft using "Plate Armors of the World Vol. 3" manual + iron and copper ore | Hernand (Calphade) | VULKK |
| Unyielding Warrior's | Feet | | craft | Same manual/materials as the helm | Hernand (Calphade) | VULKK |
| Unyielding Warrior's | Body | | craft | Blacksmith craft, manual + ore | Hernand (Calphade) | VULKK |
| Unyielding Warrior's | Cloak | | vendor | Village smith after completing Chapter 5, or the Calphedon armor smith | Hernand (Calphade) | VULKK |
| Ator's Will (Antumbra faction) | Head | Ator's Will Helm | quest reward | "Archon of Antumbra" quest | | Fextralife |
| Ator's Will | Body | Ator's Will Cloth Armor | quest reward | "Archon of Antumbra" quest | | Fextralife |
| Ator's Will | Gloves | Ator's Will Leather Gloves | quest reward / craft | "Archon of Antumbra" quest, or craft with "Leather Armors of the World, Vol. II" | | Fextralife |
| Ator's Will | Feet | Ator's Will Leather Boots | quest reward / craft | "Archon of Antumbra" quest, or craft with "Leather Armors of the World, Vol. III" | | Fextralife |
| Camouflage | Body | Camouflage Outfit | vendor | "All the smugglers of Pywel sell this set" | | Fextralife |
| Camouflage | Cloak | Disguise Cloak | vendor | Same smuggler vendors | | Fextralife |
| Crimson Chaser (belongs to Regina, a former Greymane turned Crimson Warden) | Head | Crimson Chaser Plate Helm | chest | North of the Golden Fields | | Fextralife |
| Crimson Chaser | Body | Crimson Chaser Mail | quest reward | "Corrupted Greymane" faction quest | | Fextralife |
| Crimson Chaser | Cloak | Crimson Chaser Chain Cloak | chest | South of the Golden Fields | | Fextralife |
| Crimson Chaser | Gloves | Crimson Chaser Chain Gloves | chest | West of the Golden Fields | | Fextralife |
| Fallen Kingdom | Head | Leather Helm of the Fallen Kingdom | chest | Scattered Hernand treasure chests; KeenGamer names West Hernand/NW ruins — Icemoor Castle Ruins, Nightstorm Cave, Starlight Storm Cave, Frozen Soul Cave, Sanctum of Benediction (piece-to-chest mapping not given) | Hernand | Fextralife; KeenGamer 10 best |
| Fallen Kingdom | Body | Leather Armor of the Fallen Kingdom | chest | See above | Hernand | Fextralife; KeenGamer 10 best |
| Fallen Kingdom | Gloves | Plate Gloves of the Fallen Kingdom | chest | See above | Hernand | Fextralife; KeenGamer 10 best |
| Fallen Kingdom | Feet | Plate Boots of the Fallen Kingdom | chest | See above | Hernand | Fextralife; KeenGamer 10 best |
| Fallen Kingdom | Cloak | Leather Cloak of the Fallen Kingdom | chest | See above | Hernand | Fextralife; KeenGamer 10 best |
| Cursed Soul | Head | Plate Helm of Cursed Soul | chest | Hidden in treasure chests generally (Fextralife); KeenGamer names Demeniss locations — Anvil Hill Gust Cave, Windrift Cave, Shadowwolf Cave, Cemetery in Riverbed Terrace, Demenissian Ruins (piece-to-chest mapping not given) | Demeniss | Fextralife; KeenGamer 10 best |
| Cursed Soul | Body | Plate Armor of Cursed Soul | chest | See above | Demeniss | Fextralife; KeenGamer 10 best |
| Cursed Soul | Gloves | Plate Gloves of Cursed Soul | chest | See above | Demeniss | Fextralife; KeenGamer 10 best |
| Cursed Soul | Cloak | Plate Cloak of Cursed Soul | chest | See above | Demeniss | Fextralife; KeenGamer 10 best |
| Cursed Soul | Feet | Plate Boots of Cursed Soul | chest | See above | Demeniss | Fextralife; KeenGamer 10 best |
| Baltheon Plate | Head | Baltheon Plate Helm | vendor | Rhett, Hernand Equipment Shop | Hernand | Fextralife |
| Baltheon Plate | Body | Baltheon Plate Armor | vendor | Rhett, Hernand Equipment Shop | Hernand | Fextralife |
| Baltheon Plate | Gloves | Baltheon Plate Gloves | vendor | Rhett, Hernand Equipment Shop | Hernand | Fextralife |
| Belkandor Plate (Kliff, Oongka) | Head | Belkandor Plate Helm | craft | Craft all 5 pieces from their respective blueprints (locations not given) | Demeniss, Delesyia, Crimson Desert | Fextralife; VULKK |
| Belkandor Plate | Body | Belkandor Plate Armor | craft | Same | Demeniss, Delesyia, Crimson Desert | Fextralife; VULKK |
| Belkandor Plate | Gloves | Belkandor Plate Gloves | craft | Same | Demeniss, Delesyia, Crimson Desert | Fextralife; VULKK |
| Belkandor Plate | Feet | Belkandor Plate Boots | craft | Same | Demeniss, Delesyia, Crimson Desert | Fextralife; VULKK |
| Belkandor Plate | Cloak | Belkandor Plate Cloak | craft | Same | Demeniss, Delesyia, Crimson Desert | Fextralife; VULKK |
| Duskfang Leather | Body | Duskfang Leather Armor | chest | "Hidden in different Treasure Chests in Hernand" (no per-piece locations) | Hernand | Fextralife |
| Duskfang Leather | Cloak | Duskfang Leather Cloak | chest | Same | Hernand | Fextralife |
| Duskfang Leather | Gloves | Duskfang Leather Gloves | chest | Same | Hernand | Fextralife |
| Grey Wolf Leather (Kliff/Pailune-Greymane themed) | Body | Grey Wolf Leather Armor | craft / vendor | Craft with "Leather Armors of the World, Vol. IV," or buy from Lola (Pailune Tailor's Shop) or Diederik (Greymane Camp) | Pailune / Greymane Camp | Fextralife |
| Grey Wolf Leather | Gloves | Grey Wolf Leather Gloves | craft / vendor | Same manual/vendors | Pailune / Greymane Camp | Fextralife |
| Grey Wolf Leather | Feet | Grey Wolf Leather Boots | craft / vendor | Craft with "Leather Armors of the World, Vol. II," or same vendors | Pailune / Greymane Camp | Fextralife |
| Grey Wolf Leather | Cloak | Grey Wolf Leather Cloak | craft / vendor | Craft with Vol. IV, or same vendors | Pailune / Greymane Camp | Fextralife |
| Helfryn Leather (belongs to Gabriel Caliburn, Duke of Demeniss) | Body | Helfryn Leather Armor | chest | "Hidden in Treasure Chests inside Demeniss" (no per-piece locations) | Demeniss | Fextralife |
| Helfryn Leather | Cloak | Helfryn Leather Cloak | chest | Same | Demeniss | Fextralife |
| Helfryn Leather | Gloves | Helfryn Leather Gloves | chest | Same | Demeniss | Fextralife |
| Helfryn Leather | Feet | Helfryn Leather Boots | chest | Same | Demeniss | Fextralife |
| Dulone Plate | Feet | Dulone Plate Boots | craft | "Plate Armors of the World, Vol. IV" | | Fextralife |
| Dulone Plate | Gloves | Dulone Plate Gloves | craft | Same manual | | Fextralife |
| Chelcia Plate (belonged to "Chelcia, the Lion Knight") | Head | Chelcia Plate Helm | vendor | Demeniss Castle Contribution Shop | Demeniss | Fextralife |
| Chelcia Plate | Body | Chelcia Plate Armor | vendor | Demeniss Castle Contribution Shop | Demeniss | Fextralife |
| Chelcia Plate | Cloak | Chelcia Plate Cloak | vendor | Demeniss Castle Contribution Shop | Demeniss | Fextralife |
| Chelcia Plate | Feet | Chelcia Plate Boots | craft / vendor | Craft with "Plate Armors of the World, Vol. II," or buy from Kathor (Demeniss Equipment Shop) or Tranan (Greymane's Camp) | Demeniss | Fextralife |
| Canta Plate (Hernand starter set) | Full set | | vendor | Rhett, Hernand Equipment Shop/Smithy, Hernand Town, after defeating Matthias (Chapter 1) | Hernand | Game8 587193; KeenGamer 10 best |
| Official Knight's (Damiane; also a main-quest reward as "Official Knight armor set") | Head | Plate Helm | main quest reward | Reward of the "A Fleeting Dream" quest (boss Bastier), per RESEARCH-MAIN-STORY.md | | Game8 595963; main-story |
| Official Knight's | Body | Plate Armor | main quest reward | Same quest | | Game8 595963; main-story |
| Official Knight's | Gloves | Leather Gloves | main quest reward | Same quest | | Game8 595963; main-story |
| Official Knight's | Feet | Leather Boots | main quest reward | Same quest | | Game8 595963; main-story |
| Executioner of Darkness (Damiane) | Head | Plate Helm | | not stated | | Game8 595963 |
| Executioner of Darkness | Gloves | Plate Gloves | | not stated | | Game8 595963 |
| Executioner of Darkness | Feet | Plate Boots | | not stated | | Game8 595963 |
| Wanderer of Faith (Damiane) | Head | Plate Helm | | not stated | | Game8 595963 |
| Wanderer of Faith | Body | Leather Armor | | not stated | | Game8 595963 |
| Wanderer of Faith | Gloves | Leather Gloves | | not stated | | Game8 595963 |
| Wanderer of Faith | Feet | Leather Boots | | not stated | | Game8 595963 |
| Autumn Banquet (Damiane) | Head | Plate Helm | | not stated | | Game8 595963 |
| Autumn Banquet | Body | Leather Armor | | not stated | | Game8 595963 |
| Autumn Banquet | Gloves | Leather Gloves | | not stated | | Game8 595963 |
| Autumn Banquet | Feet | Leather Boots | | not stated | | Game8 595963 |
| Elegant Carmine (Damiane; craftable, blueprint(s) shared across pieces) | Head | Elegant Carmine Plate Helm | craft | Blueprint in the office at Timeworn Ruins Ironcrawler Station, Tashkalp | Crimson Desert (Tashkalp) | Game8 590132 |
| Elegant Carmine | Body | Elegant Carmine Leather Armor ("Carmine Banquet Armor Blueprint") | craft | Blueprint at Jungle Ruins, east of the Red River (Delesyia/Crimson Desert jungle border), via Force Palm on a fake wall; craft with Turnali in Hernand using Thin Hide x10, Thick Hide x5, Sturdy Hide x2, Gold Ore x2, Garnet x2 | Delesyia/Crimson Desert border | Game8 590132 |
| Elegant Carmine | Cloak | Elegant Carmine Leather Cloak | craft | Blueprint on a bookshelf at Marni's Masterium, southern Delesyia coast; only reachable via a Chapter 11 ("Truth and Reality") teleport | Delesyia | Game8 590132 |
| Elegant Carmine | Gloves | Elegant Carmine Plate Gloves | craft | Blueprint on a bookshelf at Dewhaven Keep | Delesyia | Game8 590132 |
| Elegant Carmine | Feet | Elegant Carmine Plate Boots | vendor | Purchased from the Tailor in Varnia after reaching 100 Trust with her — **this line came only from a WebSearch snippet of the Game8 page, not the directly-fetched body**, see Sources | Crimson Desert (Varnia) | (via WebSearch snippet) Game8 590132 |
| Light of the Battlefield (Damiane) | Full set | | | Not located; described only as giving "highest defense across most of her equipment" with Fortification/Aegis/Vitality Abyss Gear. Note: a same-named "Light of the Battlefield" **earring** also exists as a separate accessory (Section 4) — likely coincidental naming, not the same item | | Game8 587193 |
| Demenissian (Damiane, "elite uniform") | Body | Leather Armor | | not stated | Demeniss | Game8 595963 |
| Demenissian | Gloves | Leather Gloves | | not stated | Demeniss | Game8 595963 |
| Demenissian | Feet | Leather Boots | | not stated | Demeniss | Game8 595963 |
| White Bloodwind (Damiane) | Head | White Bloodwind Plate Helm | Trust reward | NPC Olanelle, Tailor's Shop, Demeniss; Trust 100 (after her Request Commission, which grants 50 Trust) | Demeniss | VULKK |
| White Bloodwind | Body | White Bloodwind Leather Armor | Trust reward | NPC Stefan Lanford, Calphade Castle (Hernand), later Musket First Outpost (NE Demeniss); Trust 100; requires reaching the end of Chapter 6 | Hernand/Demeniss | VULKK |
| White Bloodwind | Cloak | White Bloodwind Cloth Cloak | craft | Recipe "Cloth Armors of the World, Vol. I," bought at the Tailor Shop in Hernand Town | Hernand | VULKK |
| White Bloodwind | Gloves | White Bloodwind Plate Gloves | Trust reward | NPC Chief Monk, Jijeong Temple (Serpent Marsh, between Demeniss/Delesyia); Trust 100; **potentially missable** — the Chief Monk stops spawning after Chapter 9 if not maxed first | Serpent Marsh | VULKK |
| White Bloodwind | Feet | White Bloodwind Leather Boots | Trust reward | NPC Polan (Pororin chief), at Florindale or his house in Pororin; Trust 100; ideally after the "Children of the Woods" quest | Hernand (Pororin) | VULKK |
| Ashad Plate (Oongka) | Head | | boss drop | "Defeat specific bosses throughout Pailune and Demeniss" (vague, no names given) | Pailune, Demeniss | Game8 598696; VULKK; Game8 587193 |
| Ashad Plate | Body | | boss drop | Same | Pailune, Demeniss | Game8 598696; VULKK |
| Ashad Plate | Gloves | | boss drop | Same | Pailune, Demeniss | Game8 598696; VULKK |
| Ashad Plate | Feet | | boss drop | Same | Pailune, Demeniss | Game8 598696; VULKK |
| Ashad Plate | Cloak | | boss drop | Same | Pailune, Demeniss | Game8 598696; VULKK |
| Ashen Wolf's Leather (Oongka) | Body | | | not stated | | Game8 598696 |
| Ashen Wolf's Leather | Gloves | | | not stated | | Game8 598696 |
| Ashen Wolf's Leather | Feet | | | not stated | | Game8 598696 |
| Ashen Wolf's Leather | Cloak | | | not stated | | Game8 598696 |
| Valortread Plate (Oongka) | Head | | | not stated; includes Gourmet/Aegis/Fortification Abyss Gear | | Game8 598696; Game8 587193 |
| Valortread Plate | Body | | | not stated | | Game8 598696 |
| Valortread Plate | Gloves | | | not stated | | Game8 598696 |
| Valortread Plate | Feet | | | not stated | | Game8 598696 |
| Valortread Plate | Cloak | | | not stated | | Game8 598696 |
| Solas Plate (Oongka) | Head | | | not stated. Note: an "Eclipsed Solas Plate Gloves" item exists as a separate main-quest reward (the "A Fleeting Dream" quest per RESEARCH-MAIN-STORY.md) but this base set's own list has no Gloves piece — likely an "Eclipsed" recolor/variant of a Solas Plate glove piece not otherwise documented, see Gaps | | Game8 598696 |
| Solas Plate | Body | | | not stated | | Game8 598696 |
| Solas Plate | Feet | | | not stated | | Game8 598696 |
| Solas Plate | Cloak | | | not stated | | Game8 598696 |
| Scorchflame / Scorchflame Knight (Kliff) | Head | Scorchflame Plate Helmet | chest | Stonewell Farm, NE Demeniss; climb the building's side to the upper floor | Demeniss | Game8 590350; KeenGamer 10 best |
| Scorchflame | Body | Scorchflame Plate Armor | chest | Golden Trading Post, north Demeniss; through a rotating wooden door, Stab through a waterfall | Demeniss | Game8 590350 |
| Scorchflame | Gloves | Scorchflame Plate Gloves | chest | 2nd waterfall north of Rocca's Hill | Demeniss | Game8 590350 |
| Scorchflame | Feet | Scorchflame Leather Boots | chest | Cascade Grotto, Nas River (Hernand/Demeniss border); Stab through a waterfall | Hernand/Demeniss border | Game8 590350 |
| Scorchflame | Cloak | Scorchflame Plate Cloak | boss drop / chest | Silent Falls Hideout, near the Hills of No Return; boss Grave Walker (drops Insight I and Vigor I Abyss Gear); Force Palm on a wall | Hernand/Demeniss border | Game8 590350 |
| Icewing Plate | (piece unspecified) | | boss drop | Defeat Gwen Kraber at the Eldertree | Hernand | KeenGamer 10 best (single-source) |
| Icewing Plate | (piece unspecified) | | quest reward | Completing all 15 Sanctums in the Witches questline | | KeenGamer 10 best (single-source) |
| Icewing Plate | (pieces unspecified, exploration) | | chest | Claggy Chasm, Sanctum of Solace, Cave of the Ancients (3 locations, piece mapping not given) | | KeenGamer 10 best (single-source) |
| Golden Greed | (piece unspecified) | | chest | Venomblade Grotto | | KeenGamer 10 best (single-source) |
| Golden Greed | (piece unspecified) | | chest | Arehaze Cave | | KeenGamer 10 best (single-source) |
| Golden Greed | (piece unspecified) | | chest | Sanctum of Renunciation | | KeenGamer 10 best (single-source) |
| Golden Greed | (piece unspecified) | | chest | Gale of Judgement Cave | | KeenGamer 10 best (single-source) |
| Golden Greed | (piece unspecified) | | chest | Bursada Castle Ruins | | KeenGamer 10 best (single-source) |
| Dark Ringleader's | (piece unspecified) | | chest | Echoing Tunnel, West Hernand | Hernand | KeenGamer 10 best (single-source) |
| Dark Ringleader's | (piece unspecified) | | chest | Cloudmist Cave, West Hernand | Hernand | KeenGamer 10 best (single-source) |
| Dark Ringleader's | (piece unspecified) | | chest | Shadowheart Grotto, West Hernand | Hernand | KeenGamer 10 best (single-source) |
| Dark Ringleader's | (piece unspecified) | | chest | Blade Cavern, West Hernand | Hernand | KeenGamer 10 best (single-source) |
| Armor of the Shadows / Plate Armor of Shadows (Kliff) | Cloak | Plate Cloak of Shadows | chest | Hoenmark Ruins (Hernand), underground chamber; Force Palm on discolored floor tiles | Hernand | KeenGamer Plate Armor of the Shadows guide; KeenGamer 10 best |
| Armor of the Shadows | Body | Plate Armor of Shadows | chest | Cave near Everfrost Watchtower, Argent Peaks; light the lamp/brazier inside | Hernand (Argent Peaks) | KeenGamer Plate Armor of the Shadows guide |
| Armor of the Shadows | Feet | Plate Boots of Shadows | chest | Frostclaw Cave, behind a waterfall in the lower section; charged Stab at the waterfall's left base | Hernand | KeenGamer Plate Armor of the Shadows guide |
| Armor of the Shadows | Gloves | Plate Gloves of Shadows | chest | Everfrost Cave, above the riverbank, northern region; climb past the "end of world" warning | Hernand | KeenGamer Plate Armor of the Shadows guide |
| Armor of the Shadows | Head | Plate Helm of Shadows | boss drop | Hoenmark Ruins; defeat "Beloth, the Dark Sworn/Darksworn" — the two KeenGamer articles disagree on whether this is a Chapter 6 or Chapter 7 ("White Blizzard" quest) fight, see Gaps | Hernand | KeenGamer Plate Armor of the Shadows guide; KeenGamer 10 best |
| Dark Executioner Leather Armor (standalone piece, no other pieces found — not confirmed as part of a set) | Body | | main quest reward | Epilogue chapter-total reward ("New Horizons") | | main-story |
| Kuku Cold-Resistant Armor (standalone, Kuku-crafted; not organized into a head-to-cloak set by the source) | Body (implied) | | craft | Kilnden Workshop; Ice Resistance level 10 + movement-speed passive | | KeenGamer Kuku guide (single-source) |
| Kuku Flame-Resistant Armor (standalone, Kuku-crafted) | Body (implied) | | craft | Kilnden Workshop; Fire Resistance level 10 + critical-rate passive | | KeenGamer Kuku guide (single-source) |
| Kuku Lightning-Resistant Armor (standalone, Kuku-crafted) | Body (implied) | | craft | Kilnden Workshop; Lightning Resistance level 10 + attack-speed passive | | KeenGamer Kuku guide (single-source) |
| Kuku Marni Laser Helm (standalone, Kuku-crafted) | Head | | craft | Kilnden Workshop; fires three laser shots per cooldown cycle | | KeenGamer Kuku guide (single-source) |
| Kuku Breeze-Step Boots (standalone, Kuku-crafted) | Feet | | craft | Kilnden Workshop; triple jump height, 5-charge system | | KeenGamer Kuku guide (single-source) |

## 4. Shields, accessories and other named gear

Fextralife's own taxonomy files Shields under "weapon type," so five shields
with the richest acquisition detail are given fresh rows below and the rest
(Black Sun, Blazing Shield, Golden Shield, Shield of Sacrifice, Delesyian
Ornamental Shield, Balgran Shield, Khaled Shield, Grey Wolf Wooden Shield)
are **not repeated here** — see Section 2, which already carries their
acquisition detail, to avoid duplicate rows with the same facts.

| Name | Category | Acquisition kind | Acquisition detail | Region | URL(s) |
|---|---|---|---|---|---|
| Drake Shield | shield | boss drop | Defeat Tristan the Flame Knight and liberate Flame Knight Castle (Flame Knight faction quest); chest up the stairs, past two Demenissian Soldiers | Demeniss | G8-596271; G8-587692 |
| Ancient Shield | shield | chest | Sanctum of Faith, southeastern Delesyia; burn a vine-covered doorway using Blinding Flash | Delesyia | G8-596271 |
| Shield of Conviction | shield | chest | Church of Calphade, bell tower | Hernand (Calphade) | G8-596271; G8-587692 |
| Lucon Large Shield | shield | chest | Beighen Candlery, Pailune; underground trapdoor behind "the Stranger" near a wagon, crouch through a small opening | Pailune | G8-596271 |
| Legion Spearmen's Large Shield | shield | chest | Delesyia South Gate; face north and climb the stone wall, Force Palm a camouflaged wall panel into a hidden room | Delesyia | G8-596271 |
| Witch's Ring | accessory: ring | main quest reward | "Thinning Blade" quest arc | | main-story |
| Greymane's Earring | accessory: earring | main quest reward | Same "Thinning Blade" quest arc | | main-story |
| Stardust Necklace | accessory: necklace | main quest reward | "Shattered Ties" quest arc | | main-story |
| Earring of Dark Magic | accessory: earring | main quest reward | "Veiled Witch" quest arc (boss Hexe Marie) | | main-story |
| Radiant Necklace | accessory: necklace | main quest reward | Chapter-total reward of the "A Fleeting Dream" chapter (Ch. containing the Bastier fight) | | main-story |
| Damiane's Ponytail Ticket | accessory / cosmetic unlock item | main quest reward | Same "A Fleeting Dream" chapter reward bundle; likely a cosmetic-hairstyle unlock token rather than a wearable accessory — **treat its category as unverified** | | main-story |
| Ring of Lightning | accessory: ring | craft | Kuku system craft; requires a 2-minute rain charge to complete | | KeenGamer Kuku guide (single-source) |
| Light of the Battlefield | accessory: earring | | not stated. A same-named "Light of the Battlefield" armor **set** also exists for Damiane (Section 3) — flagged there as likely coincidental naming, not the same item | | Fextralife Accessories |
| Axiom | accessory: bracelet | | not stated; sits in an "Unknown" rarity bucket separate from the White/Green/Blue/Purple/Orange ladder | | Fextralife Accessories |
| Damiane's Axiom | accessory: bracelet | | not stated; character-specific variant of Axiom | | Fextralife Accessories |
| Oongka's Axiom | accessory: bracelet | | not stated; character-specific variant of Axiom | | Fextralife Accessories |
| Mining Knuckledrill | tool (also usable as a weapon, see Section 2) | | not stated; 33 ATK, 30% chance to auto-collect an extra ore on hit | | G8-594267; Fextralife Weapons |
| Eastern Witch's Fan | tool/weapon hybrid (see Section 2) | | not stated; clears bad local weather (10-min cooldown) | | G8-594267; Fextralife Weapons |

Remaining named accessories confirmed to exist (from the Fextralife index)
but with **no acquisition information found from any source this session** —
listed for completeness since another author may still want them as
records, acquisition left blank: Ancient Earring, Black Lion Earring,
Engraved Copper/Gold/Silver Earring, Faded Earring, Flower Petal Earring,
Green Coral Reef Earring, Purple Scout Earring, White Horn's Earring, Worn
Earring (earrings); Ancient's, Blizzard Crystal, Blue Fang, Blue Scout,
Crimson Warden's, Crossroads, Demeniss Cathedral, Dwarf, Engraved
Copper/Silver, Finely Crafted Gold, Helfryn, Karanda's, Necklace of
Lightning, Purple Scout, Rainstorm, Saint's, Surreal, Tarivian, Tarnished,
Varantin, White Lion, Worn (necklaces); Ancient, Ancient Shell, Blue Scout,
Crude Blue, Delesyian Signet, Demeniss Cathedral, Demenissian Signet,
Eternal Darkness, Finely Crafted Gold, Greymane Signet, Hernandian Signet,
Mark of Darkness, Oath of Darkness, Ogre's, Pailunese Signet, Purple Scout,
Relic of Darkness, Rough Bluestone, Seal of Pitch-Black Darkness, Tarnished,
Tashkalp Signet, Tigerfang, White Horn's, Worn (rings). Source for all:
https://crimsondesertgame.wiki.fextralife.com/Accessories.

## 5. Gaps

**Failed/blocked sources:**
- `crimsondesertgame.wiki.fextralife.com/Armor+Sets` — HTTP 404; no
  aggregate armor-sets page was found under any slug tried, only individual
  `/<Name>_Set` pages, which do not self-index.
- `fandomwire.com/all-unique-weapons-in-crimson-desert/` — HTTP 403 this
  session (on the task's preferred list, but blocked); its unique
  "Bringer of Balance" location fact is carried unverified from
  RESEARCH-COMPANION.md, which fetched it in an earlier session.
- `crimsondesert.gaming.tools` item-index pages (`/items/weapons`,
  `/items/armor/armor`, `/items/weapons/unique`) all returned a Cloudflare
  JS challenge to `curl` regardless of User-Agent — the curl workaround
  documented for this domain (and used successfully for the region-facts
  research in RESEARCH-REGIONS.md) did not work for `/items/*` paths this
  session. Not used as a source; no gaming.tools item facts appear above.
- The VULKK armor-sets catalog page (100+ sets) returned only summarized
  category/region/user text on fetch, not full per-set acquisition detail —
  its fetched content was far shorter than the page evidently contains;
  likely the fetch tool truncated or summarized a very long page. Only
  Frostcursed, Blackwing and Unyielding Warrior's acquisition text came
  through in full.

**Conflicts between sources:**
- **Crowcaller / Blackwing chapter mismatch:** VULKK, GamingBolt and
  KeenGamer all independently place the Crowcaller boss fight (source of
  the Blackwing Mask and Leather Armor) in **Chapter 5**. This project's own
  vetted `docs/RESEARCH-MAIN-STORY.md` chapter table instead places the
  Crowcaller fight, and the same Blackwing/Tauria Curved Sword/Grove's Thorn
  reward bundle, in **Chapter 12** ("Toward the Nest"). Both can't be right
  for the same single-playthrough boss unless the game has two separate
  Crowcaller encounters (a Chapter 5 preview fight and a Chapter 12 final
  fight) — this research did not turn up anything confirming or ruling out
  a two-fight structure. Flagged rather than resolved; a content author
  should check this directly against the game/a video walkthrough before
  writing the record.
- **Tauria Curved Sword's quest name:** Game8's unique-weapons page names
  the reward quest "Black and White"; RESEARCH-MAIN-STORY.md names the
  reward quest/chapter "Toward the Nest" (Chapter 12). Same boss
  (Crowcaller) in both, different quest name — possibly "Black and White"
  is an in-chapter sub-quest title Game8 uses where RESEARCH-MAIN-STORY.md
  used the chapter-arc title instead, but this is not confirmed.
- **Golden Vanguard / Shackle of Might quest attribution:** Game8's
  unique-weapons page ties Golden Vanguard to defeating "Gregor, the
  Halberd of Carnage" in an "Ashen Steps" quest, and Shackle of Might to
  defeating "Fortain, the Cursed Knight" — neither quest name matches "A
  Fleeting Dream," the quest RESEARCH-MAIN-STORY.md names for the chapter
  that lists both items among its chapter-total rewards. Likely these are
  two different quests within the same chapter that RESEARCH-MAIN-STORY.md
  only recorded at the chapter-total level (its own text says as much:
  "Most individual sub-quests have no stated starting NPC/giver or itemized
  reward").
- **Sword of the Lord:** Game8's unique-weapons page calls it a boss drop
  (defeat Hornsplitter); Game8's separate Best Weapons page calls it "a
  starting weapon obtained with Abyss Gear." Possibly two different items
  sharing a name, or one page is wrong — not resolved here.
- **Beloth the Dark Sworn / Darksworn fight chapter:** KeenGamer's two own
  articles disagree with each other — the ranked-sets article says Chapter
  7's "White Blizzard" quest, the dedicated Plate Armor of the Shadows
  article says Chapter 6. Same source, internally inconsistent.
- **Executioner of Darkness Set vs. "Dark Executioner Leather Armor":**
  Game8 lists a Damiane armor set called "Executioner of Darkness" (plate
  boots/gloves/helm, no body piece given); RESEARCH-MAIN-STORY.md
  separately names a main-quest Epilogue reward "Dark Executioner Leather
  Armor" (a body piece). These read as plausibly related (same
  dark-executioner theme) but no source directly says they are the same
  set or that one is the missing body piece of the other — treat as
  **unresolved name-similarity, not confirmed to be the same item/set**.
- **Solas Plate Set vs. "Eclipsed Solas Plate Gloves":** the Oongka Solas
  Plate Set's own piece list (Game8) has no Gloves entry, while
  RESEARCH-MAIN-STORY.md separately lists "Eclipsed Solas Plate Gloves" as
  a main-quest reward ("A Fleeting Dream" chapter). "Eclipsed" reads like a
  Solas Plate variant/recolor name, but this is not confirmed by any source
  that discusses both together.
- **Rhinard Cannon's weapon type:** Fextralife's Weapons index lists it
  under "Hand Cannon Weapons"; Game8's Best Weapons page discusses it under
  a "Spears" heading. Likely a Game8 page-organization slip rather than a
  real type conflict, but not confirmed either way.
- **Ring of the Earth's item type:** Fextralife's Unique Weapons page lists
  "Ring of the Earth" under its "One-Handed Weapons" category, despite the
  name reading like an accessory (ring). Left in the weapons table per the
  source's own categorization, flagged as suspicious.
- **Delesyian Ornamental Shield / Delesyian Dagger naming:** Fextralife's
  general weapons index lists a "Delesyian Dagger" but not an "Ornamental"
  variant by that exact name; Game8's unique-weapons page names a
  "Delesyian Ornamental Shield" as a Storm Crusher boss-drop. These appear
  to be two unrelated items (a dagger and a shield) that merely share the
  "Delesyian" regional-adjective naming pattern common to many items in
  this game (Delesyian, Demenissian, Hernandian, Pailunese, etc.) — not a
  real conflict, noted only so a content author doesn't conflate them.

**Not found at all:**
- No source gave a **price** in Silver/Copper/Gold Bars for any vendor-sold
  weapon, armor piece or accessory (Canta Plate, Baltheon Plate, Chelcia
  Plate, Grey Wolf Leather, White Bloodwind's cloak recipe, etc. all name a
  vendor/shop but never a number).
- No source gave **exact numeric stats** (attack/defense values) tied to a
  specific acquisition method beyond the handful quoted in Section 2
  (e.g. Axe of the Apocalypse's 99999 ATK, Mining Knuckledrill's 33 ATK) —
  most acquisition-guide sources describe *where*, not *what stats*.
- **Piece-level chest locations for several sets** are only known at the
  "these five locations, somewhere" granularity, not mapped to a specific
  slot: Fallen Kingdom, Cursed Soul (piece-to-location mapping absent even
  though the location list itself is precise), Icewing Plate, Golden Greed,
  Dark Ringleader's.
- **No rarity value was found for any individual named item** in Sections
  2-4 — the five-tier ladder in Section 1 is confirmed to exist, but no
  source stated which tier any specific unique weapon, armor piece or
  accessory falls into.
- **Blackstar**, named as a Chapter-9-ish main quest reward in
  RESEARCH-MAIN-STORY.md, is a **dragon mount**, not a weapon/armor/
  shield/accessory, per that same document ("Blackstar dragon mount,
  permanent from this chapter on") — deliberately **excluded** from all
  tables above rather than misfiled as gear. Likewise Rokade (Section 2,
  bottom row) is included only as a cross-reference note, not counted in
  the weapon-table row target, since it is a horse, not equipment.
- **No official Pearl Abyss source** (patch notes, official site) was
  found or used for any item fact in this file — every fact traces to a
  third-party wiki or guide site. RESEARCH-COMPANION.md's own item-model
  section similarly cites no official source for gear specifics.
- **Tool-category items** beyond Mining Knuckledrill and the Eastern
  Witch's Fan (both dual-classed as weapons by their sources) were not
  found; RESEARCH-COMPANION.md's mention of "tools" and "projectiles" as
  distinct equipment categories was not independently corroborated with
  named examples this session.
- The **Kilnden Workshop / Kuku crafting system** (Section 1 and scattered
  through Sections 2-3) rests entirely on one KeenGamer article —
  treat its existence and every named Kuku item as **single-source** until
  corroborated elsewhere.


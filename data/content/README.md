# Content records

Hand-authored game content for the companion (docs/DECISIONS.md D12, D13,
D17; design in docs/COMPANION-SPEC.md). One file per entity type, listed in
`meta.json`. The schema in `src/content/schema.ts` is the contract;
`npm test` validates every file here and `npm run content:report` prints
coverage.

## Record checklist

Before committing a record, check every line:

1. **Id.** `<type>:<slug>`, kebab-case, unique across all files, and stable:
   when the game renames something, keep the id, change `name`, add the old
   name to `aliases`.
2. **Name** exactly as the English game text shows it.
3. **Summary** is one original sentence, at most 240 characters.
4. **Prose is yours.** `body`, `steps[].text`, `strategy`, `rules`, `notes`
   are written for this repo. Do not paste a sentence, list or table from a
   wiki or guide site, even reworded lightly. Facts (names, places, prices,
   drops, prerequisites, counts) are fine to take from anywhere.
5. **Sources.** At least one URL you actually consulted, with the date.
   Official Pearl Abyss notes first, then the Fandom wiki, then guide sites.
   A record with a `location` needs a source other than th.gl for that
   place.
6. **Confidence.** `verified` only when you checked it in-game;
   `reported` when a reliable source states it; `assumed` when it is your
   inference. Say what is assumed in `body` or `note`.
7. **Game version.** The patch you checked the record against (see
   `meta.json`). Bump it when you re-check after a patch.
8. **Refs resolve.** Every id in `refs`, `related`, `ref`, `giver`, `faction`,
   `members`, `contains`, `drops[].item`, `inventory[].item` and every
   `[[id]]` link exists. The test suite fails otherwise. Add the missing
   record or drop the link.
9. **Locations** are canonical zoom-4 pixels (D3) read off the in-app map at
   zoom 5 or 6, inside the Pywel bounds and on land. Use `map: "abyss"` for
   Abyss records. Never bulk-copy coordinates from `data/pois.json`.
10. **Steps** are in play order. Give a step a `location` when the player has
    to go somewhere; give it `missable` and `missableNote` when it can be
    lost; mark `optional` steps.
11. **Images:** none. Do not add screenshots or third-party images.

## Files

| file | records | notes |
|---|---|---|
| `region.json` | regions, sub-areas, the Abyss layer | `kind` says which |
| `place.json` | towns, camps, castles, dungeons, landmarks | `contains` links what is there |
| `character.json` | playable characters, companions, NPCs, vendors' people | |
| `faction.json` | houses, guilds, hostile groups | `hostile`, `reputation` |
| `storyline.json` | ordered chapters of quests | main, faction, character, side |
| `quest.json` | main, faction, commission, request, bounty, challenge, side | steps + rewards |
| `item.json` | gear, consumables, materials, manuals, cosmetics | `acquisitions` per branch |
| `collectible.json` | one record per collectible with a location or guide | belongs to a `collection` |
| `collection.json` | the sets (memory fragments, artifacts, chests, bells) | `poiType` links the map layer |
| `vendor.json` | shops with inventory and prices | `shopType` is the th.gl services id |
| `recipe.json` | cooking, alchemy, anvil, grindstone, sewing, carpentry | |
| `skill.json` | per character and tree | `howToLearn` |
| `enemy.json` | bosses, elites, legendary animals, common enemies with drops | `strategy` |
| `mount.json` | horses and other rideables | `howToGet` |
| `activity.json` | minigames, life skills, challenges, contests | |
| `guide.json` | standalone walkthroughs whose `target` is another record | |

Empty files are fine while a type has no records yet; keep them listed in
`meta.json` so the loader and the report see every type.

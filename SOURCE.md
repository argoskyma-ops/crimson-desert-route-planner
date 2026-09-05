# Map source

## Provenance
- **Tiles:** `https://cdn.th.gl/crimson-desert/map-tiles/OpenWorld-25391853dd739b8fd7d28d6280f02d15/{z}/{y}/{x}.webp`
- **Site:** `https://crimsondesert.th.gl` (The Hidden Gaming Lair's Crimson Desert map)
- **Pyramid:** 512 px WebP tiles, zoom 0..6, `{z}/{y}/{x}` order; 64 x 64 tiles at
  zoom 6 = 32768 x 32768 px. 5461 tiles, about 24 MB.
- **Fetch date:** 2026-09-03
- **Access:** plain HTTP GET, no auth, referer or special user agent needed (verified).

## License note
Fan-hosted map of the game world (Pearl Abyss's Crimson Desert). No reuse terms are
stated on the site. This is treated as fine for **personal, local use only** by this
route-planning tool: do not redistribute the tiles or anything derived from them
except the road graph and water mask this repo commits. Whether to host this app
publicly (and so serve the tiles) is the maintainer's call, not assumed here; this
repo offers no hosted demo.

## Fast-travel nodes (D11)
- **Nodes:** `https://cdn.th.gl/crimson-desert/nodes/OpenWorld.<hash>.raw`
  (hash is on the Continent of Pywel map page as `nodesPaths.OpenWorld`).
- **Transform:** the page's `tilesConfig.OpenWorld.transformation`, a Leaflet
  `L.Transformation` that places those world X/Y onto this same tile pyramid.
- **Fetch:** `.venv/bin/python scripts/fetch-fast-travel.py` writes
  `data/fast-travel.json` (committed): teleports plus named camps, villages,
  hearths and map labels. Personal, local use; same stance as the tiles — do
  not treat the dump as redistributable game data.

## Points of interest (D14)
- **Nodes:** the same `cdn.th.gl/crimson-desert/nodes/OpenWorld.<hash>.raw`
  dump, every record (about 23,500 typed nodes: mines, herbs, chests, hidden
  gear, quests, shops, stations, creatures), plus the `filters` taxonomy on the
  map page for group and type labels.
- **Fetch:** `.venv/bin/python scripts/fetch-pois.py` writes `data/pois.json`
  (task T15 in docs/COMPANION-PLAN.md). The file is **gitignored**: local,
  personal use, never committed or redistributed, like the tiles.
- **Record order:** CBOR records are `[id, [worldY, worldX, z]]`; labels are
  `"position": [y, x]`. See D14.

## Game content (D13)
- `data/content/*.json` is hand-written for this repo: facts checked against
  the sources each record cites, prose original. No wiki or guide text is
  copied. Per-record `sources` carry the URLs; `docs/RESEARCH-COMPANION.md`
  records the licence survey behind the stance.
- Pearl Abyss's Fan Content Guidelines
  (`https://crimsondesert.pearlabyss.com/en-us/Policy?_policyNo=130`) permit
  unofficial, non-paywalled fan companions that say they are unofficial. This
  project is not affiliated with or endorsed by Pearl Abyss.

## Re-create `data/map/` from scratch
```
.venv/bin/python scripts/fetch-tiles.py
```
Downloads every tile to `data/map/tiles/{z}/{y}/{x}.webp` (skipping ones already
there) and writes `data/map/manifest.json` per docs/DECISIONS.md D4. `data/map/` is
gitignored; none of this is committed.

## Previous source (retired 2026-09-03)
PowerPyx full world map JPEG, `https://www.powerpyx.com/wp-content/uploads/crimson-desert-full-world-map.jpg`,
5178 x 5240 px, SHA-256 `29faed0c0daa09adc4967f069cdfaaf1146dde2ad76a933768558ed44d10774c`.
Its frame maps into the current canonical space as `x * 0.97 + 1120, y * 0.97 + 1640`
(docs/DECISIONS.md D1/D3).

# Research: map source + road-data strategy for the route planner

Researched 2026-09-03. Crimson Desert (Pearl Abyss) is out; the continent is Pywel, split
into five named regions (Hernand, Pailune, Demeniss, Delesyia, Crimson Desert) plus outlying
areas (Varnia, Trader's Expanse). Depth: medium — facts below are tagged VERIFIED (I made the
HTTP request myself and inspected the result), REPORTED (a page states it, not independently
confirmed), or ASSUMED (my inference, flagged as such).

## Top recommendation

- **Primary map source:** PowerPyx full world map JPG —
  `https://www.powerpyx.com/wp-content/uploads/crimson-desert-full-world-map.jpg`
  **5178×5240 px**, single file, 2.2 MB, VERIFIED by direct download + Pillow/`sips`.
  Roads/paths are visually distinct thin tan/beige lines over the terrain, clearly separated
  from blue rivers/coastline; town and POI icons are separate map markers, not baked into road
  color. Fetch: `curl -sL -A "Mozilla/5.0" -o pywel-full.jpg "https://www.powerpyx.com/wp-content/uploads/crimson-desert-full-world-map.jpg"`.
  License: fan-hosted guide-site copy of the in-game map (no explicit reuse terms found on the
  page) — fine for a personal, local-only, non-commercial tool; not for redistribution.
- **Fallback:** MapGenie's Pywel tile pyramid exists and is well-specified (confirmed via page
  source: base `https://tiles.mapgenie.io/games/`, path `crimson-desert/pywel/default-v3`,
  pattern `{z}/{y}/{x}.jpg`, `min_zoom:8`, real tiles to `tiles_max_zoom:17`, UI `max_zoom:19`)
  but the CDN returned `403 AccessDenied` (raw S3 XML) for every `{z}/{x}/{y}` combination I
  tried, with or without `Referer`/`Origin` headers — it is not freely scrapable without further
  reverse-engineering of MapGenie's auth. Use only if PowerPyx's image later proves too low-res
  for the tile pyramid you build from it (5178² gives you clean tiles up to native zoom ~4-5 in
  a 256px-tile CRS.Simple pyramid, which should be enough).
- **Road-data strategy:** hybrid — raster-extract an initial road skeleton from the PowerPyx
  image with Pillow/numpy color segmentation → scikit-image skeletonization → `sknw` graph, then
  hand-fix/tag classes in a small in-app Leaflet editor (leaflet-geoman) because auto-extraction
  will conflate roads with rivers/trails of similar tone and can't reliably infer main/sub/off-road
  class from pixel data alone.

---

## 1. Map assets

### PowerPyx full world map (recommended primary)
- URL: `https://www.powerpyx.com/crimson-desert-full-world-map/` (article), image at
  `https://www.powerpyx.com/wp-content/uploads/crimson-desert-full-world-map.jpg`
- Serves: single JPG, not tiled. **VERIFIED** 5178×5240 px, 2,229,107 bytes, `Last-Modified: Tue,
  07 Apr 2026` (`curl -sI` + downloaded and read with Pillow: `im.size == (5178, 5240)`, confirmed
  independently with `sips -g pixelWidth -g pixelHeight`).
  Aspect ratio is close to square (0.988), consistent with the roughly square/near-square
  landmass shown.
  This appears to be the in-game full-map screen (all five regions labeled, fog-of-war fully
  cleared), not a promotional render — best road legibility of anything checked.
- Roads: **VERIFIED by visual inspection** — thin tan/light-brown lines form a dense road/trail
  network distinct in color from blue rivers and dark-blue coastline; town clusters and
  POI/marker icons (blue circles, red icons) sit on top. At this resolution there do appear to be
  at least two road weights (thicker roads near cities vs. thinner trails), but I did not
  zoom into a 1:1 crop to confirm a strict 3-tier main/sub/off-road distinction — that needs to
  be checked at full res once downloaded locally.
- License: no explicit reuse terms on the page (typical trophy/guide site); this is a third-party
  screenshot/compilation of Pearl Abyss's in-game map, not an official downloadable asset. Fine
  for a personal, local, non-commercial tool per this project's stated use; do not redistribute
  or publish the tile pyramid built from it.
- Verification status: **VERIFIED**.

### MapGenie (Pywel) — fallback, best-structured but access-gated
- URL: `https://mapgenie.io/crimson-desert` and `https://mapgenie.io/crimson-desert/maps/pywel`
  — both **VERIFIED** reachable (`curl -sIL` → HTTP/2 200).
- Serves: a real Leaflet-style tile pyramid. **VERIFIED from page-embedded JSON**
  (`window.mapData.mapConfig.tile_sets`): tile set `"World Map"`, `path:
  "crimson-desert/pywel/default-v3"`, `extension: "jpg"`, `pattern:
  "crimson-desert/pywel/default-v3/{z}/{y}/{x}.jpg"`, `min_zoom: 8`, `max_zoom: 19`,
  `tiles_max_zoom: 17` (real tiles stop at 17, 18-19 are client-side overzoom), tiles base URL
  `window.tilesUrl = "https://tiles.mapgenie.io/games/"`. There is also a second tile set
  `"Factions"` at `crimson-desert/oats/faction-v3`. `initial_zoom: 11`.
  A low-res `preview.jpg` at `https://media.mapgenie.io/v2/assets/prod/games/crimson-desert/maps/pywel/preview.jpg`
  is only 1700×1166 (VERIFIED via response headers, Fastly image-transform `idim=1700x1166`) —
  not usable as a map source itself, just a thumbnail.
- Fetch attempt: I tried `curl` against ~20 plausible `{z}/{x}/{y}}` combinations at zoom 0, 8, 11
  and 17 (including a small grid sweep at z=8), with and without `Referer: https://mapgenie.io/`
  and `Origin` headers. **Every single request returned `403` with an S3 `<Error><Code>AccessDenied</Code>`
  body** — this happened even for a well-known other MapGenie game (Elden Ring) using the analogous
  URL shape, suggesting the bucket enforces some form of signed/cookie-gated access that a browser
  loading the JS map viewer satisfies but a bare `curl` does not. I did not pursue browser-based
  extraction (out of scope for this budget). Practical conclusion: the tile *schema* is known and
  reusable as a reference, but the tiles themselves are **not freely fetchable** by script today.
- Roads: REPORTED only (not inspected — couldn't load any actual tile imagery). MapGenie's own
  marker category JSON (scanned from the embedded `groups`/`categories` array) exposes POI
  categories like "Strongholds" (830 locations) and "Locations" but **no explicit road/path/
  fast-travel-route category** — MapGenie appears to be POI-marker-only, not road-vector data.
- License: MapGenie is an ad-supported commercial product; terms not reviewed, but scraping
  gated tiles would likely violate ToS even if bypassed.
- Verification status: config **VERIFIED**, tile imagery **NOT ACCESSIBLE** (403).

### Official Pearl Abyss site
- `https://crimsondesert.pearlabyss.com` — checked the media/wallpaper section.
- **VERIFIED**: only decorative wallpapers at 400×225 px
  (`https://s1.pearlcdn.com/cd/brand/media_GLOBAL/.../*.400x225.{png,jpg}`), no world-map asset,
  no press-kit map download found. Not usable.
- Verification status: **VERIFIED absent** (checked the media page; did not exhaustively crawl
  the whole press-kit/news archive, so a map could theoretically exist elsewhere on the site —
  low priority to keep digging given PowerPyx already has a clean full map).

### Fextralife wiki
- `https://crimsondesertgame.wiki.fextralife.com/Interactive_Map` — **VERIFIED** reachable
  (HTTP 200, 47 KB HTML). Uses a proprietary embedded iframe system ("ValnetMap",
  `/extensions/ValnetMap/frame.php?mapId=...`), not a plain Leaflet tile URL I could read from
  the outer page. A follow-up fetch of the iframe URL itself failed at the network layer in this
  environment (connection error, not a 4xx/5xx) so I could not identify its tile source or
  resolution. Fextralife also splits the map into four separate per-region interactive maps
  (Hernand, Pailune, Demeniss, Delesyia — REPORTED from search results, not opened individually).
- Verification status: **REPORTED** existence + iframe mechanism; tile/image source **NOT
  VERIFIED** (network failure mid-investigation, not pursued further given time budget).

### Other candidates (checked via search only, not fetched — lower priority)
- **game8.co** (`https://game8.co/games/Crimson-Desert/archives/585760`) — REPORTED to have an
  interactive map; not fetched.
- **gamerguides.com** (`https://www.gamerguides.com/crimson-desert/maps/pywel`) — **VERIFIED
  reachable** (HTTP 200 via `curl -sIL`) but page body/image not inspected.
- **crimsondesertfire.com/map** — REPORTED (via search) to be a large community-built map with
  15,182 locations; site itself **VERIFIED reachable** (HTTP 200, Vercel/Nuxt app — i.e. a JS SPA,
  so its tiles would need runtime inspection, not plain `curl`). Not pursued further.
- **thegameswiki.com/crimson-desert/wiki/world-map** — attempted fetch returned **HTTP 429** (rate
  limited); this domain (along with `crimsonndesertt.in`, `dexora.gg`, `crimsondesertwiki.net`)
  reads like SEO/content-farm output with inconsistent facts between them (see Section 2) — treat
  anything sourced only from these as low-confidence.
- **GameTyrant** (`gametyrant.com/news/crimson-desert-full-sized-map-of-the-entire-world`) —
  REPORTED alternate source for a full map, likely re-hosting the same or a similar image to
  PowerPyx; not fetched given PowerPyx already verified at high res.
- No Reddit/Steam Community/imgur fan-stitched map thread was found as a distinct, higher-res
  alternative to PowerPyx's image in this pass.

### Ranking
1. **Resolution**: PowerPyx (5178×5240, verified) > MapGenie tiles (unknown effective res, likely
   higher since it's a z17 pyramid, but inaccessible) > everything else (unverified).
2. **Road legibility**: PowerPyx (verified visually, roads clearly separated from water) is the
   only one actually inspected; others unknown.
3. **Ease of fetching**: PowerPyx (one `curl`, no auth, 2.2 MB) is by far the easiest; MapGenie is
   blocked; Fextralife/game8/crimsondesertfire are all JS-app or iframe-embedded and need a real
   browser to extract tiles.

**Recommended fetch command:**
```bash
curl -sL -A "Mozilla/5.0" \
  -o pywel-full.jpg \
  "https://www.powerpyx.com/wp-content/uploads/crimson-desert-full-world-map.jpg"
```

---

## 2. Road / terrain data and game mechanics

No source found exposes road data as vectors/GeoJSON. MapGenie's marker JSON is POI-only (see
above); no datamined road-graph files were found on modding sites in this pass (not exhaustively
searched — a modding community search targeted at Nexus Mods/GitHub datamine repos specifically
was not run, given budget; worth a follow-up if this becomes a blocker).

Game-mechanics facts relevant to the speed model — **note**: secondary sites disagree with each
other on fast-travel terminology (one calls it "Abyss Shrines", another "Abyss Nexus / Abyss
Cresset", another "Liberation points"), which is a strong signal several of these are
low-quality/SEO-farmed and possibly not fact-checked against the actual game. Treat all of the
below as REPORTED, not VERIFIED, and re-check in-game before hard-coding a speed model:

- **Map size**: REPORTED inconsistently — "~90 km² playable, ~100 km² with caves" (Method.gg,
  G2A) vs. "total ~200 km², playable 123-150 km²" (search synthesis of Beebom/lagofast) vs.
  "9500m × 9500m ≈ 90 km²" (PowerPyx article text). Treat true playable area as **~90-150 km²,
  roughly 9-10 km across**, pending an authoritative figure.
- **Regions**: 5 main (Hernand, Pailune, Demeniss, Delesyia, Crimson Desert) plus outlying areas
  (Varnia, Trader's Expanse visible on the PowerPyx map) — REPORTED, corroborated visually on the
  map image (region names are printed on it) so treat region *names/count* as VERIFIED, sizes as
  REPORTED.
- **Vertical layers**: surface open world + underground caves/mines + sky islands via "Abyss
  Restoration" — REPORTED (Method.gg via search synthesis), not verified.
- **Horse travel**: horses have randomized Speed/Stamina/Strength stats; a high-stat horse with
  full barding crosses Hernand→Crimson Desert in ~15-20 real-time minutes; crossing the whole map
  takes ~2 hours on horseback — REPORTED (Method.gg / dexora.gg), not verified, and dexora.gg in
  particular reads as a low-confidence SEO site.
- **Roads/speed bonus**: no source explicitly confirmed or denied a paved-road speed bonus for
  horses; **ASSUMED** none confirmed — for the app's model, treat "main/sub/off-road" as a
  *routing-cost* classification (prefer roads, avoid rough terrain) rather than an in-game-verified
  speed multiplier, unless/until you confirm it by playing.
- **Fast travel**: REPORTED, terminology inconsistent across sources — one describes waypoint-style
  shrines/nexus points activated on discovery (~47-160+ points across regions) requiring you to
  first reveal the fog of war via "Bell Towers"/Kliff's ability; another describes region-wide
  unlocks tied to "Liberation points". For the planner's scope (point-to-point road routing), fast
  travel is probably out of scope for v1 — note it as a possible v2 feature (teleport-graph nodes)
  rather than building on unverified mechanics now.

---

## 3. Prior art: Leaflet game-map route planners

| Project | Graph storage | Coordinate system | Pin-to-graph snapping | Algorithm | In-app editor | Reusable pieces |
|---|---|---|---|---|---|---|
| **GenshinMap** / Teyvat.moe (`github.com/GenshinMap/genshinmap.github.io`, `github.com/EliteMasterEric/Teyvat.moe`) | Community-maintained JS/JSON marker + route data (React) | Leaflet `CRS.Simple` over a custom in-game-map tile pyramid | N/A — marker-based routes, not a road graph | N/A (curated routes, not computed) | Yes, community contribution pipeline | Good reference for `CRS.Simple` + custom tile pyramid setup in React+Leaflet; not a routing engine |
| **OSRS Pathfinder** (`github.com/dQw4w9WgXcQ/osrs-pathfinder`, site `osrspathfinder.github.io`) | Separate REST pathfinding service backing a Leaflet front end | Game tile coordinates | Click nearest walkable tile | Server-side pathfinding (grid-based, effectively BFS/A* over a walkability grid, not a road graph) | No | Cleanest architectural precedent for splitting "map display" (Leaflet) from "routing" (a small local service/algorithm) — closest analog to A/B pin routing |
| **RDR2CollectorsMap** (`github.com/jeanropke/RDR2CollectorsMap`) | Marker JSON + a togglable "pathfinder" mode (basic route generator vs. advanced pathfinder) | Custom map pixel coords | Nearest-marker snapping for collectible routes | REPORTED to offer both a simple nearest-neighbor route and an "advanced pathfinder" (algorithm unconfirmed, not inspected) | No (marker data is community-sourced) | Demonstrates a UI pattern for toggling between routing modes — relevant to your horse/foot + road-class toggle idea |
| **BDO-Map** (`github.com/xergon85/BDO-Map`) | Laravel/PHP app, DB-backed | N/A | N/A | N/A | Unknown | Low value — it's a full PHP web app, not a lightweight client-side reference; better to look at the *live* Black Desert Foundry (`blackdesertfoundry.com/map`) or bdolytics.com/map for node-graph UX inspiration rather than this repo's code |
| **jediaf/smart-route-navigator** (`github.com/jediaf/smart-route-navigator`) | Plain `graph-data.json` (nodes + edges) | Generic/custom | Manual node click | Dijkstra | No | Closest generic template for a from-scratch node/edge JSON + Dijkstra-over-Leaflet implementation — good structural reference even though it's not game-specific |

**Reusable libraries identified** (all **VERIFIED** live on their registries):
- `ngraph.path` (npm, v1.6.1, "Path finding in a graph") — supports A* and other algorithms over
  an arbitrary node/edge graph; a good fit for routing over the `roads.json` graph below without
  writing pathfinding by hand.
- `@geoman-io/leaflet-geoman-free` (npm, v2.20.0) — Leaflet plugin for drawing/editing
  polylines/markers directly on the map; the natural choice for the in-app road-tracing editor
  (draw a road as a polyline, snap vertices to existing nodes).
- `leaflet-draw` — older, less maintained alternative to leaflet-geoman; leaflet-geoman is the
  more actively developed choice today.
- `sknw` (PyPI, v0.15, "Analysis of object skeletons") — converts a skeletonized binary image
  into a NetworkX graph of nodes/edges; the standard glue between scikit-image skeletonization and
  a usable graph.
- `scikit-image` (PyPI, v0.26.0) — provides `skeletonize`, morphology, and color-space tools for
  the raster-extraction path.

Common pattern across all of the above: **`CRS.Simple`** (pixel-space, not lat/lng) is the
standard choice for non-real-world game maps in Leaflet — confirms the plan in the project brief.

---

## 4. Recommended road-data strategy

**Recommendation: hybrid (b+a) — raster-extract a first pass, then fix/tag by hand in an editor.**
Pure automatic extraction (a) will mis-classify rivers/coastlines as roads (similar tan-vs-blue
contrast issue aside, terrain contour lines and cliff textures can also confuse a naive
threshold) and cannot reliably infer semantic road *class* (main/sub/off-road) from pixel width
alone at the compression level of a JPG guide-site image. Pure manual tracing (b) alone is
accurate but slow over a 9-10 km, multi-region map. The hybrid gets 80% of the network traced
automatically and lets you spend editing time only on junctions/misclassifications.

**Pipeline (Python, offline, one-time build step):**
1. **Load & color-segment**: Pillow/numpy — load the PowerPyx JPG (or a higher-res source if you
   later get MapGenie access), threshold on the tan/beige road color band, mask out the darker
   blue water range so rivers don't leak in.
2. **Clean the mask**: `scipy.ndimage` morphological opening/closing to remove speckle and bridge
   small gaps from text labels/icons overlapping roads.
3. **Skeletonize**: `skimage.morphology.skeletonize` → 1px-wide centerlines.
4. **Graph extraction**: `sknw.build_sknw(skeleton)` → NetworkX graph of nodes (junctions/
   endpoints) and edges (pixel-coordinate polylines).
5. **Simplify**: Douglas-Peucker (`shapely.simplify` or a small custom implementation) on each
   edge's point list to cut point count without losing shape.
6. **Classify**: tag each edge `main`/`sub`/`offroad` by measured stroke width at that edge's
   midpoint (sample a perpendicular strip of the pre-skeleton mask) — this needs manual
   calibration against a few known main roads once you have the actual game map open.
7. **Export** to `roads.json` per the schema below.
8. **Manual fix pass** in-app: use `leaflet-geoman` to add missing connectors, delete false
   positives (river segments misclassified as road), and correct class tags — this is the (c)
   hybrid step, done inside the app itself rather than a separate GIS tool, since the project
   already plans an in-app editor.

**`roads.json` schema** (the brief's proposal, essentially unchanged — it already matches the
node/edge pattern used by every prior-art example above):

```json
{
  "version": 1,
  "imageSize": [5178, 5240],
  "nodes": [
    { "id": "n1", "x": 123.4, "y": 456.7 }
  ],
  "edges": [
    {
      "id": "e1",
      "from": "n1",
      "to": "n2",
      "class": "main",
      "points": [[123.4, 456.7], [130.1, 460.2], [140.0, 470.5]]
    }
  ]
}
```
One addition worth making now rather than later: give each edge a `"cost"` or `"lengthPx"` field
computed at build time (sum of segment lengths along `points`) so the router doesn't have to
recompute polyline length on every query, and reserve `class: "offroad"` edges for user-drawn
straight-line shortcuts (since off-road has no visible path to trace) — both are cheap additions
that keep `ngraph.path` (or a hand-rolled Dijkstra/A*) simple: build the graph once from
`roads.json`, weight edges by `lengthPx / speedForClassAndMount`, run A* between the graph nodes
nearest pins A and B (nearest-node snapping, matching the OSRS Pathfinder / smart-route-navigator
pattern above), then draw the resulting path as a Leaflet polyline.

---

## Verification log

| Request | Result |
|---|---|
| `curl -sIL https://mapgenie.io/crimson-desert` | 200, text/html |
| `curl -sIL https://mapgenie.io/crimson-desert/maps/pywel` | 200, text/html |
| `curl -sL https://mapgenie.io/crimson-desert` → saved HTML | 200, 26,754 bytes |
| `curl -sL https://mapgenie.io/crimson-desert/maps/pywel` → saved HTML | 200, 222,530 bytes; contained `window.mapData` JSON with tile config |
| `curl -sI https://media.mapgenie.io/.../maps/pywel/preview.jpg` | 200, image/jpeg, Fastly-reported 1700×1166 |
| `curl` × ~20 combinations of `https://tiles.mapgenie.io/games/crimson-desert/pywel/default-v3/{z}/{y}/{x}.jpg` (z=0,8,11,17; grid sweep at z=8; with/without Referer & Origin headers) | all 403, S3 `AccessDenied` XML body |
| `curl` `https://tiles.mapgenie.io/games/elden-ring/the-lands-between/default/8/100/100.{jpg,png}` (control test) | both 403, same AccessDenied pattern |
| `curl -sI https://tiles.mapgenie.io/robots.txt` | 403, `access-control-allow-origin: *` present |
| `WebFetch https://crimsondesert.pearlabyss.com/en/media/wallpaper` | 200; only 400×225 wallpapers found, no map asset |
| `curl -sL https://crimsondesertgame.wiki.fextralife.com/Interactive_Map` → saved HTML | 200, 47,101 bytes; found `ValnetMap` iframe reference |
| `curl -sL .../extensions/ValnetMap/frame.php?mapId=...` | connection failure (HTTP 000), not pursued further |
| `curl -sIL https://www.gamerguides.com/crimson-desert/maps/pywel` | 200, text/html (Cloudflare) |
| `curl -sIL https://crimsondesertfire.com/map` | 200, text/html (Vercel/Nuxt SPA) |
| `WebFetch https://thegameswiki.com/crimson-desert/wiki/world-map` | 429 Too Many Requests |
| `curl -sL https://www.powerpyx.com/crimson-desert-full-world-map/` → saved HTML | 200, 139,241 bytes; found map image URL |
| `curl -sI https://www.powerpyx.com/wp-content/uploads/crimson-desert-full-world-map.jpg` | 200, image/jpeg, `content-length: 2229107` |
| `curl -sL` (downloaded) same JPG → `Pillow Image.open().size` / `sips -g pixelWidth -g pixelHeight` | **5178×5240 px** (both methods agree) |
| Visual inspection of downloaded JPG (Read tool) | Roads visible as tan lines distinct from blue water; region labels present; POI icons overlaid |
| `curl https://api.github.com/repos/xergon85/BDO-Map` | 200; PHP/Laravel app, 1 star |
| `curl https://registry.npmjs.org/ngraph.path/latest` | 200; v1.6.1 |
| `curl https://registry.npmjs.org/@geoman-io/leaflet-geoman-free/latest` | 200; v2.20.0 |
| `curl https://pypi.org/pypi/sknw/json` | 200; v0.15 |
| `curl https://pypi.org/pypi/scikit-image/json` | 200; v0.26.0 |
| WebSearch queries (10 total) | mapgenie overview; Pywel map size; game8/fextralife interactive maps; map size + horse/stamina/fast-travel; fan-stitched map search; road/datamine/fast-travel search; leaflet route-planner GitHub search; BDO node planner search; OSRS/RDR2/Genshin prior-art search — see inline citations above |

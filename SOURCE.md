# Map source

## Provenance
- **Image URL:** `https://www.powerpyx.com/wp-content/uploads/crimson-desert-full-world-map.jpg`
- **Article URL:** `https://www.powerpyx.com/crimson-desert-full-world-map/`
- **Resolution:** 5178 x 5240 px, JPEG
- **File size:** 2,229,107 bytes
- **SHA-256:** `29faed0c0daa09adc4967f069cdfaaf1146dde2ad76a933768558ed44d10774c`
- **Fetch date:** 2026-09-03

## License note
Fan-hosted copy of the in-game full-world map of Pywel (published by a guide site, not
an official downloadable asset). No explicit reuse terms are stated on the page. This is
treated as fine for **personal, local use only** by this route-planning tool: do not
redistribute the source image or any tiles built from it. Whether to publish this app
publicly (and thus the derived tiles) is Rennie's call, not assumed here.

## Re-create `data/map/` from scratch
```
scripts/fetch-map.sh
.venv/bin/python scripts/build-tiles.py
```
The first command downloads `data/map/source.jpg` (skipped if it already exists) and
verifies it is 5178x5240; the second builds `data/map/tiles/{z}/{x}/{y}.jpg` and
`data/map/manifest.json` per docs/DECISIONS.md D4. `data/map/` is gitignored — none of
this is committed.

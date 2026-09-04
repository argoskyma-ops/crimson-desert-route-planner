#!/usr/bin/env python3
"""Download the Pywel world-map tile pyramid used by the app (see SOURCE.md).

The tiles come from The Hidden Gaming Lair's Crimson Desert map: 512 px WebP
tiles at zoom 0..6 (a 64x64 grid at z6, 32768 px square), url pattern
{z}/{y}/{x}.webp.  They are written unchanged to data/map/tiles/{z}/{y}/{x}.webp
(gitignored) and a manifest is written to data/map/manifest.json.  Existing
tiles are skipped, so the script can be re-run to resume.

    .venv/bin/python scripts/fetch-tiles.py            # all zooms
    .venv/bin/python scripts/fetch-tiles.py --max-zoom 4
    .venv/bin/python scripts/fetch-tiles.py --composite 4   # also stitch z4 to a PNG
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = (
    "https://cdn.th.gl/crimson-desert/map-tiles/"
    "OpenWorld-25391853dd739b8fd7d28d6280f02d15"
)
TILE_SIZE = 512
MAX_NATIVE_ZOOM = 6
CANONICAL_ZOOM = 4
PYWEL_BOUNDS = (1024, 1544, 6248, 6832)
FORMAT = "webp"
USER_AGENT = "crimson-desert-route-planner/1.0 (personal offline route planner)"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=ROOT / "data/map/tiles")
    parser.add_argument("--manifest", type=Path, default=ROOT / "data/map/manifest.json")
    parser.add_argument("--min-zoom", type=int, default=0)
    parser.add_argument("--max-zoom", type=int, default=MAX_NATIVE_ZOOM)
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument(
        "--composite",
        type=int,
        default=None,
        help="Also stitch this zoom level into data/map/source-z{N}.png",
    )
    return parser.parse_args()


def fetch(url: str, path: Path, attempts: int = 4) -> str:
    if path.exists() and path.stat().st_size > 0:
        return "skipped"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                data = response.read()
            if not data:
                raise OSError("empty body")
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            return "fetched"
        except Exception as error:  # noqa: BLE001 - retry any transport error
            if attempt == attempts - 1:
                raise OSError(f"{url}: {error}") from error
            time.sleep(1.5 * (attempt + 1))
    return "fetched"


def composite(tiles: Path, zoom: int, output: Path) -> None:
    from PIL import Image

    Image.MAX_IMAGE_PIXELS = None
    count = 2**zoom
    size = count * TILE_SIZE
    canvas = Image.new("RGB", (size, size))
    for y in range(count):
        for x in range(count):
            tile = Image.open(tiles / str(zoom) / str(y) / f"{x}.{FORMAT}").convert("RGB")
            canvas.paste(tile, (x * TILE_SIZE, y * TILE_SIZE))
    canvas.save(output, optimize=True)
    print(f"Wrote {output} ({size}x{size})")


def main() -> None:
    args = parse_args()
    jobs: list[tuple[str, Path]] = []
    for zoom in range(args.min_zoom, args.max_zoom + 1):
        count = 2**zoom
        for y in range(count):
            for x in range(count):
                jobs.append(
                    (
                        f"{BASE_URL}/{zoom}/{y}/{x}.{FORMAT}",
                        args.out / str(zoom) / str(y) / f"{x}.{FORMAT}",
                    )
                )
    print(f"{len(jobs)} tiles, zoom {args.min_zoom}..{args.max_zoom}")
    done = {"fetched": 0, "skipped": 0}
    failures: list[str] = []
    started = time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(fetch, url, path): url for url, path in jobs}
        for index, future in enumerate(as_completed(futures), 1):
            try:
                done[future.result()] += 1
            except OSError as error:
                failures.append(str(error))
            if index % 500 == 0:
                print(f"  {index}/{len(jobs)} ({time.time() - started:.0f}s)")
    print(f"Fetched {done['fetched']}, skipped {done['skipped']}, failed {len(failures)}")
    for failure in failures[:10]:
        print(f"  {failure}")
    if failures:
        sys.exit(1)

    # Canonical coordinates (D3) are the zoom-4 pixel grid: 8192 x 8192.  At
    # zoom 6 the tiles hold four CSS px per canonical px.  `bounds` is the
    # Pywel window (the in-game full map plus a margin) in canonical px.
    manifest = {
        "width": TILE_SIZE * 2**CANONICAL_ZOOM,
        "height": TILE_SIZE * 2**CANONICAL_ZOOM,
        "canonicalZoom": CANONICAL_ZOOM,
        "tileSize": TILE_SIZE,
        "minZoom": 0,
        "maxNativeZoom": MAX_NATIVE_ZOOM,
        "format": FORMAT,
        "tileOrder": "zyx",
        "bounds": list(PYWEL_BOUNDS),
        "source": "SOURCE.md",
    }
    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    args.manifest.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Wrote {args.manifest}")
    if args.composite is not None:
        composite(args.out, args.composite, ROOT / f"data/map/source-z{args.composite}.png")


if __name__ == "__main__":
    main()

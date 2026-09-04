#!/usr/bin/env python3
"""Build an XYZ tile pyramid + manifest from data/map/source.jpg per docs/DECISIONS.md D4.

Run with: .venv/bin/python scripts/build-tiles.py
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build an XYZ tile pyramid from the map source image.")
    parser.add_argument("--source", default="data/map/source.jpg", help="path to the source image")
    parser.add_argument("--out", default="data/map/tiles", help="output directory for tiles")
    parser.add_argument("--manifest", default="data/map/manifest.json", help="path to write manifest.json")
    parser.add_argument("--tile-size", type=int, default=256, help="tile edge length in px")
    parser.add_argument("--quality", type=int, default=85, help="JPEG quality")
    parser.add_argument("--force", action="store_true", help="rewrite tiles that already exist")
    return parser.parse_args()


def border_grey(im: Image.Image, frame_px: int = 10) -> tuple[int, int, int]:
    """Median colour of the outer `frame_px` frame of the source image."""
    import numpy as np

    arr = np.asarray(im.convert("RGB"))
    h, w = arr.shape[:2]
    frame_px = min(frame_px, h // 2, w // 2)
    top = arr[:frame_px, :, :]
    bottom = arr[h - frame_px :, :, :]
    left = arr[:, :frame_px, :]
    right = arr[:, w - frame_px :, :]
    pixels = np.concatenate(
        [top.reshape(-1, 3), bottom.reshape(-1, 3), left.reshape(-1, 3), right.reshape(-1, 3)],
        axis=0,
    )
    median = np.median(pixels, axis=0)
    return (int(median[0]), int(median[1]), int(median[2]))


def build_tiles(args: argparse.Namespace) -> None:
    source_path = Path(args.source)
    out_dir = Path(args.out)
    manifest_path = Path(args.manifest)
    tile_size = args.tile_size
    quality = args.quality
    force = args.force

    im = Image.open(source_path)
    im = im.convert("RGB")
    width, height = im.size

    max_native_zoom = math.ceil(math.log2(max(width, height) / tile_size))
    min_zoom = 0

    grey = border_grey(im)

    out_dir.mkdir(parents=True, exist_ok=True)

    total_tiles = 0
    zoom_counts: dict[int, int] = {}

    for z in range(min_zoom, max_native_zoom + 1):
        scale = 2 ** (z - max_native_zoom)
        if z == max_native_zoom:
            # Native zoom: original pixels, unchanged.
            level_im = im
        else:
            level_w = max(1, round(width * scale))
            level_h = max(1, round(height * scale))
            level_im = im.resize((level_w, level_h), Image.LANCZOS)

        level_w, level_h = level_im.size
        cols = math.ceil(level_w / tile_size)
        rows = math.ceil(level_h / tile_size)

        zoom_dir = out_dir / str(z)
        count = 0

        for x in range(cols):
            col_dir = zoom_dir / str(x)
            col_dir.mkdir(parents=True, exist_ok=True)
            for y in range(rows):
                tile_path = col_dir / f"{y}.jpg"
                if tile_path.exists() and not force:
                    count += 1
                    continue

                left = x * tile_size
                top = y * tile_size
                right = left + tile_size
                bottom = top + tile_size

                # Pad edge tiles with the source's border-grey to full tile_size.
                if right > level_w or bottom > level_h:
                    tile = Image.new("RGB", (tile_size, tile_size), grey)
                    crop = level_im.crop((left, top, min(right, level_w), min(bottom, level_h)))
                    tile.paste(crop, (0, 0))
                else:
                    tile = level_im.crop((left, top, right, bottom))

                tile.save(tile_path, "JPEG", quality=quality)
                count += 1

        zoom_counts[z] = count
        total_tiles += count
        print(f"zoom {z}: {level_w}x{level_h}px, {cols}x{rows} tiles = {count} tiles")

    print(f"total: {total_tiles} tiles")

    manifest = {
        "width": width,
        "height": height,
        "tileSize": tile_size,
        "minZoom": min_zoom,
        "maxNativeZoom": max_native_zoom,
        "format": "jpg",
        "source": "SOURCE.md",
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"wrote {manifest_path}: {manifest}")


if __name__ == "__main__":
    build_tiles(parse_args())

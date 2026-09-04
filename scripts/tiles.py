"""Shared helpers for the th.gl tile pyramid (see scripts/fetch-tiles.py)."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TILES = ROOT / "data/map/tiles"
DEFAULT_MANIFEST = ROOT / "data/map/manifest.json"


def load_manifest(path: Path = DEFAULT_MANIFEST) -> dict:
    return json.loads(path.read_text())


def stitch_region(
    tiles: Path,
    zoom: int,
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    tile_size: int = 512,
    fmt: str = "webp",
) -> Image.Image:
    """Return the RGB image of the zoom-``zoom`` pixel window [x0,x1) x [y0,y1).

    Missing tiles come out as the map's beige land colour so extraction never
    sees a black hole.
    """
    width, height = x1 - x0, y1 - y0
    canvas = Image.new("RGB", (width, height), (203, 201, 195))
    for ty in range(y0 // tile_size, (y1 - 1) // tile_size + 1):
        for tx in range(x0 // tile_size, (x1 - 1) // tile_size + 1):
            path = tiles / str(zoom) / str(ty) / f"{tx}.{fmt}"
            if not path.exists():
                continue
            canvas.paste(Image.open(path).convert("RGB"), (tx * tile_size - x0, ty * tile_size - y0))
    return canvas


def to_array(image: Image.Image) -> np.ndarray:
    return np.asarray(image, dtype=np.uint8)

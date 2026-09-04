#!/usr/bin/env python3
"""Render review tiles of the map with the road graph drawn on top.

Each tile is a window of the th.gl pyramid at --zoom (default 5, twice the
canonical resolution) with every edge of a roads.json drawn over it (main
orange, sub yellow, bridges blue), dead-end nodes ringed in red and the water
mask outlined in cyan.  The tiles are for a visual sweep: open them one by one
and note roads the graph misses, joins that should not exist, and river
crossings that are wrong or absent.

    .venv/bin/python scripts/review-tiles.py --out data/map/review

Tiles are named r{row}-c{col}.png and carry their canonical-pixel origin in the
label, so a finding can be reported as canonical coordinates.  --compare draws a
second roads.json in magenta so two extractions can be diffed by eye.  --bounds
(canonical px) and --tile (canonical px per tile) pick the window.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from tiles import DEFAULT_MANIFEST, DEFAULT_TILES, load_manifest, stitch_region

Image.MAX_IMAGE_PIXELS = None

ROOT = Path(__file__).resolve().parents[1]
COLOURS = {
    "main": (255, 111, 30),
    "sub": (255, 215, 35),
    "offroad": (140, 140, 140),
    "bridge": (40, 90, 255),
    "compare": (255, 0, 200),
    "dead_end": (230, 20, 20),
    "water": (0, 230, 230),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tiles", type=Path, default=DEFAULT_TILES)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--roads", type=Path, default=ROOT / "data/roads.json")
    parser.add_argument("--compare", type=Path, default=None)
    parser.add_argument("--water", type=Path, default=ROOT / "data/water-mask.png")
    parser.add_argument("--no-water", action="store_true")
    parser.add_argument("--out", type=Path, default=ROOT / "data/map/review")
    parser.add_argument("--zoom", type=int, default=5, help="Pyramid zoom to render")
    parser.add_argument("--tile", type=int, default=500, help="Tile edge in canonical px")
    parser.add_argument("--bounds", default=None, help="x0,y0,x1,y1 canonical px (default: manifest bounds)")
    parser.add_argument("--only", default=None, help="Comma list of tile names")
    return parser.parse_args()


def load_roads(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text())


def degree_one_nodes(roads: dict[str, Any]) -> list[tuple[float, float]]:
    degree: dict[str, int] = {}
    for edge in roads["edges"]:
        degree[edge["from"]] = degree.get(edge["from"], 0) + 1
        degree[edge["to"]] = degree.get(edge["to"], 0) + 1
    return [(node["x"], node["y"]) for node in roads["nodes"] if degree.get(node["id"], 0) == 1]


def water_outline(water_path: Path, canonical_size: int) -> np.ndarray | None:
    """Canonical-px coordinates of the water mask's boundary pixels."""
    if not water_path.exists():
        return None
    mask = np.asarray(Image.open(water_path).convert("L")) >= 128
    scale = canonical_size / mask.shape[1]
    inner = mask.copy()
    inner[1:, :] &= mask[:-1, :]
    inner[:-1, :] &= mask[1:, :]
    inner[:, 1:] &= mask[:, :-1]
    inner[:, :-1] &= mask[:, 1:]
    ys, xs = np.nonzero(mask & ~inner)
    return np.column_stack((xs * scale, ys * scale))


def draw_edges(draw: ImageDraw.ImageDraw, roads: dict[str, Any], origin: tuple[int, int], size: int, factor: float, override=None) -> int:
    x0, y0 = origin
    drawn = 0
    for edge in roads["edges"]:
        points = edge["points"]
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        if max(xs) < x0 or min(xs) > x0 + size or max(ys) < y0 or min(ys) > y0 + size:
            continue
        colour = override or (COLOURS["bridge"] if edge.get("bridge") else COLOURS.get(edge["class"], COLOURS["sub"]))
        width = 4 if edge.get("bridge") else (3 if edge["class"] == "main" else 2)
        draw.line([((x - x0) * factor, (y - y0) * factor) for x, y in points], fill=colour, width=width, joint="curve")
        drawn += 1
    return drawn


def main() -> None:
    args = parse_args()
    manifest = load_manifest(args.manifest)
    canonical_zoom = manifest.get("canonicalZoom", manifest["maxNativeZoom"])
    factor = 2 ** (args.zoom - canonical_zoom)
    roads = load_roads(args.roads)
    compare = load_roads(args.compare) if args.compare else None
    dead_ends = degree_one_nodes(roads)
    outline = None if args.no_water else water_outline(args.water, manifest["width"])
    bounds = [int(v) for v in (args.bounds or ",".join(str(v) for v in manifest["bounds"])).split(",")]
    x_start, y_start, x_end, y_end = bounds
    only = set(args.only.split(",")) if args.only else None
    args.out.mkdir(parents=True, exist_ok=True)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 22)
    except OSError:
        font = ImageFont.load_default()

    written = []
    for row, y0 in enumerate(range(y_start, y_end, args.tile)):
        for col, x0 in enumerate(range(x_start, x_end, args.tile)):
            name = f"r{row}-c{col}"
            if only and name not in only:
                continue
            size = args.tile
            crop = stitch_region(args.tiles, args.zoom, x0 * factor, y0 * factor, (x0 + size) * factor, (y0 + size) * factor)
            draw = ImageDraw.Draw(crop)
            if outline is not None:
                inside = outline[(outline[:, 0] >= x0) & (outline[:, 0] < x0 + size) & (outline[:, 1] >= y0) & (outline[:, 1] < y0 + size)]
                for x, y in inside:
                    draw.point(((x - x0) * factor, (y - y0) * factor), fill=COLOURS["water"])
            if compare is not None:
                draw_edges(draw, compare, (x0, y0), size, factor, COLOURS["compare"])
            drawn = draw_edges(draw, roads, (x0, y0), size, factor)
            if drawn == 0 and compare is None:
                continue
            for x, y in dead_ends:
                if x0 <= x < x0 + size and y0 <= y < y0 + size:
                    px, py = (x - x0) * factor, (y - y0) * factor
                    draw.ellipse((px - 6, py - 6, px + 6, py + 6), outline=COLOURS["dead_end"], width=2)
            label = f"{name}  origin=({x0},{y0})  tile={size}px canonical, zoom {args.zoom}"
            draw.rectangle((0, 0, 12 + 13 * len(label), 30), fill=(0, 0, 0))
            draw.text((6, 4), label, fill=(255, 255, 255), font=font)
            path = args.out / f"{name}.png"
            crop.save(path, optimize=True)
            written.append(path)
    print(f"Wrote {len(written)} tiles to {args.out}")
    for path in written:
        print(f"  {path.name}")


if __name__ == "__main__":
    main()

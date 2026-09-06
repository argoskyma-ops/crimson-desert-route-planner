#!/usr/bin/env python3
"""Download teleports and named places onto the canonical map (D11).

Reads The Hidden Gaming Lair's Continent of Pywel map page for the Leaflet
tile transformation and the OpenWorld nodes URL, pulls the node dump, keeps
Nexus / Cresset / Gate / Bonfire plus named camps, villages, hearths and
map labels, drops Abyss-local leftovers near the world origin, and writes
data/fast-travel.json in zoom-4 pixels.

    .venv/bin/python scripts/fetch-fast-travel.py
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path

from thgl import (
    IMAGE_SIZE,
    MAP_PAGE,
    ORIGIN_RADIUS,
    fetch_text,
    in_image,
    iter_cbor_records,
    parse_nodes_url,
    parse_transform,
    round1,
    unescape_page,
    world_to_canonical,
)

ROOT = Path(__file__).resolve().parents[1]
# Skip a painted label when a named place already sits this close (canonical px).
LABEL_DEDUP_PX = 80.0

TYPE_FROM_RAW = {
    "abyss_nexus": "nexus",
    "abyss_cresset": "cresset",
    "abyss_gate": "gate",
    "bonfire": "bonfire",
}
TYPE_LABEL = {
    "nexus": "Abyss Nexus",
    "cresset": "Abyss Cresset",
    "gate": "Abyss Gate",
    "bonfire": "Bonfire",
}
# CBOR records use th.gl ids like camp_380; map those prefixes onto D11 types.
PLACE_FROM_PREFIX = {
    "camp": "camp",
    "village": "village",
    "castle": "place",
    "town": "place",
    "rest_area": "hearth",
}
COORD_RE = re.compile(
    r"(abyss_nexus|abyss_cresset|abyss_gate|bonfire)@(-?\d+(?:\.\d+)?):(-?\d+(?:\.\d+)?)"
)
NAME_RE = re.compile(
    r'"((?:abyss_nexus|abyss_cresset|abyss_gate|bonfire)@-?\d+(?:\.\d+)?:-?\d+(?:\.\d+)?)"'
    r"\s*:\s*"
    r'"([^"]+)"'
)
PLACE_NAME_RE = re.compile(
    r'"((?:camp|village|castle|town|rest_area|region)_[^"]+)"\s*:\s*"([^"]+)"'
)
# Painted labels: "position":[worldY, worldX] (D14). First number is Y.
LABEL_RE = re.compile(
    r'"position":\[(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\],"text":"([^"]+)"'
)
# Region centres: "center":[worldY, worldX] (D14). First number is Y.
REGION_RE = re.compile(
    r'\{"id":"(region_[^"]+)","center":\[([^,]+),([^,\]]+)'
)
PLACE_ID_RE = re.compile(
    r"^(camp|village|castle|town|rest_area)_(\d+)$"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out",
        type=Path,
        default=ROOT / "data" / "fast-travel.json",
    )
    return parser.parse_args()


def parse_names(html: str) -> dict[str, str]:
    names: dict[str, str] = {}
    for key, raw in NAME_RE.findall(html):
        if raw.startswith("@"):
            continue
        names[key] = raw
    return names


def parse_place_names(html: str) -> dict[str, str]:
    names: dict[str, str] = {}
    for key, raw in PLACE_NAME_RE.findall(html):
        if raw.startswith("@"):
            continue
        names[key] = raw
    return names


def display_name(raw_type: str, key: str, names: dict[str, str]) -> str:
    mapped = names.get(key)
    if mapped:
        return mapped
    return TYPE_LABEL[TYPE_FROM_RAW[raw_type]]


def collect_teleports(
    raw: str,
    names: dict[str, str],
    transform: tuple[float, float, float, float],
) -> list[dict[str, object]]:
    seen: set[str] = set()
    locations: list[dict[str, object]] = []
    for raw_type, xs, ys in COORD_RE.findall(raw):
        world_x = float(xs)
        world_y = float(ys)
        if math.hypot(world_x, world_y) < ORIGIN_RADIUS:
            continue
        x, y = world_to_canonical(world_x, world_y, transform)
        if not in_image(x, y):
            continue
        loc_type = TYPE_FROM_RAW[raw_type]
        key = f"{raw_type}@{xs}:{ys}"
        loc_id = f"{loc_type}:{xs}:{ys}"
        if loc_id in seen:
            continue
        seen.add(loc_id)
        locations.append(
            {
                "id": loc_id,
                "type": loc_type,
                "name": display_name(raw_type, key, names),
                "x": round1(x),
                "y": round1(y),
            }
        )
    return locations


def collect_cbor_places(
    raw: bytes,
    names: dict[str, str],
    transform: tuple[float, float, float, float],
) -> list[dict[str, object]]:
    """Named camps, villages, castles, towns and hearths from tagged CBOR records.

    Each record is ``[id, [worldY, worldX, z]]`` (D14). Id suffixes such as
    ``mine_blacksmith@-3065.98:-4582.23`` encode X:Y and match coords[1]:coords[0].
    """
    locations: list[dict[str, object]] = []
    seen: set[str] = set()
    for ident, coords in iter_cbor_records(raw):
        match = PLACE_ID_RE.match(ident)
        if not match:
            continue
        prefix, numeric = match.group(1), match.group(2)
        loc_type = PLACE_FROM_PREFIX[prefix]
        name = names.get(ident)
        if not name:
            continue
        world_x = float(coords[1])
        world_y = float(coords[0])
        if math.hypot(world_x, world_y) < ORIGIN_RADIUS:
            continue
        x, y = world_to_canonical(world_x, world_y, transform)
        if not in_image(x, y):
            continue
        loc_id = f"{loc_type}:{numeric}"
        if loc_id in seen:
            continue
        seen.add(loc_id)
        locations.append(
            {
                "id": loc_id,
                "type": loc_type,
                "name": name,
                "x": round1(x),
                "y": round1(y),
            }
        )
    return locations


def near_named(locations: list[dict[str, object]], name: str, x: float, y: float) -> bool:
    needle = name.casefold()
    for loc in locations:
        if str(loc["name"]).casefold() != needle:
            continue
        dx = float(loc["x"]) - x
        dy = float(loc["y"]) - y
        if dx * dx + dy * dy <= LABEL_DEDUP_PX * LABEL_DEDUP_PX:
            return True
    return False


def collect_labels(
    html: str,
    transform: tuple[float, float, float, float],
    existing: list[dict[str, object]],
) -> list[dict[str, object]]:
    """Painted map labels. ``LABEL_RE`` captures ``"position":[worldY, worldX]`` as ``(xs, ys, name)``."""
    locations: list[dict[str, object]] = []
    seen: set[str] = set()
    for xs, ys, name in LABEL_RE.findall(html):
        world_x = float(ys)
        world_y = float(xs)
        if math.hypot(world_x, world_y) < ORIGIN_RADIUS:
            continue
        x, y = world_to_canonical(world_x, world_y, transform)
        if not in_image(x, y):
            continue
        if near_named(existing, name, x, y):
            continue
        slug = re.sub(r"[^a-z0-9]+", "-", name.casefold()).strip("-")
        loc_id = f"place:{slug}"
        if not slug or loc_id in seen:
            continue
        seen.add(loc_id)
        locations.append(
            {
                "id": loc_id,
                "type": "place",
                "name": name,
                "x": round1(x),
                "y": round1(y),
            }
        )
    return locations


def collect_regions(
    html: str,
    names: dict[str, str],
    transform: tuple[float, float, float, float],
    existing: list[dict[str, object]],
) -> list[dict[str, object]]:
    """Region centres. ``REGION_RE`` captures ``"center":[worldY, worldX]`` as ``(id, xs, ys)``."""
    locations: list[dict[str, object]] = []
    seen: set[str] = set()
    for key, xs, ys in REGION_RE.findall(html):
        name = names.get(key)
        if not name:
            continue
        world_x = float(ys)
        world_y = float(xs)
        if math.hypot(world_x, world_y) < ORIGIN_RADIUS:
            continue
        x, y = world_to_canonical(world_x, world_y, transform)
        if not in_image(x, y):
            continue
        if near_named(existing, name, x, y):
            continue
        loc_id = f"place:{key}"
        if loc_id in seen:
            continue
        seen.add(loc_id)
        locations.append(
            {
                "id": loc_id,
                "type": "place",
                "name": name,
                "x": round1(x),
                "y": round1(y),
            }
        )
    return locations


def serialize(locations: list[dict[str, object]]) -> str:
    lines = [
        "{",
        '  "version": 1,',
        f'  "imageSize": [{IMAGE_SIZE}, {IMAGE_SIZE}],',
        '  "source": "SOURCE.md",',
        '  "locations": [',
    ]
    for index, loc in enumerate(locations):
        comma = "," if index < len(locations) - 1 else ""
        lines.append(f"    {json.dumps(loc, ensure_ascii=False)}{comma}")
    lines.append("  ]")
    lines.append("}")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    args = parse_args()
    print(f"Fetching {MAP_PAGE}")
    html = unescape_page(fetch_text(MAP_PAGE))
    transform = parse_transform(html)
    teleport_names = parse_names(html)
    place_names = parse_place_names(html)
    nodes_url = parse_nodes_url(html)
    if nodes_url is None:
        print("Map page had no OpenWorld nodes path", file=sys.stderr)
        sys.exit(1)
    print(f"Fetching {nodes_url}")
    raw_bytes = fetch_text(nodes_url)
    raw_text = raw_bytes.decode("latin1")
    locations = collect_teleports(raw_text, teleport_names, transform)
    locations.extend(collect_cbor_places(raw_bytes, place_names, transform))
    locations.extend(collect_labels(html, transform, locations))
    locations.extend(collect_regions(html, place_names, transform, locations))
    locations.sort(key=lambda loc: (str(loc["type"]), float(loc["y"]), float(loc["x"])))
    counts: dict[str, int] = {}
    for loc in locations:
        kind = str(loc["type"])
        counts[kind] = counts.get(kind, 0) + 1
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(serialize(locations), encoding="utf-8")
    summary = ", ".join(f"{counts.get(kind, 0)} {kind}" for kind in sorted(counts))
    print(f"Wrote {args.out} ({len(locations)} points: {summary})")


if __name__ == "__main__":
    main()

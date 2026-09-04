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
import struct
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAP_PAGE = "https://crimsondesert.th.gl/maps/Continent%20of%20Pywel"
CDN = "https://cdn.th.gl/crimson-desert"
# Fallback: tilesConfig.OpenWorld.transformation from the 2026-09-03 pyramid
# (OpenWorld-25391853dd739b8fd7d28d6280f02d15). Leaflet L.Transformation at z0.
FALLBACK_TRANSFORM = (
    0.026307676497790568,
    431.0512794162984,
    -0.026307676497790568,
    215.5651012228959,
)
CANONICAL_ZOOM = 4
IMAGE_SIZE = 512 * 2**CANONICAL_ZOOM
# Abyss-map leftovers sit near the Unreal origin and pile up on the east
# padding. Real Pywel teleports are thousands of world units out.
ORIGIN_RADIUS = 2000.0
# Skip a painted label when a named place already sits this close (canonical px).
LABEL_DEDUP_PX = 80.0
USER_AGENT = "crimson-desert-route-planner/1.0 (personal offline route planner)"

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
LABEL_RE = re.compile(
    r'"position":\[(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\],"text":"([^"]+)"'
)
REGION_RE = re.compile(
    r'\{"id":"(region_[^"]+)","center":\[([^,]+),([^,\]]+)'
)
PLACE_ID_RE = re.compile(
    r"^(camp|village|castle|town|rest_area)_(\d+)$"
)
TRANSFORM_RE = re.compile(
    r"OpenWorld-[0-9a-f]+.*?transformation(?:\\)?\":\[([^]]+)\]",
    re.DOTALL,
)
NODES_PATH_RE = re.compile(r"(/nodes/OpenWorld\.[0-9a-f]+\.raw)")
# th.gl wraps each [id, [x, y, z]] record in CBOR tag 0xe002.
CBOR_RECORD_TAG = b"\xd9\xe0\x02"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out",
        type=Path,
        default=ROOT / "data" / "fast-travel.json",
    )
    return parser.parse_args()


def fetch_text(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def parse_transform(html: str) -> tuple[float, float, float, float]:
    match = TRANSFORM_RE.search(html)
    if not match:
        print("No transformation on the map page; using the committed pyramid fallback")
        return FALLBACK_TRANSFORM
    parts = [float(piece.strip()) for piece in match.group(1).split(",")]
    if len(parts) != 4:
        print("Unexpected transformation on the map page; using the committed pyramid fallback")
        return FALLBACK_TRANSFORM
    return (parts[0], parts[1], parts[2], parts[3])


def parse_nodes_url(html: str) -> str | None:
    match = NODES_PATH_RE.search(html)
    if not match:
        return None
    return f"{CDN}{match.group(1)}"


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


def world_to_canonical(
    world_x: float,
    world_y: float,
    transform: tuple[float, float, float, float],
) -> tuple[float, float]:
    a, b, c, d = transform
    scale = 2**CANONICAL_ZOOM
    return (a * world_x + b) * scale, (c * world_y + d) * scale


def round1(value: float) -> float:
    return round(value * 10) / 10


def in_image(x: float, y: float) -> bool:
    return 0 <= x <= IMAGE_SIZE and 0 <= y <= IMAGE_SIZE


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


class _Cbor:
    """Enough CBOR to read th.gl's tagged [id, [x, y, z]] place records."""

    def __init__(self, data: bytes) -> None:
        self.data = data
        self.i = 0

    def _u8(self) -> int:
        value = self.data[self.i]
        self.i += 1
        return value

    def _take(self, n: int) -> bytes:
        chunk = self.data[self.i : self.i + n]
        self.i += n
        return chunk

    def _extra(self, addl: int) -> int:
        if addl < 24:
            return addl
        if addl == 24:
            return self._u8()
        if addl == 25:
            return int.from_bytes(self._take(2), "big")
        if addl == 26:
            return int.from_bytes(self._take(4), "big")
        if addl == 27:
            return int.from_bytes(self._take(8), "big")
        raise ValueError(f"unsupported additional info {addl}")

    def decode(self) -> object:
        first = self._u8()
        major, addl = first >> 5, first & 0x1F
        if major == 0:
            return self._extra(addl)
        if major == 1:
            return -1 - self._extra(addl)
        if major == 2:
            return self._take(self._extra(addl))
        if major == 3:
            return self._take(self._extra(addl)).decode("utf-8", errors="replace")
        if major == 4:
            return [self.decode() for _ in range(self._extra(addl))]
        if major == 5:
            obj: dict[object, object] = {}
            for _ in range(self._extra(addl)):
                key = self.decode()
                obj[key] = self.decode()
            return obj
        if major == 6:
            self._extra(addl)
            return self.decode()
        if addl == 26:
            return struct.unpack(">f", self._take(4))[0]
        if addl == 27:
            return struct.unpack(">d", self._take(8))[0]
        if addl in (20, 21, 22, 23):
            return {20: False, 21: True, 22: None, 23: None}[addl]
        raise ValueError(f"unsupported CBOR simple {addl}")


def collect_cbor_places(
    raw: bytes,
    names: dict[str, str],
    transform: tuple[float, float, float, float],
) -> list[dict[str, object]]:
    locations: list[dict[str, object]] = []
    seen: set[str] = set()
    index = 0
    while True:
        start = raw.find(CBOR_RECORD_TAG, index)
        if start < 0:
            break
        reader = _Cbor(raw[start:])
        try:
            value = reader.decode()
        except (ValueError, IndexError, struct.error):
            index = start + 1
            continue
        index = start + reader.i
        if not (
            isinstance(value, list)
            and len(value) == 2
            and isinstance(value[0], str)
            and isinstance(value[1], list)
            and len(value[1]) >= 2
        ):
            continue
        ident = value[0]
        match = PLACE_ID_RE.match(ident)
        if not match:
            continue
        prefix, numeric = match.group(1), match.group(2)
        loc_type = PLACE_FROM_PREFIX[prefix]
        name = names.get(ident)
        if not name:
            continue
        coords = value[1]
        if not all(isinstance(item, (int, float)) for item in coords[:2]):
            continue
        world_x, world_y = float(coords[0]), float(coords[1])
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
    locations: list[dict[str, object]] = []
    seen: set[str] = set()
    for xs, ys, name in LABEL_RE.findall(html):
        world_x, world_y = float(xs), float(ys)
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
    locations: list[dict[str, object]] = []
    seen: set[str] = set()
    for key, xs, ys in REGION_RE.findall(html):
        name = names.get(key)
        if not name:
            continue
        world_x, world_y = float(xs), float(ys)
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
    html = fetch_text(MAP_PAGE).decode("utf-8", errors="replace").replace('\\"', '"')
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

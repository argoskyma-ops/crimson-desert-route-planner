#!/usr/bin/env python3
"""Download every OpenWorld point of interest onto the canonical map (D14).

Reads The Hidden Gaming Lair's Continent of Pywel map page for the Leaflet
tile transformation, the filters taxonomy and the name dictionary, pulls the
OpenWorld node dump, drops Abyss-local leftovers near the world origin and
points outside the image, and writes data/pois.json in zoom-4 pixels.

    .venv/bin/python scripts/fetch-pois.py
    .venv/bin/python scripts/fetch-pois.py --page-file page.html --nodes-file nodes.raw
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from datetime import date
from pathlib import Path

from thgl import (
    IMAGE_SIZE,
    MAP_PAGE,
    ORIGIN_RADIUS,
    fetch_text,
    in_image,
    iter_cbor_records,
    parse_label_pairs,
    parse_nodes_url,
    parse_transform,
    resolve_label,
    round1,
    title_case_id,
    unescape_page,
    world_to_canonical,
)

ROOT = Path(__file__).resolve().parents[1]
NUMERIC_SUFFIX_RE = re.compile(r"_\d+$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out",
        type=Path,
        default=ROOT / "data" / "pois.json",
    )
    parser.add_argument(
        "--page-file",
        type=Path,
        default=None,
        help="Read the map page from disk instead of the network",
    )
    parser.add_argument(
        "--nodes-file",
        type=Path,
        default=None,
        help="Read the OpenWorld node dump from disk instead of the network",
    )
    return parser.parse_args()


def parse_filters(html: str) -> list[object]:
    needle = '"filters":['
    start = html.find(needle)
    if start < 0:
        print("Map page had no filters array", file=sys.stderr)
        sys.exit(1)
    open_at = start + len('"filters":')
    depth = 0
    in_string = False
    escape = False
    end: int | None = None
    for index in range(open_at, len(html)):
        char = html[index]
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == "[":
            depth += 1
        elif char == "]":
            depth -= 1
            if depth == 0:
                end = index + 1
                break
    if end is None:
        print("Map page filters array was unclosed", file=sys.stderr)
        sys.exit(1)
    try:
        data = json.loads(html[open_at:end])
    except json.JSONDecodeError:
        print("Map page filters array was not valid JSON", file=sys.stderr)
        sys.exit(1)
    if not isinstance(data, list):
        print("Map page filters was not a list", file=sys.stderr)
        sys.exit(1)
    return data


def taxonomy_type_ids(filters: list[object]) -> set[str]:
    ids: set[str] = set()
    for item in filters:
        if not isinstance(item, dict):
            continue
        values = item.get("values")
        if not isinstance(values, list):
            continue
        for value in values:
            if not isinstance(value, dict):
                continue
            type_id = value.get("id")
            if isinstance(type_id, str) and type_id:
                ids.add(type_id)
    return ids


def record_type(ident: str) -> str:
    at = ident.find("@")
    if at >= 0:
        return ident[:at]
    return NUMERIC_SUFFIX_RE.sub("", ident)


def build_groups(
    filters: list[object],
    pairs: dict[str, str],
    kept_types: set[str],
) -> tuple[list[dict[str, object]], int, int]:
    groups: list[dict[str, object]] = []
    dropped_types = 0
    dropped_groups = 0
    for item in filters:
        if not isinstance(item, dict):
            continue
        group_id = item.get("group")
        if not isinstance(group_id, str) or not group_id:
            continue
        values = item.get("values")
        if not isinstance(values, list):
            continue
        types: list[dict[str, str]] = []
        for value in values:
            if not isinstance(value, dict):
                continue
            type_id = value.get("id")
            if not isinstance(type_id, str) or not type_id:
                continue
            if type_id not in kept_types:
                dropped_types += 1
                continue
            types.append(
                {
                    "id": type_id,
                    "label": resolve_label(pairs, type_id) or title_case_id(type_id),
                }
            )
        if not types:
            dropped_groups += 1
            continue
        default_on = item.get("defaultOn")
        category = item.get("category")
        groups.append(
            {
                "id": group_id,
                "label": resolve_label(pairs, group_id) or title_case_id(group_id),
                "defaultOn": default_on if isinstance(default_on, bool) else False,
                "category": category if isinstance(category, str) else "",
                "types": types,
            }
        )
    return groups, dropped_types, dropped_groups


def serialize(
    groups: list[dict[str, object]],
    nodes: list[dict[str, object]],
    fetched: str,
) -> str:
    group_json = json.dumps(groups, ensure_ascii=False, indent=2)
    group_block = group_json.replace("\n", "\n  ")
    lines = [
        "{",
        '  "version": 1,',
        f'  "imageSize": [{IMAGE_SIZE}, {IMAGE_SIZE}],',
        '  "source": "SOURCE.md",',
        f'  "fetched": {json.dumps(fetched)},',
        f'  "groups": {group_block},',
        '  "nodes": [',
    ]
    for index, node in enumerate(nodes):
        comma = "," if index < len(nodes) - 1 else ""
        lines.append(f"    {json.dumps(node, ensure_ascii=False)}{comma}")
    lines.append("  ]")
    lines.append("}")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    args = parse_args()
    if args.page_file is not None:
        print(f"Reading {args.page_file}")
        page_bytes = args.page_file.read_bytes()
    else:
        print(f"Fetching {MAP_PAGE}")
        page_bytes = fetch_text(MAP_PAGE)
    html = unescape_page(page_bytes)
    transform = parse_transform(html)
    nodes_url = parse_nodes_url(html)
    if nodes_url is None:
        print("Map page had no OpenWorld nodes path", file=sys.stderr)
        sys.exit(1)
    filters = parse_filters(html)
    pairs = parse_label_pairs(html)
    declared_types = taxonomy_type_ids(filters)

    if args.nodes_file is not None:
        print(f"Reading {args.nodes_file}")
        raw_bytes = args.nodes_file.read_bytes()
    else:
        print(f"Fetching {nodes_url}")
        raw_bytes = fetch_text(nodes_url)

    records_read = 0
    dropped_origin = 0
    dropped_image = 0
    dropped_unknown = 0
    seen: set[str] = set()
    nodes: list[dict[str, object]] = []
    kept_types: set[str] = set()
    for ident, coords in iter_cbor_records(raw_bytes):
        records_read += 1
        world_x = coords[1]
        world_y = coords[0]
        if math.hypot(world_x, world_y) < ORIGIN_RADIUS:
            dropped_origin += 1
            continue
        x, y = world_to_canonical(world_x, world_y, transform)
        if not in_image(x, y):
            dropped_image += 1
            continue
        node_type = record_type(ident)
        if node_type not in declared_types:
            dropped_unknown += 1
            continue
        if ident in seen:
            continue
        seen.add(ident)
        kept_types.add(node_type)
        node: dict[str, object] = {
            "id": ident,
            "type": node_type,
            "x": round1(x),
            "y": round1(y),
        }
        name = resolve_label(pairs, ident)
        if name:
            node["name"] = name
        nodes.append(node)

    groups, dropped_types, dropped_groups = build_groups(filters, pairs, kept_types)
    nodes.sort(key=lambda item: (str(item["type"]), float(item["y"]), float(item["x"]), str(item["id"])))

    type_to_group: dict[str, str] = {}
    for group in groups:
        for type_info in group["types"]:
            type_to_group[str(type_info["id"])] = str(group["id"])
    group_counts = {str(group["id"]): 0 for group in groups}
    named = 0
    for node in nodes:
        if "name" in node:
            named += 1
        group_id = type_to_group.get(str(node["type"]))
        if group_id is not None:
            group_counts[group_id] = group_counts.get(group_id, 0) + 1

    fetched = date.today().isoformat()
    args.out.parent.mkdir(parents=True, exist_ok=True)
    tmp = Path(str(args.out) + ".tmp")
    tmp.write_text(serialize(groups, nodes, fetched), encoding="utf-8")
    tmp.replace(args.out)

    print(f"Records read: {records_read}")
    print(f"Dropped near origin: {dropped_origin}")
    print(f"Dropped outside the image: {dropped_image}")
    print(f"Dropped unknown type: {dropped_unknown}")
    print(f"Dropped {dropped_types} types with no nodes")
    print(f"Dropped {dropped_groups} empty groups")
    print(f"Nodes written: {len(nodes)}")
    print(f"Nodes with a name: {named}")
    for group in groups:
        group_id = str(group["id"])
        print(f"  {group_id}: {group_counts[group_id]}")
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()

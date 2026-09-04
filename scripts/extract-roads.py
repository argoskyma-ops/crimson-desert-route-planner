#!/usr/bin/env python3
"""Extract the Crimson Desert road graph from the th.gl world-map tiles.

Source: the 512 px WebP tile pyramid fetched by scripts/fetch-tiles.py (see
SOURCE.md).  It is a clean render of the game world: roads are neutral grey ink
(about 150-160) on beige land (about 203,201,195), rivers and sea are teal, and
there are no labels or icons.  Roads are drawn *over* water, so a bridge is
simply road ink across the water mask.

Pipeline: stitch the Pywel window at --zoom -> grey-ink mask (thick roads and
thin paths share the ink colour; paths are just narrower) -> optional Sato
ridge pass for very faint paths -> close 1 px breaks -> skeletonize -> sknw
junction graph -> prune spurs, fragments, self-loops and clutter rings -> close
T-junctions and small gaps -> split edges where they cross water and flag those
pieces ``"bridge": true`` -> simplify -> classify main/sub by stroke width ->
write data/roads.json in canonical coordinates plus data/water-mask.png.

Coordinates (docs/DECISIONS.md D3): canonical space is the zoom-4 pixel grid of
the pyramid, 8192 x 8192, x right, y down.  Extraction runs at --zoom (default 5,
twice the canonical resolution) inside --bounds (canonical px; default is the
Pywel frame of the in-game map plus a margin) and divides by 2**(zoom-4).

Tuning:
  * --ink-min/--ink-max/--ink-chroma bound the road-ink colour.  Town outlines
    and farm parcels are lighter warm greys (~180); mountain hatching is
    lighter still, so --ink-max separates them.
  * --ridge-low/--ridge-high (with --ridge) add a dark-ridge response for faint
    paths; --ridge-density drops dense clutter.
  * --main-radius: median distance-transform half-width (at --zoom) at or above
    which an edge is ``main``.  Thick roads are ~5 px wide at zoom 5, paths ~2.
  * --spur-length, --component-length, --max-self-loop,
    --closed-component-length remove skeleton junk; --junction-snap,
    --bridge-gap/--bridge-angle and --closed-attach reconnect fragments.
  * --crossing-gap joins facing road ends across water; off by default because
    this source draws bridges explicitly.
  * --bridge-min-length ignores wet runs shorter than this when splitting.
"""

from __future__ import annotations

import argparse
import gc
import json
import math
from collections import Counter
from pathlib import Path
from typing import Any, Iterable

import networkx as nx
import numpy as np
import sknw
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from scipy.spatial import cKDTree
from shapely.geometry import LineString
from skimage import filters, morphology

from tiles import DEFAULT_MANIFEST, DEFAULT_TILES, load_manifest, stitch_region

Image.MAX_IMAGE_PIXELS = None

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "data/roads.json"
DEFAULT_DEBUG = ROOT / "data/map/roads-debug.png"
DEFAULT_WATER_OUTPUT = ROOT / "data/water-mask.png"
CANONICAL_ZOOM = 4
CANONICAL_SIZE = 512 * 2**CANONICAL_ZOOM  # 8192
# The in-game full map (PowerPyx frame) mapped into canonical px, plus margin;
# see docs/DECISIONS.md D1.  Everything outside is unexplored by this tool.
DEFAULT_BOUNDS = "1024,1544,6248,6832"
WATER_MASK_ZOOM = 3


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tiles", type=Path, default=DEFAULT_TILES)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--debug", type=Path, default=DEFAULT_DEBUG)
    parser.add_argument("--zoom", type=int, default=5, help="Extraction zoom level")
    parser.add_argument(
        "--bounds",
        default=DEFAULT_BOUNDS,
        help="x0,y0,x1,y1 window in canonical (zoom-4) px; snapped to multiples of 8",
    )
    parser.add_argument("--ink-min", type=float, default=128.0)
    parser.add_argument("--ink-max", type=float, default=172.0)
    parser.add_argument("--ink-chroma", type=int, default=10)
    parser.add_argument(
        "--close-radius",
        type=int,
        default=1,
        help="Morphological closing disk radius (keep at 1-2 pixels)",
    )
    parser.add_argument("--min-mask-object", type=int, default=12)
    parser.add_argument("--ridge", action="store_true", help="Add the ridge pass")
    parser.add_argument("--ridge-sigmas", default="1.0,1.5,2.0")
    parser.add_argument("--ridge-low", type=float, default=6.0)
    parser.add_argument("--ridge-high", type=float, default=14.0)
    parser.add_argument("--ridge-window", type=int, default=41)
    parser.add_argument("--ridge-density", type=float, default=0.2)
    parser.add_argument("--spur-length", type=float, default=16.0)
    parser.add_argument("--component-length", type=float, default=80.0)
    parser.add_argument("--merge-distance", type=float, default=2.0)
    parser.add_argument("--junction-snap", type=float, default=24.0)
    parser.add_argument("--bridge-gap", type=float, default=40.0)
    parser.add_argument("--bridge-angle", type=float, default=40.0)
    parser.add_argument("--bridge-plain-run", type=int, default=20)
    parser.add_argument("--crossing-gap", type=float, default=0.0)
    parser.add_argument("--crossing-angle", type=float, default=30.0)
    parser.add_argument("--max-self-loop", type=float, default=100.0)
    parser.add_argument("--closed-component-length", type=float, default=240.0)
    parser.add_argument("--closed-attach", type=float, default=60.0)
    parser.add_argument("--bridge-min-length", type=float, default=6.0)
    parser.add_argument("--simplify", type=float, default=1.2)
    parser.add_argument(
        "--main-radius",
        type=float,
        default=1.9,
        help="Median mask half-width (px at --zoom) at or above which an edge is main",
    )
    parser.add_argument("--water-output", type=Path, default=DEFAULT_WATER_OUTPUT)
    parser.add_argument(
        "--legacy",
        type=Path,
        default=None,
        help="roads.json from the retired PowerPyx map; import its trails that this map lacks",
    )
    parser.add_argument(
        "--legacy-transform",
        default="0.97,1120,1640",
        help="scale,dx,dy mapping legacy px into canonical px (D1)",
    )
    parser.add_argument("--legacy-clearance", type=float, default=12.0,
                        help="A legacy sample nearer than this (px at --zoom) to a new road is covered")
    parser.add_argument("--legacy-novel-fraction", type=float, default=0.8)
    parser.add_argument("--legacy-min-length", type=float, default=300.0,
                        help="Drop novel legacy pieces shorter than this (px at --zoom)")
    parser.add_argument("--legacy-min-extent", type=float, default=120.0,
                        help="Drop novel legacy pieces whose bounding box is smaller than this (hatching loops)")
    return parser.parse_args()


def parse_bounds(text: str) -> tuple[int, int, int, int]:
    values = [int(v) for v in text.split(",")]
    if len(values) != 4:
        raise ValueError("--bounds needs x0,y0,x1,y1")
    x0, y0, x1, y1 = values
    x0, y0 = (x0 // 8) * 8, (y0 // 8) * 8
    x1, y1 = -(-x1 // 8) * 8, -(-y1 // 8) * 8
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(CANONICAL_SIZE, x1), min(CANONICAL_SIZE, y1)
    if x1 <= x0 or y1 <= y0:
        raise ValueError("--bounds is empty")
    return x0, y0, x1, y1


def build_water_mask(rgb: np.ndarray) -> np.ndarray:
    """Teal sea, lake and river pixels (about 80,110,120)."""
    rgb16 = rgb.astype(np.int16)
    red, green, blue = rgb16[:, :, 0], rgb16[:, :, 1], rgb16[:, :, 2]
    intensity = rgb.astype(np.float32).mean(axis=2)
    water = (blue >= red + 18) & (green >= red + 10) & (intensity <= 150.0)
    del rgb16, red, green, blue, intensity
    water = morphology.remove_small_holes(water, max_size=64)
    water = morphology.remove_small_objects(water, max_size=48)
    return np.asarray(water, dtype=bool)


def write_water_mask(
    water: np.ndarray, output_path: Path, origin_at_zoom: tuple[int, int], zoom: int
) -> None:
    """Binary PNG (255 = water) of the whole canonical map at zoom WATER_MASK_ZOOM."""
    factor = 2 ** (zoom - WATER_MASK_ZOOM)
    height, width = water.shape
    pooled_h, pooled_w = height // factor, width // factor
    pooled = water[: pooled_h * factor, : pooled_w * factor]
    pooled = pooled.reshape(pooled_h, factor, pooled_w, factor).any(axis=(1, 3))
    size = 512 * 2**WATER_MASK_ZOOM
    canvas = np.zeros((size, size), dtype=np.uint8)
    x0, y0 = origin_at_zoom[0] // factor, origin_at_zoom[1] // factor
    canvas[y0 : y0 + pooled_h, x0 : x0 + pooled_w] = pooled.astype(np.uint8) * 255
    output_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(canvas, mode="L").save(output_path, optimize=True)


def build_ink_mask(rgb: np.ndarray, args: argparse.Namespace) -> np.ndarray:
    """Neutral grey road ink, on land and over water alike."""
    rgb16 = rgb.astype(np.int16)
    chroma = rgb16.max(axis=2) - rgb16.min(axis=2)
    intensity = rgb.astype(np.float32).mean(axis=2)
    mask = (chroma <= args.ink_chroma) & (intensity >= args.ink_min) & (intensity <= args.ink_max)
    del rgb16, chroma, intensity
    if args.close_radius:
        mask = morphology.closing(mask, footprint=morphology.disk(args.close_radius))
    if args.min_mask_object > 1:
        mask = morphology.remove_small_objects(mask, max_size=args.min_mask_object - 1)
    return np.asarray(mask, dtype=bool)


def parse_sigmas(text: str) -> list[float]:
    sigmas = [float(value) for value in text.split(",") if value.strip()]
    if not sigmas:
        raise ValueError("--ridge-sigmas needs at least one value")
    return sigmas


def build_ridge_mask(
    rgb: np.ndarray, water: np.ndarray, args: argparse.Namespace
) -> np.ndarray:
    """Multi-scale dark-ridge mask for faint paths the ink band misses."""
    height, width = water.shape
    intensity = rgb.astype(np.float32).mean(axis=2)
    rgb16 = rgb.astype(np.int16)
    chroma = (rgb16.max(axis=2) - rgb16.min(axis=2)).astype(np.uint8)
    del rgb16
    allowed = ~ndi.binary_dilation(water, structure=morphology.disk(3))
    allowed &= (chroma <= 14) & (intensity < 200.0) & (intensity > 110.0)
    del chroma
    sigmas = parse_sigmas(args.ridge_sigmas)
    response = np.zeros((height, width), dtype=np.float32)
    tile, margin = 1024, 32
    for y0 in range(0, height, tile):
        for x0 in range(0, width, tile):
            y1, x1 = min(height, y0 + tile), min(width, x0 + tile)
            ya, xa = max(0, y0 - margin), max(0, x0 - margin)
            yb, xb = min(height, y1 + margin), min(width, x1 + margin)
            local = filters.sato(intensity[ya:yb, xa:xb], sigmas=sigmas, black_ridges=True)
            response[y0:y1, x0:x1] = local[y0 - ya : y1 - ya, x0 - xa : x1 - xa]
    del intensity
    response[~allowed] = 0.0
    del allowed
    mask = filters.apply_hysteresis_threshold(response, args.ridge_low, args.ridge_high)
    del response
    mask = morphology.remove_small_objects(mask, max_size=40)
    density = ndi.uniform_filter(mask.astype(np.float32), args.ridge_window)
    clutter = ndi.binary_dilation(density > args.ridge_density, structure=morphology.disk(3))
    del density
    mask &= ~clutter
    del clutter
    mask = morphology.remove_small_objects(mask, max_size=40)
    gc.collect()
    return np.asarray(mask, dtype=bool)


def build_plain_land_mask(
    rgb: np.ndarray, water: np.ndarray, road_mask: np.ndarray, near_radius: int = 3
) -> np.ndarray:
    """Bright low-chroma land that is not water and not next to road ink."""
    rgb16 = rgb.astype(np.int16)
    intensity = rgb.astype(np.float32).mean(axis=2)
    chroma = rgb16.max(axis=2) - rgb16.min(axis=2)
    near_road = road_mask
    if near_radius > 0:
        near_road = ndi.binary_dilation(road_mask, structure=morphology.disk(near_radius))
    return (intensity >= 188.0) & (chroma <= 16) & ~water & ~near_road


def polyline_length(points_yx: np.ndarray) -> float:
    if len(points_yx) < 2:
        return 0.0
    differences = np.diff(points_yx.astype(np.float64), axis=0)
    return float(np.hypot(differences[:, 0], differences[:, 1]).sum())


def sample_segment_cells(
    start_yx: np.ndarray, end_yx: np.ndarray, height: int, width: int
) -> tuple[np.ndarray, np.ndarray]:
    distance = float(np.linalg.norm(end_yx - start_yx))
    count = max(2, int(math.ceil(distance)))
    ys = np.linspace(start_yx[0], end_yx[0], count)
    xs = np.linspace(start_yx[1], end_yx[1], count)
    rows = np.clip(np.rint(ys).astype(np.int64), 0, height - 1)
    cols = np.clip(np.rint(xs).astype(np.int64), 0, width - 1)
    return rows, cols


def longest_true_run(flags: np.ndarray) -> int:
    longest = current = 0
    for flag in flags.tolist():
        if flag:
            current += 1
            if current > longest:
                longest = current
        else:
            current = 0
    return longest


def classify_bridge_obstruction(
    start_yx: np.ndarray,
    end_yx: np.ndarray,
    water: np.ndarray,
    plain_land: np.ndarray,
    max_plain_run: int,
) -> str | None:
    rows, cols = sample_segment_cells(
        start_yx, end_yx, water.shape[0], water.shape[1]
    )
    if int(water[rows, cols].sum()) >= 3:
        return "water"
    land = plain_land[rows, cols]
    pad = min(10, max(0, len(land) // 4))
    if pad * 2 < len(land):
        land = land[pad:-pad]
    if longest_true_run(land) > max_plain_run:
        return "nonroad"
    return None


def remove_short_skeleton_components(
    skeleton: np.ndarray, minimum_pixels: int
) -> np.ndarray:
    labels, count = ndi.label(skeleton, structure=np.ones((3, 3), dtype=np.uint8))
    sizes = np.bincount(labels.ravel())
    keep = sizes >= minimum_pixels
    keep[0] = False
    result = keep[labels]
    removed = count - int(np.count_nonzero(keep))
    print(f"Skeleton components before graph: {count:,}; removed: {removed:,}")
    return result


def edge_points(data: dict[str, Any]) -> np.ndarray:
    return np.asarray(data["pts"], dtype=np.float64)


def add_edge(graph: nx.MultiGraph, u: int, v: int, points: np.ndarray) -> int:
    return graph.add_edge(
        u,
        v,
        pts=np.asarray(points, dtype=np.float64),
        weight=polyline_length(points),
    )


def normalize_sknw_graph(raw: nx.MultiGraph) -> nx.MultiGraph:
    graph = nx.MultiGraph()
    for node, data in raw.nodes(data=True):
        graph.add_node(int(node), pos=np.asarray(data["o"], dtype=np.float64))
    for u, v, data in raw.edges(data=True):
        points = np.asarray(data["pts"], dtype=np.float64)
        if len(points) >= 2:
            add_edge(graph, int(u), int(v), points)
    return graph


class UnionFind:
    def __init__(self, values: Iterable[int]) -> None:
        self.parent = {value: value for value in values}

    def find(self, value: int) -> int:
        parent = self.parent[value]
        if parent != value:
            self.parent[value] = self.find(parent)
        return self.parent[value]

    def union(self, left: int, right: int) -> None:
        a, b = self.find(left), self.find(right)
        if a != b:
            self.parent[max(a, b)] = min(a, b)


def merge_nearby_nodes(graph: nx.MultiGraph, distance: float) -> nx.MultiGraph:
    if distance <= 0 or graph.number_of_nodes() < 2:
        return graph
    nodes = list(graph.nodes)
    positions = np.vstack([graph.nodes[node]["pos"] for node in nodes])
    union_find = UnionFind(nodes)
    for left_index, right_index in cKDTree(positions).query_pairs(distance):
        union_find.union(nodes[left_index], nodes[right_index])

    groups: dict[int, list[int]] = {}
    for node in nodes:
        groups.setdefault(union_find.find(node), []).append(node)
    if all(len(group) == 1 for group in groups.values()):
        return graph

    merged = nx.MultiGraph()
    mapping: dict[int, int] = {}
    for representative, group in groups.items():
        for node in group:
            mapping[node] = representative
        merged.add_node(
            representative,
            pos=np.mean([graph.nodes[node]["pos"] for node in group], axis=0),
        )
    for u, v, data in graph.edges(data=True):
        mapped_u, mapped_v = mapping[u], mapping[v]
        points = edge_points(data)
        if mapped_u == mapped_v and polyline_length(points) < distance * 2:
            continue
        add_edge(merged, mapped_u, mapped_v, points)
    print(f"Merged {graph.number_of_nodes() - merged.number_of_nodes():,} nearby nodes")
    return merged


def remove_spurs(graph: nx.MultiGraph, maximum_length: float) -> int:
    removed = 0
    while True:
        doomed: list[tuple[int, int, int]] = []
        for u, v, key, data in graph.edges(keys=True, data=True):
            if data["weight"] >= maximum_length:
                continue
            if graph.degree(u) == 1 or graph.degree(v) == 1:
                doomed.append((u, v, key))
        if not doomed:
            break
        for u, v, key in doomed:
            if graph.has_edge(u, v, key):
                graph.remove_edge(u, v, key)
                removed += 1
        graph.remove_nodes_from(list(nx.isolates(graph)))
    return removed


def remove_small_graph_components(graph: nx.MultiGraph, minimum_length: float) -> int:
    removed = 0
    for component in list(nx.connected_components(graph)):
        subgraph = graph.subgraph(component)
        total = sum(float(data["weight"]) for _, _, data in subgraph.edges(data=True))
        if total < minimum_length:
            removed += 1
            graph.remove_nodes_from(component)
    return removed


def endpoint_outward_tangent(
    graph: nx.MultiGraph, node: int, sample_distance: float = 8.0
) -> np.ndarray | None:
    incident = list(graph.edges(node, keys=True, data=True))
    if len(incident) != 1:
        return None
    points = orient_to_node(
        edge_points(incident[0][3]), graph.nodes[node]["pos"], end_at_node=False
    )
    origin = graph.nodes[node]["pos"]
    for point in points[1:]:
        inward = point - origin
        length = float(np.linalg.norm(inward))
        if length >= sample_distance:
            return -inward / length
    if len(points) >= 2:
        inward = points[-1] - origin
        length = float(np.linalg.norm(inward))
        if length > 0:
            return -inward / length
    return None


def collect_aligned_endpoint_pairs(
    graph: nx.MultiGraph, maximum_gap: float, maximum_angle: float
) -> list[tuple[float, float, int, int]]:
    """Return (-score, distance, left, right) pairs that pass the tangent test."""
    if maximum_gap <= 0:
        return []
    endpoints = [node for node in graph.nodes if graph.degree(node) == 1]
    if len(endpoints) < 2:
        return []
    positions = np.vstack([graph.nodes[node]["pos"] for node in endpoints])
    tangents = {
        node: endpoint_outward_tangent(graph, node) for node in endpoints
    }
    cosine_limit = math.cos(math.radians(maximum_angle))
    candidates: list[tuple[float, float, int, int]] = []
    for left_index, right_index in cKDTree(positions).query_pairs(maximum_gap):
        left, right = endpoints[left_index], endpoints[right_index]
        left_tangent, right_tangent = tangents[left], tangents[right]
        if left_tangent is None or right_tangent is None:
            continue
        delta = positions[right_index] - positions[left_index]
        distance = float(np.linalg.norm(delta))
        if distance <= 2.0:
            continue
        direction = delta / distance
        left_alignment = float(np.dot(left_tangent, direction))
        right_alignment = float(np.dot(right_tangent, -direction))
        if left_alignment < cosine_limit or right_alignment < cosine_limit:
            continue
        score = min(left_alignment, right_alignment)
        candidates.append((-score, distance, left, right))
    return candidates


def bridge_aligned_endpoints(
    graph: nx.MultiGraph,
    maximum_gap: float,
    maximum_angle: float,
    water: np.ndarray,
    plain_land: np.ndarray,
    max_plain_run: int,
) -> tuple[int, dict[str, int]]:
    """Join mutually facing endpoints across small icon/text occlusions."""
    rejected = {"water": 0, "nonroad": 0}
    candidates = collect_aligned_endpoint_pairs(
        graph, maximum_gap, maximum_angle
    )
    used: set[int] = set()
    bridges = 0
    for _negative_score, _distance, left, right in sorted(candidates):
        if left in used or right in used:
            continue
        if left not in graph or right not in graph:
            continue
        if graph.degree(left) != 1 or graph.degree(right) != 1:
            continue
        reason = classify_bridge_obstruction(
            graph.nodes[left]["pos"],
            graph.nodes[right]["pos"],
            water,
            plain_land,
            max_plain_run,
        )
        if reason is not None:
            rejected[reason] += 1
            continue
        add_edge(
            graph,
            left,
            right,
            np.vstack([graph.nodes[left]["pos"], graph.nodes[right]["pos"]]),
        )
        used.update((left, right))
        bridges += 1
    return bridges, rejected


def orient_to_node(
    points: np.ndarray, node_pos: np.ndarray, *, end_at_node: bool
) -> np.ndarray:
    start_distance = float(np.linalg.norm(points[0] - node_pos))
    end_distance = float(np.linalg.norm(points[-1] - node_pos))
    starts_at_node = start_distance <= end_distance
    if end_at_node:
        return points[::-1] if starts_at_node else points
    return points if starts_at_node else points[::-1]


def densify_polyline(points: np.ndarray, step: float = 2.0) -> np.ndarray:
    if len(points) == 0:
        return points
    pieces = [points[0]]
    for start, end in zip(points[:-1], points[1:]):
        span = float(np.linalg.norm(end - start))
        if span <= step:
            pieces.append(end)
            continue
        count = max(1, int(math.ceil(span / step)))
        for index in range(1, count + 1):
            pieces.append(start + (end - start) * (index / count))
    return np.asarray(pieces, dtype=np.float64)


def nearest_point_on_polyline(
    points: np.ndarray, query: np.ndarray
) -> tuple[np.ndarray, float, int, float]:
    best_point = points[0]
    best_distance = math.inf
    best_segment = 0
    best_t = 0.0
    for index in range(len(points) - 1):
        start = points[index]
        end = points[index + 1]
        delta = end - start
        denom = float(np.dot(delta, delta))
        if denom <= 1e-12:
            t = 0.0
            projection = start
        else:
            t = float(np.clip(np.dot(query - start, delta) / denom, 0.0, 1.0))
            projection = start + t * delta
        distance = float(np.linalg.norm(query - projection))
        if distance < best_distance:
            best_point = projection
            best_distance = distance
            best_segment = index
            best_t = t
    return np.asarray(best_point, dtype=np.float64), best_distance, best_segment, best_t


def split_polyline(
    points: np.ndarray, projection: np.ndarray, segment_index: int
) -> tuple[np.ndarray, np.ndarray]:
    left = [points[index] for index in range(segment_index + 1)]
    if float(np.linalg.norm(left[-1] - projection)) > 0.25:
        left.append(projection)
    else:
        left[-1] = projection
    right = [projection]
    for index in range(segment_index + 1, len(points)):
        if (
            len(right) == 1
            and float(np.linalg.norm(points[index] - projection)) <= 0.25
        ):
            continue
        right.append(points[index])
    if len(right) < 2:
        right.append(points[-1] if segment_index + 1 < len(points) else projection)
    return (
        np.asarray(left, dtype=np.float64),
        np.asarray(right, dtype=np.float64),
    )


def next_graph_node_id(graph: nx.MultiGraph) -> int:
    return (max(graph.nodes) + 1) if graph.number_of_nodes() else 1


def split_edge_at_point(
    graph: nx.MultiGraph, u: int, v: int, key: int, point: np.ndarray
) -> int | None:
    if not graph.has_edge(u, v, key):
        return None
    u_pos = graph.nodes[u]["pos"]
    v_pos = graph.nodes[v]["pos"]
    if float(np.linalg.norm(point - u_pos)) <= 2.0:
        return u
    if float(np.linalg.norm(point - v_pos)) <= 2.0:
        return v
    points = edge_points(graph.edges[u, v, key])
    if float(np.linalg.norm(points[0] - u_pos)) > float(
        np.linalg.norm(points[-1] - u_pos)
    ):
        points = points[::-1]
    projection, _distance, segment_index, _t = nearest_point_on_polyline(points, point)
    if float(np.linalg.norm(projection - u_pos)) <= 2.0:
        return u
    if float(np.linalg.norm(projection - v_pos)) <= 2.0:
        return v
    left, right = split_polyline(points, projection, segment_index)
    if len(left) < 2 or len(right) < 2:
        return u if float(np.linalg.norm(projection - u_pos)) <= float(
            np.linalg.norm(projection - v_pos)
        ) else v
    new_id = next_graph_node_id(graph)
    graph.add_node(new_id, pos=np.asarray(projection, dtype=np.float64))
    graph.remove_edge(u, v, key)
    add_edge(graph, u, new_id, left)
    add_edge(graph, new_id, v, right)
    return new_id


def attach_endpoint_to_junction(
    graph: nx.MultiGraph, dangling: int, junction: int
) -> bool:
    if dangling == junction or dangling not in graph or junction not in graph:
        return False
    if graph.degree(dangling) != 1:
        return False
    incident = list(graph.edges(dangling, keys=True, data=True))
    if len(incident) != 1:
        return False
    _node, neighbor, key, data = incident[0]
    if neighbor == junction:
        return False
    points = orient_to_node(
        edge_points(data), graph.nodes[dangling]["pos"], end_at_node=True
    )
    target = graph.nodes[junction]["pos"]
    if float(np.linalg.norm(points[-1] - target)) > 0.05:
        points = np.vstack([points, target])
    else:
        points = points.copy()
        points[-1] = target
    graph.remove_edge(dangling, neighbor, key)
    add_edge(graph, neighbor, junction, points)
    if dangling in graph and graph.degree(dangling) == 0:
        graph.remove_node(dangling)
    return True


def close_endpoint_to_edge_junctions(
    graph: nx.MultiGraph, snap_distance: float
) -> int:
    """Extend each degree-1 node onto the nearest forward-facing non-incident edge."""
    if snap_distance <= 0 or graph.number_of_edges() == 0:
        return 0
    closed = 0
    close_range = min(14.0, snap_distance)
    facing_limit = 0.30
    for _round in range(24):
        endpoints = [node for node in graph.nodes if graph.degree(node) == 1]
        if not endpoints:
            break
        samples: list[np.ndarray] = []
        owners: list[tuple[int, int, int]] = []
        for u, v, key, data in graph.edges(keys=True, data=True):
            for point in densify_polyline(edge_points(data), 2.0):
                samples.append(point)
                owners.append((u, v, key))
        if not samples:
            break
        sample_points = np.vstack(samples)
        tree = cKDTree(sample_points)
        snaps: list[tuple[float, int, int, int, int, np.ndarray]] = []
        for node in endpoints:
            origin = graph.nodes[node]["pos"]
            tangent = endpoint_outward_tangent(graph, node)
            indices = tree.query_ball_point(origin, snap_distance)
            best: tuple[float, int, int, int, np.ndarray] | None = None
            seen_edges: set[tuple[int, int, int]] = set()
            for index in indices:
                u, v, key = owners[index]
                edge_id = (u, v, key)
                if edge_id in seen_edges:
                    continue
                seen_edges.add(edge_id)
                if u == node or v == node:
                    continue
                if not graph.has_edge(u, v, key):
                    continue
                points = edge_points(graph.edges[u, v, key])
                projection, distance, _segment, _t = nearest_point_on_polyline(
                    points, origin
                )
                if distance > snap_distance:
                    continue
                direction = projection - origin
                length = float(np.linalg.norm(direction))
                if distance > close_range and length >= 0.25:
                    if tangent is None:
                        continue
                    if float(np.dot(tangent, direction / length)) < facing_limit:
                        continue
                if best is None or distance < best[0]:
                    best = (distance, u, v, key, projection)
            if best is not None:
                distance, u, v, key, projection = best
                snaps.append((distance, node, u, v, key, projection))

        if not snaps:
            break
        used_nodes: set[int] = set()
        used_edges: set[tuple[int, int, int]] = set()
        applied = 0
        for distance, node, u, v, key, projection in sorted(
            snaps, key=lambda item: item[0]
        ):
            if node in used_nodes or node not in graph or graph.degree(node) != 1:
                continue
            edge_id = (u, v, key)
            reverse_id = (v, u, key)
            if edge_id in used_edges or reverse_id in used_edges:
                continue
            if not graph.has_edge(u, v, key):
                continue
            junction = split_edge_at_point(graph, u, v, key, projection)
            if junction is None:
                continue
            if attach_endpoint_to_junction(graph, node, junction):
                used_nodes.add(node)
                used_edges.update((edge_id, reverse_id))
                applied += 1
                closed += 1
        if applied == 0:
            break
    return closed


def bridge_water_crossings(
    graph: nx.MultiGraph,
    water: np.ndarray,
    maximum_gap: float,
    maximum_angle: float,
    bank_distance: float = 20.0,
) -> int:
    """Join facing road ends on opposite banks; the map paints rivers over roads."""
    if maximum_gap <= 0 or graph.number_of_edges() == 0:
        return 0
    to_water = ndi.distance_transform_edt(~water)
    tight_limit = math.cos(math.radians(min(maximum_angle, 18.0)))
    loose_angle = max(maximum_angle, 60.0)
    strict_limit = math.cos(math.radians(maximum_angle))
    candidates = collect_aligned_endpoint_pairs(graph, maximum_gap, loose_angle)
    used: set[int] = set()
    crossings = 0
    for negative_score, distance, left, right in sorted(candidates):
        if left in used or right in used:
            continue
        if left not in graph or right not in graph:
            continue
        if graph.degree(left) != 1 or graph.degree(right) != 1:
            continue
        start = graph.nodes[left]["pos"]
        end = graph.nodes[right]["pos"]
        if (
            to_water[int(round(start[0])), int(round(start[1]))] > bank_distance
            or to_water[int(round(end[0])), int(round(end[1]))] > bank_distance
        ):
            continue
        rows, cols = sample_segment_cells(start, end, water.shape[0], water.shape[1])
        flags = water[rows, cols]
        wet = int(flags.sum())
        if wet < 3 or wet < 0.25 * len(flags):
            continue
        alignment = -negative_score
        # A short span that is mostly river may bend: the road turns onto the
        # bridge.  Longer or drier spans must face each other squarely.
        mostly_water = wet >= 0.5 * len(flags) and distance <= 100.0
        if not mostly_water and alignment < strict_limit:
            continue
        if distance > 80.0 and alignment < tight_limit and wet < 0.7 * len(flags):
            continue
        key = add_edge(graph, left, right, np.vstack([start, end]))
        graph.edges[left, right, key]["bridge"] = True
        used.update((left, right))
        crossings += 1
    crossings += bridge_water_to_edges(graph, water, to_water, maximum_gap, bank_distance)
    del to_water
    return crossings


def bridge_water_to_edges(
    graph: nx.MultiGraph,
    water: np.ndarray,
    to_water: np.ndarray,
    maximum_gap: float,
    bank_distance: float,
    landing_radius: float = 25.0,
) -> int:
    """Cast a road end across the river along its tangent onto a far-bank road.

    Handles the T-shaped crossing: the bridge road meets a road running along
    the far bank, so there is no facing dead end to pair with.
    """
    if graph.number_of_edges() == 0:
        return 0
    endpoints = [
        node
        for node in graph.nodes
        if graph.degree(node) == 1
        and to_water[
            int(round(graph.nodes[node]["pos"][0])),
            int(round(graph.nodes[node]["pos"][1])),
        ]
        <= bank_distance
    ]
    if not endpoints:
        return 0
    samples: list[np.ndarray] = []
    owners: list[tuple[int, int, int]] = []
    for u, v, key, data in graph.edges(keys=True, data=True):
        for point in densify_polyline(edge_points(data), 2.0):
            samples.append(point)
            owners.append((u, v, key))
    tree = cKDTree(np.vstack(samples))
    height, width = water.shape
    crossings = 0
    for node in endpoints:
        if node not in graph or graph.degree(node) != 1:
            continue
        tangent = endpoint_outward_tangent(graph, node)
        if tangent is None:
            continue
        origin = graph.nodes[node]["pos"]
        own = {(u, v, k) for u, v, k in graph.edges(node, keys=True)}
        own |= {(v, u, k) for u, v, k in own}
        wet_run = 0
        landing: np.ndarray | None = None
        for step in range(2, int(maximum_gap) + 1, 2):
            point = origin + tangent * step
            row, col = int(round(point[0])), int(round(point[1]))
            if not (0 <= row < height and 0 <= col < width):
                break
            if water[row, col]:
                wet_run += 1
                continue
            if wet_run >= 3:
                landing = point + tangent * 4.0
                break
            if step > 30 and wet_run == 0:
                break  # never reached the river: not a crossing
        if landing is None:
            continue
        best: tuple[float, int, int, int, np.ndarray] | None = None
        seen: set[tuple[int, int, int]] = set()
        for index in tree.query_ball_point(landing, landing_radius):
            u, v, key = owners[index]
            if (u, v, key) in seen or (u, v, key) in own:
                continue
            seen.add((u, v, key))
            if not graph.has_edge(u, v, key):
                continue
            projection, distance, _segment, _t = nearest_point_on_polyline(
                edge_points(graph.edges[u, v, key]), landing
            )
            if distance > landing_radius:
                continue
            if best is None or distance < best[0]:
                best = (distance, u, v, key, projection)
        if best is None:
            continue
        _distance, u, v, key, projection = best
        rows, cols = sample_segment_cells(origin, projection, height, width)
        if int(water[rows, cols].sum()) < 3:
            continue
        junction = split_edge_at_point(graph, u, v, key, projection)
        if junction is None or junction == node:
            continue
        edge_key = add_edge(
            graph, node, junction, np.vstack([origin, graph.nodes[junction]["pos"]])
        )
        graph.edges[node, junction, edge_key]["bridge"] = True
        crossings += 1
    return crossings


def remove_self_loops(graph: nx.MultiGraph, maximum_length: float) -> int:
    removed = 0
    for u, v, key, data in list(graph.edges(keys=True, data=True)):
        if u == v and polyline_length(edge_points(data)) < maximum_length:
            graph.remove_edge(u, v, key)
            removed += 1
    return removed


def component_length(graph: nx.MultiGraph, nodes: set[int]) -> float:
    return float(
        sum(
            polyline_length(edge_points(data))
            for u, v, data in graph.edges(nodes, data=True)
            if u in nodes and v in nodes
        )
    )


def closed_components(graph: nx.MultiGraph) -> list[set[int]]:
    return [
        component
        for component in nx.connected_components(graph)
        if component and not any(graph.degree(node) == 1 for node in component)
    ]


def remove_closed_components(graph: nx.MultiGraph, maximum_length: float) -> int:
    removed = 0
    for component in closed_components(graph):
        if component_length(graph, component) < maximum_length:
            graph.remove_nodes_from(component)
            removed += 1
    return removed


def attach_closed_components(
    graph: nx.MultiGraph, radius: float, water: np.ndarray
) -> int:
    """Give each closed ring (no dead end) one junction onto the nearest road."""
    if radius <= 0:
        return 0
    components = closed_components(graph)
    if not components or graph.number_of_edges() == 0:
        return 0
    samples: list[np.ndarray] = []
    owners: list[tuple[int, int, int]] = []
    for u, v, key, data in graph.edges(keys=True, data=True):
        for point in densify_polyline(edge_points(data), 2.0):
            samples.append(point)
            owners.append((u, v, key))
    tree = cKDTree(np.vstack(samples))
    attached = 0
    for component in components:
        best: tuple[float, int, int, int, int, np.ndarray] | None = None
        for node in component:
            origin = graph.nodes[node]["pos"]
            seen: set[tuple[int, int, int]] = set()
            for index in tree.query_ball_point(origin, radius):
                u, v, key = owners[index]
                if (u, v, key) in seen:
                    continue
                seen.add((u, v, key))
                if u in component or v in component:
                    continue
                if not graph.has_edge(u, v, key):
                    continue
                projection, distance, _segment, _t = nearest_point_on_polyline(
                    edge_points(graph.edges[u, v, key]), origin
                )
                if distance > radius:
                    continue
                rows, cols = sample_segment_cells(
                    origin, projection, water.shape[0], water.shape[1]
                )
                if int(water[rows, cols].sum()) >= 3:
                    continue
                if best is None or distance < best[0]:
                    best = (distance, node, u, v, key, projection)
        if best is None:
            continue
        _distance, node, u, v, key, projection = best
        junction = split_edge_at_point(graph, u, v, key, projection)
        if junction is None or junction == node:
            continue
        add_edge(
            graph,
            node,
            junction,
            np.vstack([graph.nodes[node]["pos"], graph.nodes[junction]["pos"]]),
        )
        attached += 1
    return attached


def merge_degree_two_chains(graph: nx.MultiGraph) -> int:
    """Collapse non-loop degree-two nodes while retaining full pixel polylines."""
    merged_count = 0
    while True:
        candidate = next(
            (
                node
                for node in graph.nodes
                if graph.degree(node) == 2
                and not any(u == v for u, v in graph.edges(node))
            ),
            None,
        )
        if candidate is None:
            break
        incident = list(graph.edges(candidate, keys=True, data=True))
        if len(incident) != 2:
            break
        first, second = incident
        _, neighbor_a, _, data_a = first
        _, neighbor_b, _, data_b = second
        position = graph.nodes[candidate]["pos"]
        points_a = orient_to_node(edge_points(data_a), position, end_at_node=True)
        points_b = orient_to_node(edge_points(data_b), position, end_at_node=False)
        joined = np.vstack([points_a, position, points_b])
        graph.remove_node(candidate)
        add_edge(graph, neighbor_a, neighbor_b, joined)
        merged_count += 1
    return merged_count


def simplify_points(points_yx: np.ndarray, tolerance: float) -> np.ndarray:
    points_xy = np.column_stack((points_yx[:, 1], points_yx[:, 0]))
    if len(points_xy) <= 2:
        return points_xy
    simplified = LineString(points_xy).simplify(
        tolerance, preserve_topology=False
    )
    coordinates = np.asarray(simplified.coords, dtype=np.float64)
    return coordinates if len(coordinates) >= 2 else points_xy[[0, -1]]


def _json_num(value: float) -> float | int:
    """Round to 1 decimal; emit ints for whole numbers so output matches JSON.stringify."""
    rounded = round(float(value), 1)
    as_int = int(rounded)
    return as_int if rounded == as_int else rounded


def dump_roads(roads: dict[str, Any]) -> str:
    """Diff-friendly JSON: one compact node/edge object per line, coords to 1 decimal."""
    image_size = roads["imageSize"]
    nodes = roads["nodes"]
    edges = roads["edges"]
    lines = [
        "{",
        '  "version": 1,',
        f'  "imageSize": [{int(image_size[0])}, {int(image_size[1])}],',
        '  "nodes": [',
    ]
    for index, node in enumerate(nodes):
        obj = {"id": node["id"], "x": _json_num(node["x"]), "y": _json_num(node["y"])}
        comma = "," if index < len(nodes) - 1 else ""
        lines.append(f"    {json.dumps(obj, separators=(',', ':'))}{comma}")
    lines.append("  ],")
    lines.append('  "edges": [')
    for index, edge in enumerate(edges):
        obj = {
            "id": edge["id"],
            "from": edge["from"],
            "to": edge["to"],
            "class": edge["class"],
            "points": [[_json_num(x), _json_num(y)] for x, y in edge["points"]],
        }
        if edge.get("bridge"):
            obj["bridge"] = True
        comma = "," if index < len(edges) - 1 else ""
        lines.append(f"    {json.dumps(obj, separators=(',', ':'))}{comma}")
    lines.append("  ]")
    lines.append("}")
    return "\n".join(lines) + "\n"


def road_length_xy(points: list[list[float]]) -> float:
    array = np.asarray(points, dtype=np.float64)
    return float(np.hypot(*np.diff(array, axis=0).T).sum())


def print_final_stats(roads: dict[str, Any], json_size: int) -> None:
    graph = nx.Graph()
    graph.add_nodes_from(node["id"] for node in roads["nodes"])
    graph.add_edges_from((edge["from"], edge["to"]) for edge in roads["edges"])
    components = list(nx.connected_components(graph))
    largest = max(components, key=len) if components else set()
    largest_nodes = len(largest)
    point_count = sum(len(edge["points"]) for edge in roads["edges"])
    class_histogram = Counter(edge["class"] for edge in roads["edges"])
    total_length = sum(road_length_xy(edge["points"]) for edge in roads["edges"])
    largest_length = sum(
        road_length_xy(edge["points"])
        for edge in roads["edges"]
        if edge["from"] in largest and edge["to"] in largest
    )
    share = (largest_length / total_length * 100.0) if total_length else 0.0
    print("Final extraction stats:")
    print(f"  Nodes: {len(roads['nodes']):,}")
    print(f"  Edges: {len(roads['edges']):,}")
    print(f"  Total points: {point_count:,}")
    print(f"  Class histogram: {dict(sorted(class_histogram.items()))}")
    print(f"  Bridges: {sum(1 for edge in roads['edges'] if edge.get('bridge')):,}")
    print(f"  Dead ends: {sum(1 for _n, degree in graph.degree() if degree == 1):,}")
    print(f"  Connected components: {len(components):,}")
    print(f"  Largest component: {largest_nodes:,} nodes")
    print(
        f"  Largest-component length: {largest_length:,.1f} px ({share:.1f}% of total)"
    )
    print(f"  Total road length: {total_length:,.1f} px")
    print(f"  JSON size: {json_size:,} bytes ({json_size / 1024 / 1024:.2f} MiB)")

def clean_graph(
    raw: nx.MultiGraph,
    args: argparse.Namespace,
    water: np.ndarray,
    plain_land: np.ndarray,
    origin_at_zoom: tuple[int, int],
    factor: float,
) -> nx.MultiGraph:
    graph = normalize_sknw_graph(raw)
    graph = merge_nearby_nodes(graph, args.merge_distance)
    spurs = remove_spurs(graph, args.spur_length)
    small_components = remove_small_graph_components(graph, args.component_length)
    junctions = close_endpoint_to_edge_junctions(graph, args.junction_snap)
    bridges, rejected = bridge_aligned_endpoints(
        graph,
        args.bridge_gap,
        args.bridge_angle,
        water,
        plain_land,
        args.bridge_plain_run,
    )
    junctions += close_endpoint_to_edge_junctions(graph, args.junction_snap)
    degree_two = merge_degree_two_chains(graph)
    spurs += remove_spurs(graph, args.spur_length)
    small_components += remove_small_graph_components(graph, args.component_length)
    self_loops = remove_self_loops(graph, args.max_self_loop)
    graph.remove_nodes_from(list(nx.isolates(graph)))
    closed_removed = remove_closed_components(graph, args.closed_component_length)
    closed_attached = attach_closed_components(graph, args.closed_attach, water)
    crossings = bridge_water_crossings(graph, water, args.crossing_gap, args.crossing_angle)
    graph.remove_nodes_from(list(nx.isolates(graph)))
    legacy_pieces = legacy_edges = 0
    if args.legacy:
        legacy_pieces, legacy_edges = import_legacy_trails(
            graph, args.legacy, parse_transform(args.legacy_transform), origin_at_zoom, factor, water, args
        )
        junctions += close_endpoint_to_edge_junctions(graph, args.junction_snap)
        bridged_more, _rejected = bridge_aligned_endpoints(
            graph, args.bridge_gap, args.bridge_angle, water, plain_land, args.bridge_plain_run
        )
        bridges += bridged_more
    wet_edges = split_edges_at_water(graph, water, args.bridge_min_length)
    print(
        f"Graph cleanup: removed {spurs:,} spurs and {small_components:,} small "
        f"components; closed {junctions:,} endpoint-to-edge junctions; "
        f"bridged {bridges:,} aligned gaps "
        f"(rejected {rejected['water'] + rejected['nonroad']:,}: "
        f"{rejected['water']:,} water, {rejected['nonroad']:,} non-road); "
        f"merged {degree_two:,} degree-2 nodes; dropped {self_loops:,} self-loops "
        f"and {closed_removed:,} small closed rings; attached {closed_attached:,} "
        f"closed rings; joined {crossings:,} river crossings; imported "
        f"{legacy_edges:,} legacy trail edges in {legacy_pieces:,} pieces; "
        f"{wet_edges:,} bridge edges over water"
    )
    return graph


def parse_transform(text: str) -> tuple[float, float, float]:
    values = [float(v) for v in text.split(",")]
    if len(values) != 3:
        raise ValueError("--legacy-transform needs scale,dx,dy")
    return values[0], values[1], values[2]


def import_legacy_trails(
    graph: nx.MultiGraph,
    legacy_path: Path,
    transform: tuple[float, float, float],
    origin_at_zoom: tuple[int, int],
    factor: float,
    water: np.ndarray,
    args: argparse.Namespace,
) -> tuple[int, int]:
    """Add trails from the retired in-game-map extraction that this map lacks.

    A legacy edge is *novel* when most of it runs farther than --legacy-clearance
    from every edge already in the graph.  Novel edges are grouped into connected
    pieces; pieces shorter than --legacy-min-length, more compact than
    --legacy-min-extent, or crossing water are dropped (they are mostly hatching
    artefacts); the rest join the graph as ``legacy`` edges, later attached to
    nearby roads by the usual junction closing.
    """
    legacy = json.loads(legacy_path.read_text())
    scale, dx, dy = transform
    ox, oy = origin_at_zoom
    height, width = water.shape

    def to_local(point_xy: list[float]) -> np.ndarray:
        x = (point_xy[0] * scale + dx) * factor - ox
        y = (point_xy[1] * scale + dy) * factor - oy
        return np.array([y, x], dtype=np.float64)

    samples = [
        point
        for _u, _v, data in graph.edges(data=True)
        for point in densify_polyline(edge_points(data), 2.0)
    ]
    if not samples:
        return 0, 0
    tree = cKDTree(np.vstack(samples))

    novel = nx.MultiGraph()
    positions: dict[str, np.ndarray] = {}
    for node in legacy["nodes"]:
        positions[node["id"]] = to_local([node["x"], node["y"]])
    for edge in legacy["edges"]:
        points = np.vstack([to_local(point) for point in edge["points"]])
        if (points[:, 0].min() < 0 or points[:, 1].min() < 0
                or points[:, 0].max() >= height or points[:, 1].max() >= width):
            continue
        dense = densify_polyline(points, 4.0)
        distances, _ = tree.query(dense)
        if float((distances > args.legacy_clearance).mean()) < args.legacy_novel_fraction:
            continue
        novel.add_node(edge["from"], pos=positions[edge["from"]])
        novel.add_node(edge["to"], pos=positions[edge["to"]])
        novel.add_edge(edge["from"], edge["to"], pts=points)

    added_edges = 0
    added_pieces = 0
    for component in list(nx.connected_components(novel)):
        piece = novel.subgraph(component)
        length = sum(polyline_length(data["pts"]) for _u, _v, data in piece.edges(data=True))
        if length < args.legacy_min_length:
            continue
        stacked = np.vstack([data["pts"] for _u, _v, data in piece.edges(data=True)])
        extent = float(np.linalg.norm(stacked.max(axis=0) - stacked.min(axis=0)))
        if extent < args.legacy_min_extent:
            continue  # a compact tangle is hatching, not a trail
        wet = 0
        for _u, _v, data in piece.edges(data=True):
            for start, end in zip(data["pts"][:-1], data["pts"][1:]):
                rows, cols = sample_segment_cells(start, end, height, width)
                wet += int(water[rows, cols].sum())
        if wet >= 3:
            continue
        ids: dict[str, int] = {}
        for legacy_id in component:
            new_id = next_graph_node_id(graph)
            graph.add_node(new_id, pos=np.asarray(novel.nodes[legacy_id]["pos"], dtype=np.float64))
            ids[legacy_id] = new_id
        for u, v, data in piece.edges(data=True):
            key = add_edge(graph, ids[u], ids[v], data["pts"])
            graph.edges[ids[u], ids[v], key]["legacy"] = True
            added_edges += 1
        added_pieces += 1
    return added_pieces, added_edges


def wet_runs(flags: np.ndarray, minimum: int) -> np.ndarray:
    """Smooth a boolean run: drop wet runs shorter than minimum, then dry gaps."""
    result = flags.copy()
    for target in (True, False):
        start = 0
        while start < len(result):
            if result[start] != target:
                start += 1
                continue
            end = start
            while end < len(result) and result[end] == target:
                end += 1
            if end - start < minimum and 0 < start and end < len(result):
                result[start:end] = not target
            start = end
    return result


def split_edges_at_water(
    graph: nx.MultiGraph, water: np.ndarray, minimum_length: float
) -> int:
    """Split every edge where it enters or leaves water; wet pieces are bridges."""
    height, width = water.shape
    minimum = max(2, int(round(minimum_length)))
    bridges = 0
    for u, v, key, data in list(graph.edges(keys=True, data=True)):
        points = edge_points(data)
        dense = densify_polyline(points, 1.0)
        rows = np.clip(np.rint(dense[:, 0]).astype(np.int64), 0, height - 1)
        cols = np.clip(np.rint(dense[:, 1]).astype(np.int64), 0, width - 1)
        flags = wet_runs(water[rows, cols], minimum)
        if not flags.any():
            continue
        if flags.all():
            graph.edges[u, v, key]["bridge"] = True
            bridges += 1
            continue
        changes = np.flatnonzero(flags[1:] != flags[:-1]) + 1
        pieces = np.split(np.arange(len(dense)), changes)
        # Orient the dense polyline from u to v so the chain rebuilds correctly.
        u_pos = graph.nodes[u]["pos"]
        if float(np.linalg.norm(dense[0] - u_pos)) > float(np.linalg.norm(dense[-1] - u_pos)):
            dense = dense[::-1]
            flags = flags[::-1]
            changes = np.flatnonzero(flags[1:] != flags[:-1]) + 1
            pieces = np.split(np.arange(len(dense)), changes)
        graph.remove_edge(u, v, key)
        previous = u
        for index, piece in enumerate(pieces):
            last = index == len(pieces) - 1
            stop = piece[-1]
            if last:
                node = v
            else:
                node = next_graph_node_id(graph)
                graph.add_node(node, pos=np.asarray(dense[stop], dtype=np.float64))
            segment = dense[piece[0] : stop + 1]
            segment = np.vstack([graph.nodes[previous]["pos"], segment, graph.nodes[node]["pos"]])
            new_key = add_edge(graph, previous, node, segment)
            if data.get("legacy"):
                graph.edges[previous, node, new_key]["legacy"] = True
            if flags[piece[0]]:
                graph.edges[previous, node, new_key]["bridge"] = True
                bridges += 1
            previous = node
    return bridges


def sample_edge_radius(distance: np.ndarray, points_yx: np.ndarray) -> float:
    indices = np.rint(points_yx).astype(np.int64)
    indices[:, 0] = np.clip(indices[:, 0], 0, distance.shape[0] - 1)
    indices[:, 1] = np.clip(indices[:, 1], 0, distance.shape[1] - 1)
    samples = distance[indices[:, 0], indices[:, 1]]
    samples = samples[samples > 0]
    return float(np.median(samples)) if len(samples) else 0.0


def print_width_histogram(radii: list[float]) -> None:
    bins = np.concatenate((np.arange(0.0, 5.6, 0.5), [np.inf]))
    counts, edges = np.histogram(radii, bins=bins)
    print("Median mask half-width histogram (px at extraction zoom):")
    for index, count in enumerate(counts):
        label = f"{edges[index]:.1f}+" if math.isinf(edges[index + 1]) else f"{edges[index]:.1f}-{edges[index + 1]:.1f}"
        print(f"  {label}: {count:,}")


def graph_to_roads(
    graph: nx.MultiGraph,
    mask: np.ndarray,
    args: argparse.Namespace,
    origin_at_zoom: tuple[int, int],
    factor: float,
) -> tuple[dict[str, Any], nx.MultiGraph]:
    """Convert to the roads.json schema in canonical coordinates."""
    print("Computing distance transform for stroke-width classification...")
    distance = ndi.distance_transform_edt(mask)
    ox, oy = origin_at_zoom

    def canonical(point_yx: np.ndarray) -> tuple[float, float]:
        return (
            round((float(point_yx[1]) + ox) / factor, 1),
            round((float(point_yx[0]) + oy) / factor, 1),
        )

    ordered_nodes = sorted(
        graph.nodes,
        key=lambda node: (float(graph.nodes[node]["pos"][0]), float(graph.nodes[node]["pos"][1]), int(node)),
    )
    node_ids = {node: f"n{index}" for index, node in enumerate(ordered_nodes, 1)}
    nodes: list[dict[str, Any]] = []
    positions: dict[int, tuple[float, float]] = {}
    for node in ordered_nodes:
        position = canonical(graph.nodes[node]["pos"])
        positions[node] = position
        nodes.append({"id": node_ids[node], "x": position[0], "y": position[1]})

    prepared: list[tuple[Any, ...]] = []
    radii: list[float] = []
    for u, v, key, data in graph.edges(keys=True, data=True):
        points_yx = edge_points(data)
        u_position = graph.nodes[u]["pos"]
        if np.linalg.norm(points_yx[0] - u_position) > np.linalg.norm(points_yx[-1] - u_position):
            points_yx = points_yx[::-1]
        bridge = bool(data.get("bridge", False))
        if data.get("legacy"):
            radius = 0.0  # no ink on this map: always a trail
        else:
            radius = sample_edge_radius(distance, points_yx)
            radii.append(radius)
        points_xy = simplify_points(points_yx, args.simplify)
        prepared.append((u, v, key, points_xy, radius, bridge))
    del distance
    gc.collect()
    print_width_histogram(radii)

    classes: dict[tuple[int, int, int], str] = {}
    for u, v, key, _points, radius, bridge in prepared:
        classes[(u, v, key)] = "main" if radius >= args.main_radius else "sub"
    # A short bridge piece measures its own ink; let long neighbours vote so a
    # main road stays main across the water.
    for u, v, key, _points, _radius, bridge in prepared:
        if not bridge:
            continue
        votes = Counter()
        for node in (u, v):
            for a, b, k in graph.edges(node, keys=True):
                for candidate in ((a, b, k), (b, a, k)):
                    if candidate in classes and candidate != (u, v, key):
                        votes[classes[candidate]] += 1
        if votes:
            classes[(u, v, key)] = votes.most_common(1)[0][0]

    prepared.sort(key=lambda item: (min(node_ids[item[0]], node_ids[item[1]]), max(node_ids[item[0]], node_ids[item[1]]), item[2]))
    edges: list[dict[str, Any]] = []
    for index, (u, v, key, points_xy, radius, bridge) in enumerate(prepared, 1):
        rounded = [[round((float(x) + ox) / factor, 1), round((float(y) + oy) / factor, 1)] for x, y in points_xy]
        rounded[0] = list(positions[u])
        rounded[-1] = list(positions[v])
        if len(rounded) < 2:
            rounded = [list(positions[u]), list(positions[v])]
        edge = {"id": f"e{index}", "from": node_ids[u], "to": node_ids[v], "class": classes[(u, v, key)], "points": rounded}
        if bridge:
            edge["bridge"] = True
        edges.append(edge)
        graph.edges[u, v, key]["road_class"] = edge["class"]

    roads = {"version": 1, "imageSize": [CANONICAL_SIZE, CANONICAL_SIZE], "nodes": nodes, "edges": edges}
    return roads, graph


def validate_roads(roads: dict[str, Any]) -> None:
    if roads.get("version") != 1:
        raise ValueError("roads.version must be 1")
    if roads.get("imageSize") != [CANONICAL_SIZE, CANONICAL_SIZE]:
        raise ValueError(f"roads.imageSize must be {[CANONICAL_SIZE, CANONICAL_SIZE]}")
    nodes = roads.get("nodes")
    edges = roads.get("edges")
    if not isinstance(nodes, list) or not isinstance(edges, list):
        raise ValueError("roads.nodes and roads.edges must be arrays")
    node_by_id: dict[str, tuple[float, float]] = {}
    for node in nodes:
        node_id = node.get("id")
        if not isinstance(node_id, str) or node_id in node_by_id:
            raise ValueError(f"duplicate or invalid node id: {node_id!r}")
        node_by_id[node_id] = (node.get("x"), node.get("y"))
    edge_ids: set[str] = set()
    for edge in edges:
        edge_id = edge.get("id")
        if not isinstance(edge_id, str) or edge_id in edge_ids:
            raise ValueError(f"duplicate or invalid edge id: {edge_id!r}")
        edge_ids.add(edge_id)
        if edge.get("class") not in {"main", "sub"}:
            raise ValueError(f"invalid extracted road class on {edge_id}")
        if edge.get("from") not in node_by_id or edge.get("to") not in node_by_id:
            raise ValueError(f"unknown endpoint node on {edge_id}")
        points = edge.get("points")
        if not isinstance(points, list) or len(points) < 2:
            raise ValueError(f"edge {edge_id} needs at least two points")
        if tuple(points[0]) != node_by_id[edge["from"]]:
            raise ValueError(f"edge {edge_id} first point does not match from-node")
        if tuple(points[-1]) != node_by_id[edge["to"]]:
            raise ValueError(f"edge {edge_id} last point does not match to-node")
        for point in points:
            if not isinstance(point, list) or len(point) != 2 or not all(isinstance(value, (int, float)) for value in point):
                raise ValueError(f"edge {edge_id} has an invalid point")


def write_debug_overlay(
    region: Image.Image,
    mask: np.ndarray,
    roads: dict[str, Any],
    output_path: Path,
    origin_at_zoom: tuple[int, int],
    factor: float,
) -> None:
    """Half-resolution overlay of the extraction window: mask tint plus the graph."""
    width, height = region.size
    half_size = (math.ceil(width / 2), math.ceil(height / 2))
    base = region.resize(half_size, Image.Resampling.LANCZOS).convert("RGBA")
    padded = np.pad(mask, ((0, height % 2), (0, width % 2)), mode="constant", constant_values=False)
    pooled = padded.reshape(padded.shape[0] // 2, 2, padded.shape[1] // 2, 2).max(axis=(1, 3))
    tint = np.zeros((pooled.shape[0], pooled.shape[1], 4), dtype=np.uint8)
    tint[pooled] = (30, 220, 205, 105)
    base.alpha_composite(Image.fromarray(tint, mode="RGBA"))
    draw = ImageDraw.Draw(base, mode="RGBA")
    ox, oy = origin_at_zoom

    def local(point: list[float]) -> tuple[float, float]:
        return ((point[0] * factor - ox) / 2, (point[1] * factor - oy) / 2)

    for edge in roads["edges"]:
        points = [local(point) for point in edge["points"]]
        if edge.get("bridge"):
            draw.line(points, fill=(40, 90, 255, 245), width=4, joint="curve")
        elif edge["class"] == "main":
            draw.line(points, fill=(255, 111, 30, 245), width=3, joint="curve")
        else:
            draw.line(points, fill=(255, 225, 35, 235), width=2, joint="curve")
    for node in roads["nodes"]:
        x, y = local([node["x"], node["y"]])
        draw.ellipse((x - 1.5, y - 1.5, x + 1.5, y + 1.5), fill=(15, 15, 15, 235))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    base.convert("RGB").save(output_path, optimize=True)


def main() -> None:
    args = parse_args()
    manifest = load_manifest(args.manifest)
    if manifest.get("tileSize") != 512 or manifest.get("maxNativeZoom", 6) < args.zoom:
        raise ValueError("manifest does not describe the th.gl pyramid this script expects")
    x0, y0, x1, y1 = parse_bounds(args.bounds)
    factor = 2 ** (args.zoom - CANONICAL_ZOOM)
    origin = (x0 * factor, y0 * factor)
    print(
        f"Stitching zoom {args.zoom} window canonical ({x0},{y0})-({x1},{y1}) "
        f"= {(x1 - x0) * factor} x {(y1 - y0) * factor} px from {args.tiles}..."
    )
    region = stitch_region(args.tiles, args.zoom, x0 * factor, y0 * factor, x1 * factor, y1 * factor)
    rgb = np.asarray(region, dtype=np.uint8)
    print(
        f"Thresholds: ink={args.ink_min:g}-{args.ink_max:g}/chroma<={args.ink_chroma}, "
        f"ridge={'on' if args.ridge else 'off'}, close={args.close_radius}, "
        f"spur={args.spur_length:g}, component={args.component_length:g}, "
        f"junction-snap={args.junction_snap:g}px, bridge={args.bridge_gap:g}px/"
        f"{args.bridge_angle:g}deg, crossing={args.crossing_gap:g}px, "
        f"simplify={args.simplify:g}, main-radius={args.main_radius:g}"
    )
    print("Building water mask...")
    water = build_water_mask(rgb)
    print(f"Water coverage: {water.mean() * 100:.3f}%")
    if args.water_output:
        write_water_mask(water, args.water_output, origin, args.zoom)
        print(f"Wrote {args.water_output} (zoom {WATER_MASK_ZOOM})")
    print("Building road-ink mask...")
    mask = build_ink_mask(rgb, args)
    print(f"Ink coverage: {mask.mean() * 100:.4f}% of window")
    if args.ridge:
        print("Building ridge mask for faint paths...")
        ridge = build_ridge_mask(rgb, water, args)
        added = int((ridge & ~mask).sum())
        mask |= ridge
        del ridge
        print(f"Ridge pass added {added:,} px")
    plain_land = build_plain_land_mask(rgb, water, mask)
    del rgb
    gc.collect()

    print("Skeletonizing...")
    skeleton = morphology.skeletonize(mask)
    skeleton = remove_short_skeleton_components(skeleton, max(2, int(args.component_length)))
    print(f"Skeleton pixels retained: {int(skeleton.sum()):,}")

    print("Building and cleaning junction graph...")
    raw_graph = sknw.build_sknw(skeleton.astype(np.uint8), multi=True, iso=False, ring=True, full=True)
    del skeleton
    graph = clean_graph(raw_graph, args, water, plain_land, origin, factor)
    del raw_graph, plain_land
    gc.collect()

    roads, graph = graph_to_roads(graph, mask, args, origin, factor)
    validate_roads(roads)
    payload = dump_roads(roads).encode("utf-8")
    if len(payload) >= 6 * 1024 * 1024:
        raise ValueError(f"roads JSON is {len(payload):,} bytes; increase simplification/pruning")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(payload)
    print(f"Validated and wrote {args.output}")
    write_debug_overlay(region, mask, roads, args.debug, origin, factor)
    print(f"Wrote {args.debug}")
    print_final_stats(roads, len(payload))


if __name__ == "__main__":
    main()

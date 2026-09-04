#!/usr/bin/env python3
"""Extract a first-pass Crimson Desert road graph from the world-map raster.

The map does not use one fixed road colour: the same road ink is shifted by the
regional tint beneath it.  Extraction therefore combines a conservative
neutral/warm colour band with *local* dark-line contrast.  Weak candidate pixels
are retained only when connected to a strong road-like pixel (hysteresis), then
small gaps are closed without dilating the lines.  The cleaned mask is
skeletonized, converted to a junction graph with sknw, pruned, simplified with
Douglas-Peucker, and classified from the median mask radius along each edge.

Tuning, in order:
  * --contrast-low/--contrast-high control faint-line recall.  Raise them if
    terrain hatching is traced; lower them if real roads are fragmented.
  * --recall-contrast-low/--recall-contrast-high grow the strict mask into a
    slightly looser hysteresis band *without* adding new components.  Leave
    them equal to the strict pair to disable.  A 5.5/14 trial pulled in
    hatching and *increased* fragmentation, so the defaults stay off.
  * --min-background excludes the uniform grey out-of-bounds region.  Raising
    it is more conservative near the coast.
  * --max-chroma and the channel-difference bounds reject blue/red icons and
    dark teal labels.  They normally need no adjustment.
  * --close-radius closes 1-3 px breaks.  Values above 2 can merge parallel roads.
  * --spur-length and --component-length remove short hatching fragments.
  * --junction-snap closes a degree-1 skeleton onto the nearest non-incident
    edge (T-junctions).  Hits within 14 px are accepted even if the stub is
    crooked; farther hits must face the target.  25-30 px is typical; 40 px
    started welding unrelated roads without growing the giant component.
  * --bridge-gap / --bridge-angle join mutually facing endpoints across
    icon/text gaps.  The straight bridge is rejected if it crosses dark
    teal-blue water (3+ samples) or more than --bridge-plain-run consecutive
    plain-land pixels in the middle of the span.  70 px and 45 deg is the
    usual range; keep water rejection strict.
  * --main-radius is the distance-transform radius separating thick main roads
    from minor roads; use the printed width histogram to retune it.

Coordinates and output follow docs/DECISIONS.md D3/D5: native image pixels,
x right, y down, with exact node/polyline endpoint equality.  Extraction never
emits the editor-only ``offroad`` class.
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


Image.MAX_IMAGE_PIXELS = None

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "data/map/source.jpg"
DEFAULT_OUTPUT = ROOT / "data/roads.json"
DEFAULT_DEBUG = ROOT / "data/map/roads-debug.png"
EXPECTED_SIZE = (5178, 5240)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--debug", type=Path, default=DEFAULT_DEBUG)
    parser.add_argument(
        "--background-sigma",
        type=float,
        default=4.0,
        help="Gaussian radius used to estimate the local land colour",
    )
    parser.add_argument(
        "--min-background",
        type=float,
        default=181.0,
        help="Minimum local mean intensity; excludes water and out-of-bounds grey",
    )
    parser.add_argument("--min-intensity", type=float, default=108.0)
    parser.add_argument("--max-intensity", type=float, default=201.0)
    parser.add_argument("--contrast-low", type=float, default=7.0)
    parser.add_argument("--contrast-high", type=float, default=17.0)
    parser.add_argument(
        "--recall-contrast-low",
        type=float,
        default=7.0,
        help="Looser low threshold used only to grow existing mask components",
    )
    parser.add_argument(
        "--recall-contrast-high",
        type=float,
        default=17.0,
        help="Looser high threshold used only to grow existing mask components",
    )
    parser.add_argument("--max-chroma", type=int, default=18)
    parser.add_argument(
        "--bright-exclusion",
        type=float,
        default=238.0,
        help="Exclude pixels around near-white labels such as the watermark",
    )
    parser.add_argument(
        "--bright-dilate",
        type=int,
        default=8,
        help="Radius excluded around near-white clutter",
    )
    parser.add_argument("--min-red-blue", type=int, default=1)
    parser.add_argument("--max-red-blue", type=int, default=14)
    parser.add_argument("--min-green-blue", type=int, default=0)
    parser.add_argument("--max-green-blue", type=int, default=11)
    parser.add_argument("--min-red-green", type=int, default=-4)
    parser.add_argument("--max-red-green", type=int, default=10)
    parser.add_argument(
        "--close-radius",
        type=int,
        default=1,
        help="Morphological closing disk radius (keep at 1-2 pixels)",
    )
    parser.add_argument("--min-mask-object", type=int, default=8)
    parser.add_argument("--spur-length", type=float, default=14.0)
    parser.add_argument("--component-length", type=float, default=60.0)
    parser.add_argument("--merge-distance", type=float, default=2.0)
    parser.add_argument(
        "--junction-snap",
        type=float,
        default=30.0,
        help="Snap a degree-1 node onto the nearest non-incident edge within this many px",
    )
    parser.add_argument(
        "--bridge-gap",
        type=float,
        default=70.0,
        help="Bridge aligned graph endpoints across icon/text gaps up to this many px",
    )
    parser.add_argument(
        "--bridge-angle",
        type=float,
        default=45.0,
        help="Maximum tangent error in degrees for endpoint-pair bridging",
    )
    parser.add_argument(
        "--bridge-plain-run",
        type=int,
        default=16,
        help="Reject a bridge that crosses this many consecutive plain-land pixels",
    )
    parser.add_argument("--simplify", type=float, default=1.5)
    parser.add_argument(
        "--main-radius",
        type=float,
        default=1.8,
        help="Median distance-transform radius at or above which an edge is main",
    )
    return parser.parse_args()


def polyline_length(points_yx: np.ndarray) -> float:
    if len(points_yx) < 2:
        return 0.0
    differences = np.diff(points_yx.astype(np.float64), axis=0)
    return float(np.hypot(differences[:, 0], differences[:, 1]).sum())


def build_road_mask(
    rgb: np.ndarray, args: argparse.Namespace
) -> tuple[np.ndarray, dict[str, float]]:
    """Return a narrow road-ink mask plus useful calibration diagnostics."""
    rgb16 = rgb.astype(np.int16)
    intensity = rgb.astype(np.float32).mean(axis=2)
    background = ndi.gaussian_filter(intensity, args.background_sigma)
    contrast = background - intensity

    red_blue = rgb16[:, :, 0] - rgb16[:, :, 2]
    green_blue = rgb16[:, :, 1] - rgb16[:, :, 2]
    red_green = rgb16[:, :, 0] - rgb16[:, :, 1]
    chroma = rgb16.max(axis=2) - rgb16.min(axis=2)

    candidate = (
        (background >= args.min_background)
        & (intensity >= args.min_intensity)
        & (intensity <= args.max_intensity)
        & (chroma <= args.max_chroma)
        & (red_blue >= args.min_red_blue)
        & (red_blue <= args.max_red_blue)
        & (green_blue >= args.min_green_blue)
        & (green_blue <= args.max_green_blue)
        & (red_green >= args.min_red_green)
        & (red_green <= args.max_red_green)
    )
    if args.bright_dilate > 0:
        bright_clutter = intensity >= args.bright_exclusion
        bright_clutter = morphology.dilation(
            bright_clutter, footprint=morphology.disk(args.bright_dilate)
        )
        candidate &= ~bright_clutter
        del bright_clutter

    # Hysteresis keeps a faint continuation only if its component contains a
    # convincingly dark road pixel.  Invalid colours are made impossible seeds.
    response = np.where(candidate, contrast, -1_000.0)
    mask = filters.apply_hysteresis_threshold(
        response, args.contrast_low, args.contrast_high
    )
    recall_extra = 0
    if (
        args.recall_contrast_low < args.contrast_low
        or args.recall_contrast_high < args.contrast_high
    ):
        loose = filters.apply_hysteresis_threshold(
            response, args.recall_contrast_low, args.recall_contrast_high
        )
        loose = np.logical_or(loose, mask)
        grown = morphology.reconstruction(
            mask.astype(np.uint8), loose.astype(np.uint8)
        ).astype(bool)
        recall_extra = int(grown.sum() - mask.sum())
        mask = grown
        del loose, grown
    del response, candidate, rgb16, red_blue, green_blue, red_green, chroma

    if args.close_radius:
        mask = morphology.closing(mask, footprint=morphology.disk(args.close_radius))
    if args.min_mask_object > 1:
        mask = morphology.remove_small_objects(
            mask, max_size=args.min_mask_object - 1
        )

    diagnostics = {
        "mask_fraction": float(mask.mean()),
        "strong_fraction": float((contrast >= args.contrast_high).mean()),
        "background_mean": float(background.mean()),
        "recall_extra_pixels": float(recall_extra),
    }
    del intensity, background, contrast
    gc.collect()
    return np.asarray(mask, dtype=bool), diagnostics


def build_water_mask(rgb: np.ndarray) -> np.ndarray:
    """Dark teal-blue ocean/river pixels, dilated 1 px to catch banks."""
    rgb16 = rgb.astype(np.int16)
    red = rgb16[:, :, 0]
    green = rgb16[:, :, 1]
    blue = rgb16[:, :, 2]
    intensity = rgb.astype(np.float32).mean(axis=2)
    chroma = rgb16.max(axis=2) - rgb16.min(axis=2)
    water = (
        (blue >= red + 20)
        & (green >= red + 12)
        & (intensity <= 145.0)
        & (chroma >= 20)
    )
    return morphology.dilation(water, footprint=morphology.disk(1))


def build_plain_land_mask(
    rgb: np.ndarray, water: np.ndarray, road_mask: np.ndarray, near_radius: int = 3
) -> np.ndarray:
    """Bright low-chroma land that is not water and not next to road ink."""
    rgb16 = rgb.astype(np.int16)
    intensity = rgb.astype(np.float32).mean(axis=2)
    chroma = rgb16.max(axis=2) - rgb16.min(axis=2)
    near_road = road_mask
    if near_radius > 0:
        near_road = morphology.dilation(
            road_mask, footprint=morphology.disk(near_radius)
        )
    return (
        (intensity >= 178.0)
        & (chroma <= 16)
        & ~water
        & ~near_road
    )


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


def add_edge(graph: nx.MultiGraph, u: int, v: int, points: np.ndarray) -> None:
    graph.add_edge(
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


def clean_graph(
    raw: nx.MultiGraph,
    args: argparse.Namespace,
    water: np.ndarray,
    plain_land: np.ndarray,
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
    # Merging can create a short terminal edge or component, so finish with the
    # same two conservative filters once more.
    spurs += remove_spurs(graph, args.spur_length)
    small_components += remove_small_graph_components(graph, args.component_length)
    graph.remove_nodes_from(list(nx.isolates(graph)))
    print(
        f"Graph cleanup: removed {spurs:,} spurs and {small_components:,} small "
        f"components; closed {junctions:,} endpoint-to-edge junctions; "
        f"bridged {bridges:,} aligned gaps "
        f"(rejected {rejected['water'] + rejected['nonroad']:,}: "
        f"{rejected['water']:,} water, {rejected['nonroad']:,} non-road); "
        f"merged {degree_two:,} degree-2 nodes"
    )
    return graph


def simplify_points(points_yx: np.ndarray, tolerance: float) -> np.ndarray:
    points_xy = np.column_stack((points_yx[:, 1], points_yx[:, 0]))
    if len(points_xy) <= 2:
        return points_xy
    simplified = LineString(points_xy).simplify(
        tolerance, preserve_topology=False
    )
    coordinates = np.asarray(simplified.coords, dtype=np.float64)
    return coordinates if len(coordinates) >= 2 else points_xy[[0, -1]]


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
    print("Median mask-radius histogram (px):")
    for index, count in enumerate(counts):
        if math.isinf(edges[index + 1]):
            label = f"{edges[index]:.1f}+"
        else:
            label = f"{edges[index]:.1f}-{edges[index + 1]:.1f}"
        print(f"  {label}: {count:,}")


def graph_to_roads(
    graph: nx.MultiGraph, mask: np.ndarray, args: argparse.Namespace
) -> tuple[dict[str, Any], nx.MultiGraph]:
    print("Computing distance transform for stroke-width classification...")
    distance = ndi.distance_transform_edt(mask)

    # Stable spatial ordering makes threshold comparisons produce readable diffs.
    ordered_nodes = sorted(
        graph.nodes,
        key=lambda node: (
            float(graph.nodes[node]["pos"][0]),
            float(graph.nodes[node]["pos"][1]),
            int(node),
        ),
    )
    node_ids = {node: f"n{index}" for index, node in enumerate(ordered_nodes, 1)}
    nodes: list[dict[str, Any]] = []
    rounded_positions: dict[int, tuple[float, float]] = {}
    for node in ordered_nodes:
        y, x = graph.nodes[node]["pos"]
        position = (round(float(x), 1), round(float(y), 1))
        rounded_positions[node] = position
        nodes.append({"id": node_ids[node], "x": position[0], "y": position[1]})

    prepared_edges: list[tuple[Any, ...]] = []
    radii: list[float] = []
    for u, v, key, data in graph.edges(keys=True, data=True):
        points_yx = edge_points(data)
        u_position = graph.nodes[u]["pos"]
        if np.linalg.norm(points_yx[0] - u_position) > np.linalg.norm(
            points_yx[-1] - u_position
        ):
            points_yx = points_yx[::-1]
        radius = sample_edge_radius(distance, points_yx)
        radii.append(radius)
        points_xy = simplify_points(points_yx, args.simplify)
        road_class = "main" if radius >= args.main_radius else "sub"
        prepared_edges.append((u, v, key, points_xy, road_class, radius))
    del distance
    gc.collect()

    print_width_histogram(radii)
    prepared_edges.sort(
        key=lambda item: (
            min(node_ids[item[0]], node_ids[item[1]]),
            max(node_ids[item[0]], node_ids[item[1]]),
            item[2],
        )
    )
    edges: list[dict[str, Any]] = []
    for index, (u, v, _key, points_xy, road_class, radius) in enumerate(
        prepared_edges, 1
    ):
        rounded = [
            [round(float(point[0]), 1), round(float(point[1]), 1)]
            for point in points_xy
        ]
        rounded[0] = list(rounded_positions[u])
        rounded[-1] = list(rounded_positions[v])
        if len(rounded) < 2:
            rounded = [list(rounded_positions[u]), list(rounded_positions[v])]
        edge = {
            "id": f"e{index}",
            "from": node_ids[u],
            "to": node_ids[v],
            "class": road_class,
            "points": rounded,
        }
        edges.append(edge)
        graph.edges[u, v, _key]["road_class"] = road_class
        graph.edges[u, v, _key]["radius"] = radius

    roads = {
        "version": 1,
        "imageSize": list(EXPECTED_SIZE),
        "nodes": nodes,
        "edges": edges,
    }
    return roads, graph


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
        comma = "," if index < len(edges) - 1 else ""
        lines.append(f"    {json.dumps(obj, separators=(',', ':'))}{comma}")
    lines.append("  ]")
    lines.append("}")
    return "\n".join(lines) + "\n"


def validate_roads(roads: dict[str, Any]) -> None:
    if roads.get("version") != 1:
        raise ValueError("roads.version must be 1")
    if roads.get("imageSize") != list(EXPECTED_SIZE):
        raise ValueError(f"roads.imageSize must be {list(EXPECTED_SIZE)}")
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
            if (
                not isinstance(point, list)
                or len(point) != 2
                or not all(isinstance(value, (int, float)) for value in point)
            ):
                raise ValueError(f"edge {edge_id} has an invalid point")


def write_debug_overlay(
    source: Image.Image,
    mask: np.ndarray,
    roads: dict[str, Any],
    output_path: Path,
) -> None:
    width, height = source.size
    half_size = (math.ceil(width / 2), math.ceil(height / 2))
    base = source.resize(half_size, Image.Resampling.LANCZOS).convert("RGBA")

    # Max-pool 2x2 so a one-pixel candidate survives the 50% debug reduction.
    padded = np.pad(
        mask,
        ((0, height % 2), (0, width % 2)),
        mode="constant",
        constant_values=False,
    )
    pooled = padded.reshape(
        padded.shape[0] // 2, 2, padded.shape[1] // 2, 2
    ).max(axis=(1, 3))
    tint_array = np.zeros((pooled.shape[0], pooled.shape[1], 4), dtype=np.uint8)
    tint_array[pooled] = (30, 220, 205, 105)
    base.alpha_composite(Image.fromarray(tint_array, mode="RGBA"))

    draw = ImageDraw.Draw(base, mode="RGBA")
    nodes = {node["id"]: node for node in roads["nodes"]}
    for edge in roads["edges"]:
        points = [(point[0] / 2, point[1] / 2) for point in edge["points"]]
        if edge["class"] == "main":
            draw.line(points, fill=(255, 111, 30, 245), width=3, joint="curve")
        else:
            draw.line(points, fill=(255, 225, 35, 235), width=2, joint="curve")
    for node in nodes.values():
        x, y = node["x"] / 2, node["y"] / 2
        draw.ellipse((x - 1.5, y - 1.5, x + 1.5, y + 1.5), fill=(15, 15, 15, 235))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    base.convert("RGB").save(output_path, optimize=True)


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
    print(f"  Connected components: {len(components):,}")
    print(f"  Largest component: {largest_nodes:,} nodes")
    print(
        f"  Largest-component length: {largest_length:,.1f} px ({share:.1f}% of total)"
    )
    print(f"  Total road length: {total_length:,.1f} px")
    print(f"  JSON size: {json_size:,} bytes ({json_size / 1024 / 1024:.2f} MiB)")


def main() -> None:
    args = parse_args()
    print(f"Loading {args.source}...")
    source = Image.open(args.source).convert("RGB")
    if source.size != EXPECTED_SIZE:
        raise ValueError(
            f"expected source size {EXPECTED_SIZE}, got {source.size}; D3 coordinates "
            "require the original raster"
        )
    rgb = np.asarray(source, dtype=np.uint8)

    print(
        "Thresholds: "
        f"contrast={args.contrast_low:g}/{args.contrast_high:g}, "
        f"recall={args.recall_contrast_low:g}/{args.recall_contrast_high:g}, "
        f"intensity={args.min_intensity:g}-{args.max_intensity:g}, "
        f"min-background={args.min_background:g}, max-chroma={args.max_chroma}, "
        f"close={args.close_radius}, spur={args.spur_length:g}, "
        f"component={args.component_length:g}, "
        f"junction-snap={args.junction_snap:g}px, "
        f"bridge={args.bridge_gap:g}px/{args.bridge_angle:g}deg/"
        f"plain-run={args.bridge_plain_run}, simplify={args.simplify:g}, "
        f"main-radius={args.main_radius:g}"
    )
    print("Building road mask...")
    mask, diagnostics = build_road_mask(rgb, args)
    print(
        f"Mask coverage: {diagnostics['mask_fraction'] * 100:.4f}% of image; "
        f"unconstrained strong pixels: {diagnostics['strong_fraction'] * 100:.3f}%; "
        f"recall-grow pixels: {int(diagnostics['recall_extra_pixels']):,}"
    )
    print("Building water and plain-land masks for bridge rejection...")
    water = build_water_mask(rgb)
    plain_land = build_plain_land_mask(rgb, water, mask)
    print(
        f"Water coverage: {water.mean() * 100:.3f}%; "
        f"plain-land coverage: {plain_land.mean() * 100:.3f}%"
    )
    del rgb
    gc.collect()

    print("Skeletonizing...")
    skeleton = morphology.skeletonize(mask)
    skeleton = remove_short_skeleton_components(
        skeleton, max(2, int(args.component_length))
    )
    print(f"Skeleton pixels retained: {int(skeleton.sum()):,}")

    print("Building and cleaning junction graph...")
    raw_graph = sknw.build_sknw(
        skeleton.astype(np.uint8), multi=True, iso=False, ring=True, full=True
    )
    graph = clean_graph(raw_graph, args, water, plain_land)
    del raw_graph, skeleton, water, plain_land
    gc.collect()

    roads, graph = graph_to_roads(graph, mask, args)
    validate_roads(roads)
    payload = dump_roads(roads).encode("utf-8")
    if len(payload) >= 4 * 1024 * 1024:
        raise ValueError(
            f"roads JSON is {len(payload):,} bytes; increase simplification/pruning "
            "to stay under the 4 MiB target"
        )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(payload)
    print(f"Validated and wrote {args.output}")
    write_debug_overlay(source, mask, roads, args.debug)
    print(f"Wrote {args.debug}")
    print_final_stats(roads, len(payload))


if __name__ == "__main__":
    main()

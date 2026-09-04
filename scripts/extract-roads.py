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
  * --min-background excludes the uniform grey out-of-bounds region.  Raising
    it is more conservative near the coast.
  * --max-chroma and the channel-difference bounds reject blue/red icons and
    dark teal labels.  They normally need no adjustment.
  * --close-radius closes 1-3 px breaks.  Values above 2 can merge parallel roads.
  * --spur-length and --component-length remove short hatching fragments.
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
        "--bridge-gap",
        type=float,
        default=45.0,
        help="Bridge aligned graph endpoints across icon/text gaps up to this many px",
    )
    parser.add_argument(
        "--bridge-angle",
        type=float,
        default=35.0,
        help="Maximum tangent error in degrees for conservative endpoint bridging",
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
    }
    del intensity, background, contrast
    gc.collect()
    return np.asarray(mask, dtype=bool), diagnostics


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


def bridge_aligned_endpoints(
    graph: nx.MultiGraph, maximum_gap: float, maximum_angle: float
) -> int:
    """Join mutually facing endpoints across small icon/text occlusions."""
    if maximum_gap <= 0:
        return 0
    endpoints = [node for node in graph.nodes if graph.degree(node) == 1]
    if len(endpoints) < 2:
        return 0
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

    used: set[int] = set()
    bridges = 0
    for _negative_score, _distance, left, right in sorted(candidates):
        if left in used or right in used:
            continue
        add_edge(
            graph,
            left,
            right,
            np.vstack([graph.nodes[left]["pos"], graph.nodes[right]["pos"]]),
        )
        used.update((left, right))
        bridges += 1
    return bridges


def orient_to_node(
    points: np.ndarray, node_pos: np.ndarray, *, end_at_node: bool
) -> np.ndarray:
    start_distance = float(np.linalg.norm(points[0] - node_pos))
    end_distance = float(np.linalg.norm(points[-1] - node_pos))
    starts_at_node = start_distance <= end_distance
    if end_at_node:
        return points[::-1] if starts_at_node else points
    return points if starts_at_node else points[::-1]


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


def clean_graph(raw: nx.MultiGraph, args: argparse.Namespace) -> nx.MultiGraph:
    graph = normalize_sknw_graph(raw)
    graph = merge_nearby_nodes(graph, args.merge_distance)
    spurs = remove_spurs(graph, args.spur_length)
    small_components = remove_small_graph_components(graph, args.component_length)
    bridges = bridge_aligned_endpoints(
        graph, args.bridge_gap, args.bridge_angle
    )
    degree_two = merge_degree_two_chains(graph)
    # Merging can create a short terminal edge or component, so finish with the
    # same two conservative filters once more.
    spurs += remove_spurs(graph, args.spur_length)
    small_components += remove_small_graph_components(graph, args.component_length)
    graph.remove_nodes_from(list(nx.isolates(graph)))
    print(
        f"Graph cleanup: removed {spurs:,} spurs and {small_components:,} small "
        f"components; bridged {bridges:,} aligned gaps; merged {degree_two:,} "
        "degree-2 nodes"
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
    largest_nodes = max((len(component) for component in components), default=0)
    point_count = sum(len(edge["points"]) for edge in roads["edges"])
    class_histogram = Counter(edge["class"] for edge in roads["edges"])
    total_length = sum(road_length_xy(edge["points"]) for edge in roads["edges"])
    print("Final extraction stats:")
    print(f"  Nodes: {len(roads['nodes']):,}")
    print(f"  Edges: {len(roads['edges']):,}")
    print(f"  Total points: {point_count:,}")
    print(f"  Class histogram: {dict(sorted(class_histogram.items()))}")
    print(f"  Connected components: {len(components):,}")
    print(f"  Largest component: {largest_nodes:,} nodes")
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
        f"intensity={args.min_intensity:g}-{args.max_intensity:g}, "
        f"min-background={args.min_background:g}, max-chroma={args.max_chroma}, "
        f"close={args.close_radius}, spur={args.spur_length:g}, "
        f"component={args.component_length:g}, bridge={args.bridge_gap:g}px/"
        f"{args.bridge_angle:g}deg, simplify={args.simplify:g}, "
        f"main-radius={args.main_radius:g}"
    )
    print("Building road mask...")
    mask, diagnostics = build_road_mask(rgb, args)
    print(
        f"Mask coverage: {diagnostics['mask_fraction'] * 100:.4f}% of image; "
        f"unconstrained strong pixels: {diagnostics['strong_fraction'] * 100:.3f}%"
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
    graph = clean_graph(raw_graph, args)
    del raw_graph, skeleton
    gc.collect()

    roads, graph = graph_to_roads(graph, mask, args)
    validate_roads(roads)
    payload = (json.dumps(roads, separators=(",", ":")) + "\n").encode("utf-8")
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

"""Shared helpers for the th.gl map page and OpenWorld node dump."""

from __future__ import annotations

import re
import struct
import urllib.request
from collections.abc import Iterator

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
USER_AGENT = "crimson-desert-route-planner/1.0 (personal offline route planner)"

TRANSFORM_RE = re.compile(
    r"OpenWorld-[0-9a-f]+.*?transformation(?:\\)?\":\[([^]]+)\]",
    re.DOTALL,
)
NODES_PATH_RE = re.compile(r"(/nodes/OpenWorld\.[0-9a-f]+\.raw)")
# th.gl wraps each [id, [worldY, worldX, z]] record in CBOR tag 0xe002.
CBOR_RECORD_TAG = b"\xd9\xe0\x02"
LABEL_PAIR_RE = re.compile(r'"([^"\\]{1,80})":"((?:[^"\\]|\\.)*)"')

Transform = tuple[float, float, float, float]


def fetch_text(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def unescape_page(raw: bytes) -> str:
    """Decode the map page and undo the RSC quote escaping (`\\"` -> `"`)."""
    return raw.decode("utf-8", errors="replace").replace('\\"', '"')


def parse_transform(html: str) -> Transform:
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


def world_to_canonical(
    world_x: float,
    world_y: float,
    transform: Transform,
) -> tuple[float, float]:
    a, b, c, d = transform
    scale = 2**CANONICAL_ZOOM
    return (a * world_x + b) * scale, (c * world_y + d) * scale


def round1(value: float) -> float:
    return round(value * 10) / 10


def in_image(x: float, y: float) -> bool:
    return 0 <= x <= IMAGE_SIZE and 0 <= y <= IMAGE_SIZE


def parse_label_pairs(html: str) -> dict[str, str]:
    """Every "key":"value" pair on the unescaped page, first occurrence wins
    (the regex above). Values are kept raw, including `@` references."""
    pairs: dict[str, str] = {}
    for key, value in LABEL_PAIR_RE.findall(html):
        if key not in pairs:
            pairs[key] = value
    return pairs


def resolve_label(pairs: dict[str, str], key: str) -> str | None:
    """The label for key: a direct non-`@` value, or one hop through an `@`
    reference. None when neither exists. `_desc` keys are never consulted."""
    if key.endswith("_desc"):
        return None
    value = pairs.get(key)
    if value is None:
        return None
    if not value.startswith("@"):
        return value
    hop = pairs.get(value)
    if hop is None or hop.startswith("@"):
        return None
    return hop


def title_case_id(ident: str) -> str:
    """mine_iron -> Mine Iron; creature_a_t_a_g -> Creature A T A G."""
    return " ".join(part.capitalize() for part in ident.split("_"))


class CborReader:
    """Enough CBOR to read th.gl's tagged [id, [worldY, worldX, z]] place records."""

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


def iter_cbor_records(raw: bytes) -> Iterator[tuple[str, list[float]]]:
    """Yield (id, coords) for every tagged record whose shape is [str, list]
    with at least two numeric coords. Skips undecodable tags the way
    collect_cbor_places does today (advance one byte and continue)."""
    index = 0
    while True:
        start = raw.find(CBOR_RECORD_TAG, index)
        if start < 0:
            break
        reader = CborReader(raw[start:])
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
        raw_coords = value[1]
        if not all(isinstance(item, (int, float)) for item in raw_coords[:2]):
            continue
        coords = [float(raw_coords[0]), float(raw_coords[1])]
        for item in raw_coords[2:]:
            if isinstance(item, (int, float)):
                coords.append(float(item))
        yield ident, coords

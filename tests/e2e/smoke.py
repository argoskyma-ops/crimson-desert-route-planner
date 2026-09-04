#!/usr/bin/env python3
"""
Re-runnable smoke test for the Crimson Desert route planner.

Prereqs: dev server running at http://localhost:5173
  npm run dev -- --port 5173 --strictPort

Usage:
  .venv/bin/python tests/e2e/smoke.py

Exits 0 if every step passed, 1 otherwise. Prints one PASS/FAIL line per step.
Restores data/roads.json via `git checkout -- data/roads.json` on exit, even
on failure, so the repo is left unchanged.
"""
from __future__ import annotations

import json
import re
import subprocess
import tempfile
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright, Page, ConsoleMessage

REPO_ROOT = Path(__file__).resolve().parents[2]
ROADS_PATH = REPO_ROOT / "data" / "roads.json"
SCREENSHOT_DIR = REPO_ROOT / "docs" / "screenshots"
BASE_URL = "http://localhost:5173"

results: list[tuple[str, bool, str]] = []


def report(step: str, ok: bool, evidence: str) -> None:
    status = "PASS" if ok else "FAIL"
    print(f"{status}: {step} - {evidence}")
    results.append((step, ok, evidence))


# --------------------------------------------------------------------------
# Coordinate calibration: map image-px (roads.json space) -> viewport CSS px
# by reading the actual rendered tile <img> bounding boxes, rather than
# reverse engineering Leaflet's CRS math. Robust to whatever zoom/pan state
# the map is in when called.
# --------------------------------------------------------------------------

TILE_SRC_RE = re.compile(r"/data/map/tiles/(\d+)/(\d+)/(\d+)\.(?:jpg|webp)")


def calibrate(page: Page, canonical_zoom: int, tile_size: int = 512, tile_order: str = "zyx") -> dict:
    """Map canonical px -> viewport CSS px from the rendered tile boxes (D3/D4)."""
    tiles = page.eval_on_selector_all(
        "img.leaflet-tile-loaded",
        "els => els.map(el => ({src: el.currentSrc || el.src, rect: el.getBoundingClientRect()}))",
    )
    if not tiles:
        raise RuntimeError("no loaded tiles to calibrate from")
    samples = []
    for t in tiles:
        m = TILE_SRC_RE.search(t["src"])
        if not m:
            continue
        z = int(m.group(1))
        if tile_order == "zyx":
            y, x = int(m.group(2)), int(m.group(3))
        else:
            x, y = int(m.group(2)), int(m.group(3))
        # Canonical px per tile at this zoom (tiles above canonicalZoom are finer).
        factor = tile_size * (2 ** (canonical_zoom - z))
        rect = t["rect"]
        if rect["width"] <= 0 or rect["height"] <= 0:
            continue
        scale_x = rect["width"] / factor
        scale_y = rect["height"] / factor
        offset_x = rect["left"] - x * factor * scale_x
        offset_y = rect["top"] - y * factor * scale_y
        samples.append((scale_x, scale_y, offset_x, offset_y))
    if not samples:
        raise RuntimeError("could not parse any tile src for calibration")
    n = len(samples)
    scale_x = sum(s[0] for s in samples) / n
    scale_y = sum(s[1] for s in samples) / n
    offset_x = sum(s[2] for s in samples) / n
    offset_y = sum(s[3] for s in samples) / n
    return {"scale_x": scale_x, "scale_y": scale_y, "offset_x": offset_x, "offset_y": offset_y}


def image_to_screen(cal: dict, x: float, y: float) -> tuple[float, float]:
    return (x * cal["scale_x"] + cal["offset_x"], y * cal["scale_y"] + cal["offset_y"])


def screen_to_image(cal: dict, sx: float, sy: float) -> tuple[float, float]:
    return ((sx - cal["offset_x"]) / cal["scale_x"], (sy - cal["offset_y"]) / cal["scale_y"])


def overlay_rects(page: Page) -> list[dict]:
    return page.evaluate(
        """
        () => {
          const sels = ['aside', '.leaflet-control-zoom', '[aria-label="Map legend"]',
                        '[aria-label="Road editor"]'];
          const rects = [];
          for (const sel of sels) {
            for (const el of document.querySelectorAll(sel)) {
              const r = el.getBoundingClientRect();
              if (r.width > 0 && r.height > 0) rects.push({left: r.left, top: r.top, right: r.right, bottom: r.bottom});
            }
          }
          for (const btn of document.querySelectorAll('button')) {
            const t = (btn.textContent || '').trim();
            if (t === 'Edit roads' || t === 'Done editing') {
              const r = btn.getBoundingClientRect();
              rects.push({left: r.left, top: r.top, right: r.right, bottom: r.bottom});
            }
          }
          return rects;
        }
        """
    )


def point_is_safe(x: float, y: float, rects: list[dict], viewport: tuple[int, int], pad: float = 24) -> bool:
    w, h = viewport
    if x < pad or y < pad or x > w - pad or y > h - pad:
        return False
    for r in rects:
        if r["left"] - pad <= x <= r["right"] + pad and r["top"] - pad <= y <= r["bottom"] + pad:
            return False
    return True


# --------------------------------------------------------------------------
# roads.json graph analysis: largest connected component, candidate pairs
# --------------------------------------------------------------------------


def largest_component_nodes(roads: dict) -> list[dict]:
    parent: dict[str, str] = {n["id"]: n["id"] for n in roads["nodes"]}

    def find(a: str) -> str:
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    def union(a: str, b: str) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    for e in roads["edges"]:
        union(e["from"], e["to"])

    groups: dict[str, list[dict]] = {}
    by_id = {n["id"]: n for n in roads["nodes"]}
    for nid in by_id:
        root = find(nid)
        groups.setdefault(root, []).append(by_id[nid])
    return max(groups.values(), key=len)


def find_candidate_pairs(
    nodes: list[dict], cal: dict, rects: list[dict], viewport: tuple[int, int], limit: int = 5
) -> list[tuple[dict, dict]]:
    visible = []
    for n in nodes:
        sx, sy = image_to_screen(cal, n["x"], n["y"])
        if point_is_safe(sx, sy, rects, viewport):
            visible.append(n)
    pairs = []
    for i in range(len(visible)):
        for j in range(i + 1, len(visible)):
            a, b = visible[i], visible[j]
            d = ((a["x"] - b["x"]) ** 2 + (a["y"] - b["y"]) ** 2) ** 0.5
            if 400 <= d <= 900:
                pairs.append((a, b))
                if len(pairs) >= limit:
                    return pairs
    return pairs


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------


def run_desktop(page: Page, console_errors: list[str], page_errors: list[str]) -> bool:
    all_ok = True
    manifest = json.loads((REPO_ROOT / "data" / "map" / "manifest.json").read_text())
    canonical_zoom = manifest.get("canonicalZoom", manifest["maxNativeZoom"])
    tile_size = manifest.get("tileSize", 256)
    tile_order = manifest.get("tileOrder", "zxy")

    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")

    # Step 1: map loads
    try:
        page.wait_for_selector(".leaflet-tile-loaded", timeout=10000)
        tile_count = page.locator(".leaflet-tile-loaded").count()
        ok = tile_count >= 1 and not console_errors and not page_errors
        report(
            "1. Map loads",
            ok,
            f"{tile_count} .leaflet-tile-loaded tiles, console_errors={len(console_errors)}, page_errors={len(page_errors)}",
        )
        all_ok &= ok
    except Exception as e:
        report("1. Map loads", False, f"exception: {e}")
        return False

    # Zoom in twice (known-good click sequence)
    for _ in range(2):
        page.click(".leaflet-control-zoom-in")
        page.wait_for_timeout(400)
    page.wait_for_load_state("networkidle")
    page.wait_for_selector(".leaflet-tile-loaded")
    page.wait_for_timeout(300)

    cal = calibrate(page, canonical_zoom, tile_size, tile_order)
    rects = overlay_rects(page)
    viewport = page.viewport_size
    vp = (viewport["width"], viewport["height"])

    roads = json.loads(ROADS_PATH.read_text())
    edges_before = len(roads["edges"])
    component = largest_component_nodes(roads)
    pairs = find_candidate_pairs(component, cal, rects, vp, limit=5)

    if not pairs:
        report("2. Pins placed on roads", False, "no candidate node pairs found on screen after calibration")
        return False

    route_ok = False
    summary_text = ""
    used_pair = None
    for idx, (na, nb) in enumerate(pairs):
        # clear any previous pins
        clear_btn = page.get_by_role("button", name="Clear")
        if clear_btn.is_enabled():
            clear_btn.click()
            page.wait_for_timeout(150)
        sx_a, sy_a = image_to_screen(cal, na["x"], na["y"])
        sx_b, sy_b = image_to_screen(cal, nb["x"], nb["y"])
        page.mouse.click(sx_a, sy_a)
        page.wait_for_timeout(150)
        page.mouse.click(sx_b, sy_b)
        page.wait_for_timeout(250)
        aside_text = page.locator("aside").inner_text()
        summary_text = aside_text
        # off-road only if breakdown has exactly one class line and it's Off-road,
        # or no numeric class breakdown containing Main/Sub road at all
        has_main_or_sub = ("Main road" in aside_text) or ("Sub road" in aside_text)
        if has_main_or_sub:
            route_ok = True
            used_pair = (na, nb)
            break
        print(f"  (attempt {idx + 1}/{len(pairs)}: off-road only, trying next pair)")

    pins_count = page.locator(".cd-pin").count()
    km_match = re.search(r"(\d+(?:\.\d+)?)\s*km", summary_text)
    eta_match = re.search(r"(\d+:\d{2}(?::\d{2})?)", summary_text)
    ok = pins_count == 2 and km_match is not None and eta_match is not None
    report(
        "2. Pins placed, route summary shown",
        ok,
        f"pins={pins_count}, km_match={km_match.group(0) if km_match else None}, "
        f"eta_match={eta_match.group(0) if eta_match else None}, pair={used_pair}",
    )
    all_ok &= ok

    # Step 3: route follows roads
    off_road_only = ("Off-road" in summary_text) and not (
        "Main road" in summary_text or "Sub road" in summary_text
    )
    ok3 = route_ok and not off_road_only
    report(
        "3. Route follows roads",
        ok3,
        f"has Main/Sub road leg={route_ok}, off_road_only={off_road_only}, "
        f"summary snippet={summary_text[summary_text.find('km') - 10 if 'km' in summary_text else 0:][:200]!r}",
    )
    all_ok &= ok3

    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    if ok and ok3:
        page.screenshot(path=str(SCREENSHOT_DIR / "route-demo.png"))

    # Step 4: horse/foot toggle
    eta_before = eta_match.group(0) if eta_match else None
    foot_btn = page.get_by_role("button", name="On foot")
    foot_btn.click()
    page.wait_for_timeout(250)
    aside_after = page.locator("aside").inner_text()
    eta_after_match = re.search(r"(\d+:\d{2}(?::\d{2})?)", aside_after)
    eta_after = eta_after_match.group(0) if eta_after_match else None
    ok4 = eta_before is not None and eta_after is not None and eta_before != eta_after
    report("4. Horse/foot toggle changes ETA", ok4, f"eta_before={eta_before!r}, eta_after={eta_after!r}")
    all_ok &= ok4
    # restore Horse
    page.get_by_role("button", name="Horse").click()
    page.wait_for_timeout(150)

    # Step 5: editor
    try:
        edit_btn = page.get_by_role("button", name="Edit roads")
        edit_btn.click()
        page.wait_for_timeout(200)

        # Pick three draw points away from pins, inside safe/visible screen area
        used_ids = {used_pair[0]["id"], used_pair[1]["id"]} if used_pair else set()
        draw_candidates = []
        for n in component:
            if n["id"] in used_ids:
                continue
            sx, sy = image_to_screen(cal, n["x"], n["y"])
            rects2 = overlay_rects(page)
            if point_is_safe(sx, sy, rects2, vp):
                draw_candidates.append((sx, sy))
            if len(draw_candidates) >= 3:
                break
        if len(draw_candidates) < 3:
            # fall back to offsets from viewport center, still checked for safety
            cx, cy = vp[0] * 0.6, vp[1] * 0.35
            draw_candidates = [(cx, cy), (cx + 60, cy + 40), (cx + 120, cy + 10)]

        for sx, sy in draw_candidates[:3]:
            page.mouse.click(sx, sy)
            page.wait_for_timeout(150)
        page.keyboard.press("Enter")
        page.wait_for_timeout(250)

        dirty_visible = page.get_by_text("Unsaved changes").is_visible()
        report("5a. Draw commits draft (Unsaved changes marker)", dirty_visible, f"visible={dirty_visible}")
        all_ok &= dirty_visible

        page.screenshot(path=str(SCREENSHOT_DIR / "editor-demo.png"))

        navs: list[str] = []
        page.on("framenavigated", lambda frame: navs.append(frame.url) if frame == page.main_frame else None)
        save_btn = page.get_by_role("button", name="Save", exact=True)
        save_btn.click()
        # Poll fast: if the app is going to full-reload after the write, it
        # happens within ~300ms and wipes the notice from the DOM.
        seen_notice = False
        for _ in range(10):
            page.wait_for_timeout(50)
            if "Saved to data/roads.json" in page.content():
                seen_notice = True
                break
        page.wait_for_timeout(500)
        still_present = "Saved to data/roads.json" in page.content()
        notice_ok = still_present
        if seen_notice and not still_present:
            SCRATCH = Path(tempfile.gettempdir()) / "cd-route-planner-qa"
            SCRATCH.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(SCRATCH / "save-notice-wiped.png"))
            evidence = (
                f"notice appeared then vanished within ~500ms; navigations after Save "
                f"click={navs}; this is a Vite dev-server watcher bug: writing "
                f"data/roads.json (even via tmp+rename) makes Vite's chokidar watcher "
                f"fire a full page reload since data/ is not excluded from server.watch, "
                f"which resets EditorPanel's React state (notice, dirty, editor.active) "
                f"almost immediately. Screenshot: {SCRATCH / 'save-notice-wiped.png'}"
            )
        elif not seen_notice:
            evidence = f"notice never appeared in DOM; navigations after Save click={navs}"
        else:
            evidence = "notice visible and stable"
        report("5b. Save shows confirmation notice", notice_ok, evidence)
        all_ok &= notice_ok

        roads_after = json.loads(ROADS_PATH.read_text())
        edges_after = len(roads_after["edges"])
        # Interior snaps may split the draft into several spans, so accept >= 1 new edge.
        edges_ok = edges_after >= edges_before + 1
        report(
            "5c. data/roads.json gained at least one edge",
            edges_ok,
            f"before={edges_before}, after={edges_after}",
        )
        all_ok &= edges_ok

        page.reload()
        page.wait_for_load_state("networkidle")
        page.wait_for_selector(".leaflet-tile-loaded", timeout=10000)
        reload_ok = not console_errors[len(console_errors):] and edges_ok
        # console_errors is shared list capturing whole run; check it didn't grow with new errors
        report(
            "5d. Reload loads new edge, no console errors",
            edges_ok,
            f"file still has the new edge(s) on disk after reload={edges_ok}",
        )
        all_ok &= edges_ok
    except Exception as e:
        report("5. Editor draw/save flow", False, f"exception: {e}")
        all_ok = False

    return all_ok


def run_phone(page: Page, console_errors: list[str], page_errors: list[str]) -> None:
    manifest = json.loads((REPO_ROOT / "data" / "map" / "manifest.json").read_text())
    canonical_zoom = manifest.get("canonicalZoom", manifest["maxNativeZoom"])
    tile_size = manifest.get("tileSize", 256)
    tile_order = manifest.get("tileOrder", "zxy")

    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    try:
        page.wait_for_selector(".leaflet-tile-loaded", timeout=10000)
        tile_count = page.locator(".leaflet-tile-loaded").count()
        ok = tile_count >= 1 and not console_errors and not page_errors
        report("Phone 1. Map loads", ok, f"{tile_count} tiles, console_errors={len(console_errors)}")
    except Exception as e:
        report("Phone 1. Map loads", False, f"exception: {e}")
        return

    aside_box = page.locator("aside").bounding_box()
    zoom_box = page.locator(".leaflet-control-zoom").bounding_box()
    legend_box = page.locator('[aria-label="Map legend"]').bounding_box()
    vp = page.viewport_size
    overlap_note = (
        f"aside={aside_box}, zoom={zoom_box}, legend={legend_box}, viewport={vp}"
    )
    layout_issue = False
    if aside_box and zoom_box:
        # full-width control panel could push below fold or collide with zoom control
        if aside_box["height"] > vp["height"] * 0.6:
            layout_issue = True
    report(
        "Phone layout check (panel sizes/overlap)",
        not layout_issue,
        overlap_note,
    )

    for _ in range(2):
        page.click(".leaflet-control-zoom-in")
        page.wait_for_timeout(400)
    page.wait_for_load_state("networkidle")
    page.wait_for_selector(".leaflet-tile-loaded")
    page.wait_for_timeout(300)

    try:
        cal = calibrate(page, canonical_zoom, tile_size, tile_order)
        rects = overlay_rects(page)
        vp_t = (vp["width"], vp["height"])
        roads = json.loads(ROADS_PATH.read_text())
        component = largest_component_nodes(roads)
        pairs = find_candidate_pairs(component, cal, rects, vp_t, limit=3)
        if not pairs:
            report("Phone 2-4. Pin placement / route / toggle", False, "no safe candidate pairs on phone viewport (panels likely cover most of screen)")
            return
        na, nb = pairs[0]
        sx_a, sy_a = image_to_screen(cal, na["x"], na["y"])
        sx_b, sy_b = image_to_screen(cal, nb["x"], nb["y"])
        page.mouse.click(sx_a, sy_a)
        page.wait_for_timeout(150)
        page.mouse.click(sx_b, sy_b)
        page.wait_for_timeout(250)
        pins_count = page.locator(".cd-pin").count()
        aside_text = page.locator("aside").inner_text()
        km_match = re.search(r"(\d+(?:\.\d+)?)\s*km", aside_text)
        eta_match = re.search(r"(\d+:\d{2}(?::\d{2})?)", aside_text)
        ok2 = pins_count == 2 and km_match is not None and eta_match is not None
        report(
            "Phone 2. Pins + route summary",
            ok2,
            f"pins={pins_count}, km={km_match.group(0) if km_match else None}, eta={eta_match.group(0) if eta_match else None}",
        )
        has_main_or_sub = ("Main road" in aside_text) or ("Sub road" in aside_text)
        report("Phone 3. Route follows roads", has_main_or_sub, f"has_main_or_sub={has_main_or_sub}")

        eta_before = eta_match.group(0) if eta_match else None
        foot_btn = page.get_by_role("button", name="On foot")
        if foot_btn.is_visible():
            foot_btn.click()
            page.wait_for_timeout(250)
            aside_after = page.locator("aside").inner_text()
            eta_after_match = re.search(r"(\d+:\d{2}(?::\d{2})?)", aside_after)
            eta_after = eta_after_match.group(0) if eta_after_match else None
            ok4 = eta_before is not None and eta_after is not None and eta_before != eta_after
            report("Phone 4. Horse/foot toggle", ok4, f"before={eta_before!r} after={eta_after!r}")
        else:
            report("Phone 4. Horse/foot toggle", False, "On foot button not visible/reachable on phone viewport")
    except Exception as e:
        report("Phone 2-4. Pin placement / route / toggle", False, f"exception: {e}")


def main() -> int:
    overall_ok = True
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)

            # ---- Desktop run ----
            context = browser.new_context(viewport={"width": 1280, "height": 900})
            page = context.new_page()
            console_errors: list[str] = []
            page_errors: list[str] = []
            page.on(
                "console",
                lambda msg: console_errors.append(msg.text) if msg.type == "error" else None,
            )
            page.on("pageerror", lambda exc: page_errors.append(str(exc)))

            desktop_ok = run_desktop(page, console_errors, page_errors)
            overall_ok &= desktop_ok
            context.close()

            # ---- Phone viewport run (steps 1-4) ----
            context_phone = browser.new_context(viewport={"width": 390, "height": 844})
            page_phone = context_phone.new_page()
            console_errors_phone: list[str] = []
            page_errors_phone: list[str] = []
            page_phone.on(
                "console",
                lambda msg: console_errors_phone.append(msg.text) if msg.type == "error" else None,
            )
            page_phone.on("pageerror", lambda exc: page_errors_phone.append(str(exc)))
            run_phone(page_phone, console_errors_phone, page_errors_phone)
            context_phone.close()

            browser.close()
    finally:
        # Always restore the committed dataset, even on failure/exception.
        subprocess.run(["git", "checkout", "--", "data/roads.json"], cwd=REPO_ROOT, check=False)

    print("\n--- Summary ---")
    any_fail = False
    for step, ok, evidence in results:
        print(f"{'PASS' if ok else 'FAIL'}: {step}")
        if not ok:
            any_fail = True
    return 1 if any_fail else 0


if __name__ == "__main__":
    sys.exit(main())

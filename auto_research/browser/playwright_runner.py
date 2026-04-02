"""Collect browser observations with a local Playwright headless crawl."""

from __future__ import annotations

import json
import socket
import subprocess
import tempfile
import time
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

from auto_research.config import (
    BROWSER_ROUTE_LIMIT,
    DEFAULT_APP_URL,
    DEFAULT_BROWSER_PORT,
    NODE_EXECUTABLE,
    PLAYWRIGHT_TIMEOUT_SECONDS,
    PROJECT_ROOT,
)


class BrowserCaptureError(RuntimeError):
    """Raised when browser capture cannot be completed."""


@dataclass
class BrowserCapture:
    """Artifacts collected from a Playwright crawl."""

    app_url: str
    summary_text: str
    image_paths: list[Path]
    artifact_dir: Path
    raw_summary_path: Path


def _is_port_open(port: int) -> bool:
    """Return whether a TCP port is already in use on localhost."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        return sock.connect_ex(("127.0.0.1", port)) == 0


def _wait_for_url(url: str, timeout_seconds: int = 15) -> None:
    """Wait for an HTTP URL to respond."""
    deadline = time.time() + timeout_seconds
    last_error: Exception | None = None
    while time.time() < deadline:
        try:
            with urlopen(url, timeout=2):
                return
        except URLError as exc:
            last_error = exc
            time.sleep(0.5)
    raise BrowserCaptureError(f"Timed out waiting for {url} to become ready: {last_error}")


@contextmanager
def _temporary_static_server(port: int):
    """Serve the benchmark app over HTTP for browser-mode runs."""
    script_path = PROJECT_ROOT / "auto_research" / "browser" / "serve_static.mjs"
    process = subprocess.Popen(
        [
            NODE_EXECUTABLE,
            str(script_path),
            str(port),
            str(PROJECT_ROOT),
        ],
        cwd=str(PROJECT_ROOT),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        _wait_for_url(f"http://127.0.0.1:{port}/")
        yield f"http://127.0.0.1:{port}/"
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()


def _resolve_app_url(app_url: str | None):
    """Return a usable app URL and an optional server context manager."""
    explicit_url = (app_url or DEFAULT_APP_URL).strip()
    if explicit_url:
        return explicit_url, None

    port = DEFAULT_BROWSER_PORT
    if _is_port_open(port):
        return f"http://127.0.0.1:{port}/", None
    return None, _temporary_static_server(port)


@contextmanager
def _existing_url(url: str):
    """Yield an already-running app URL."""
    yield url


def _format_browser_summary(summary: dict) -> str:
    """Convert the raw Playwright JSON into a compact prompt-friendly summary."""
    lines = [
        "Browser observations were collected with a headless Playwright crawl.",
        f"Base URL: {summary.get('baseUrl', '')}",
        f"Captured routes: {len(summary.get('routes', []))}",
    ]

    for entry in summary.get("routes", [])[:24]:
        screenshot = entry.get("screenshot", "")
        lines.append(
            f"- [{entry.get('viewport', 'unknown')}] {entry.get('route', '')} -> "
            f"title={entry.get('title', '')!r}, url={entry.get('url', '')}"
        )
        headings = entry.get("headings", [])
        if headings:
            lines.append(f"  Headings: {', '.join(headings[:5])}")
        missing_images = entry.get("missingImages", [])
        if missing_images:
            lines.append(f"  Missing images: {len(missing_images)}")
        console_errors = entry.get("consoleErrors", [])
        if console_errors:
            lines.append(f"  Console errors: {' | '.join(console_errors[:3])}")
        page_errors = entry.get("pageErrors", [])
        if page_errors:
            lines.append(f"  Page errors: {' | '.join(page_errors[:3])}")
        body_text = entry.get("bodyText", "")
        if body_text:
            lines.append(f"  Body text excerpt: {body_text[:500]}")
        if screenshot:
            lines.append(f"  Screenshot: {screenshot}")

    return "\n".join(lines)


def _select_image_paths(summary: dict, artifact_dir: Path) -> list[Path]:
    """Pick a small set of representative screenshots to attach to Codex."""
    selected: list[Path] = []
    seen_names: set[str] = set()
    for entry in summary.get("routes", []):
        screenshot = entry.get("screenshot")
        if not screenshot:
            continue
        path = (artifact_dir / screenshot).resolve()
        if not path.exists():
            continue
        name = path.name
        if name in seen_names:
            continue
        selected.append(path)
        seen_names.add(name)
        if len(selected) >= 6:
            break
    return selected


def capture_browser_context(
    app_url: str | None = None,
    artifact_dir: Path | None = None,
    route_limit: int | None = None,
) -> BrowserCapture:
    """Run the Playwright crawl and return a browser summary plus screenshots."""
    route_limit = route_limit or BROWSER_ROUTE_LIMIT
    script_path = PROJECT_ROOT / "auto_research" / "browser" / "capture_state.mjs"

    if artifact_dir is None:
        artifact_dir = Path(tempfile.mkdtemp(prefix="auto_research_browser_"))
    else:
        artifact_dir.mkdir(parents=True, exist_ok=True)

    output_path = artifact_dir / "browser_summary.json"

    resolved_url, server_cm = _resolve_app_url(app_url)

    if server_cm is None:
        _wait_for_url(resolved_url)
        context_manager = _existing_url(resolved_url)
    else:
        context_manager = server_cm

    with context_manager as active_url:
        result = subprocess.run(
            [
                NODE_EXECUTABLE,
                str(script_path),
                active_url,
                str(output_path),
                str(route_limit),
            ],
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=PLAYWRIGHT_TIMEOUT_SECONDS,
            check=False,
        )

    if result.returncode != 0:
        combined = "\n".join(part for part in [result.stderr, result.stdout] if part).strip()
        raise BrowserCaptureError(
            "Playwright browser capture failed.\n"
            "Make sure dependencies are installed with:\n"
            "  npm.cmd install\n"
            "  npx.cmd playwright install chromium\n\n"
            f"Diagnostics:\n{combined}"
        )

    summary = json.loads(output_path.read_text(encoding="utf-8"))
    return BrowserCapture(
        app_url=summary.get("baseUrl", resolved_url or ""),
        summary_text=_format_browser_summary(summary),
        image_paths=_select_image_paths(summary, artifact_dir),
        artifact_dir=artifact_dir,
        raw_summary_path=output_path,
    )

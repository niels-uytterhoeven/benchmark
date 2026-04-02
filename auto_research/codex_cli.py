"""Call the ChatGPT Codex Responses API using stored OAuth2 tokens.

Uses the same token file as browser-use (~/.browser-use/openai_oauth2_tokens.json),
obtained via the openai_oauth2_login() flow.  No OPENAI_API_KEY required.
"""

from __future__ import annotations

import base64
import copy
import json
import time
from pathlib import Path
from typing import Any

import httpx

from auto_research.config import CODEX_BASE_URL, CODEX_TIMEOUT_SECONDS

TOKEN_FILE = Path.home() / ".browser-use" / "openai_oauth2_tokens.json"
DEFAULT_TOKEN_URL = "https://auth.openai.com/oauth/token"
DEFAULT_MODEL = "gpt-5.4"


class CodexExecutionError(RuntimeError):
    """Raised when a Codex API call fails."""


# ---------------------------------------------------------------------------
# Token management
# ---------------------------------------------------------------------------

_cached_token: str | None = None
_cached_token_expires_at: float = 0.0


def _load_tokens() -> dict:
    if not TOKEN_FILE.exists():
        raise CodexExecutionError(
            f"No OAuth2 tokens found at {TOKEN_FILE}. "
            "Run openai_oauth2_login() first to authenticate with your ChatGPT account."
        )
    try:
        return json.loads(TOKEN_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        raise CodexExecutionError(f"Failed to read token file: {exc}") from exc


def _save_tokens(tokens: dict) -> None:
    TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_FILE.write_text(json.dumps(tokens, indent=2), encoding="utf-8")


def _refresh_access_token(tokens: dict) -> str:
    global _cached_token, _cached_token_expires_at

    token_url = tokens.get("token_url", DEFAULT_TOKEN_URL)
    data: dict[str, str] = {
        "grant_type": "refresh_token",
        "client_id": tokens["client_id"],
        "refresh_token": tokens["refresh_token"],
    }
    if tokens.get("client_secret"):
        data["client_secret"] = tokens["client_secret"]

    resp = httpx.post(token_url, data=data, timeout=30.0)
    if resp.status_code != 200:
        raise CodexExecutionError(
            f"Token refresh failed ({resp.status_code}): {resp.text}\n"
            "Try running openai_oauth2_login() again."
        )

    new = resp.json()
    tokens["access_token"] = new["access_token"]
    if "refresh_token" in new:
        tokens["refresh_token"] = new["refresh_token"]
    _save_tokens(tokens)

    _cached_token = new["access_token"]
    _cached_token_expires_at = time.time() + new.get("expires_in", 3600)
    return new["access_token"]


def _get_access_token() -> str:
    global _cached_token, _cached_token_expires_at

    if _cached_token and time.time() < _cached_token_expires_at - 60:
        return _cached_token

    tokens = _load_tokens()

    # Proactively refresh if possible
    if tokens.get("refresh_token") and tokens.get("client_id"):
        return _refresh_access_token(tokens)

    # Fall back to stored access token (401 retry handles expiration)
    access_token = tokens.get("access_token")
    if access_token:
        _cached_token = access_token
        _cached_token_expires_at = time.time() + 300
        return access_token

    raise CodexExecutionError("No access token or refresh token available.")


# ---------------------------------------------------------------------------
# Schema normalization
# ---------------------------------------------------------------------------

def _normalize_schema(node: Any) -> Any:
    """Recursively adapt a JSON schema for the Codex Responses API."""
    if isinstance(node, dict):
        normalized = {key: _normalize_schema(value) for key, value in node.items()}
        if normalized.get("type") == "object":
            normalized.setdefault("additionalProperties", False)
            properties = normalized.get("properties", {})
            if properties:
                normalized["required"] = list(properties.keys())
        return normalized
    if isinstance(node, list):
        return [_normalize_schema(item) for item in node]
    return node


# ---------------------------------------------------------------------------
# API call
# ---------------------------------------------------------------------------

_MEDIA_TYPES = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "webp": "image/webp",
}


def _build_input_content(
    prompt: str, image_paths: list[Path] | None = None,
) -> list[dict]:
    parts: list[dict] = [{"type": "input_text", "text": prompt}]
    for img in image_paths or []:
        if not img.exists():
            continue
        data = base64.b64encode(img.read_bytes()).decode("ascii")
        media = _MEDIA_TYPES.get(img.suffix.lower().lstrip("."), "image/png")
        parts.append({
            "type": "input_image",
            "image_url": f"data:{media};base64,{data}",
        })
    return parts


def run_codex_prompt(
    prompt: str,
    model: str | None = None,
    output_schema: dict[str, Any] | None = None,
    image_paths: list[Path] | None = None,
    cwd: Path | None = None,
    timeout_seconds: int | None = None,
) -> str:
    """Send a prompt to the Codex Responses API and return the response text."""
    body: dict[str, Any] = {
        "model": model or DEFAULT_MODEL,
        "instructions": "You are a helpful assistant.",
        "input": [
            {"role": "user", "content": _build_input_content(prompt, image_paths)},
        ],
        "store": False,
        "stream": True,
    }

    if output_schema is not None:
        normalized = _normalize_schema(copy.deepcopy(output_schema))
        body["text"] = {
            "format": {
                "type": "json_schema",
                "name": "agent_output",
                "strict": True,
                "schema": normalized,
            },
        }

    timeout = float(timeout_seconds or CODEX_TIMEOUT_SECONDS)
    return _call_codex_api(body, timeout)


def _call_codex_api(body: dict, timeout: float, _retried: bool = False) -> str:
    access_token = _get_access_token()
    url = f"{CODEX_BASE_URL.rstrip('/')}/responses"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }

    output_text = ""

    try:
        with httpx.Client(timeout=httpx.Timeout(timeout)) as client:
            with client.stream("POST", url, json=body, headers=headers) as resp:
                if resp.status_code == 401 and not _retried:
                    resp.read()
                    global _cached_token, _cached_token_expires_at
                    _cached_token = None
                    _cached_token_expires_at = 0.0
                    tokens = _load_tokens()
                    _refresh_access_token(tokens)
                    return _call_codex_api(body, timeout, _retried=True)

                if resp.status_code == 429:
                    resp.read()
                    raise CodexExecutionError(
                        f"Rate limited by Codex API: {resp.text}"
                    )

                if resp.status_code != 200:
                    resp.read()
                    raise CodexExecutionError(
                        f"Codex API error ({resp.status_code}): {resp.text}"
                    )

                for line in resp.iter_lines():
                    if not line.startswith("data: "):
                        continue
                    payload = line[6:]
                    if payload.strip() == "[DONE]":
                        break
                    try:
                        event = json.loads(payload)
                    except json.JSONDecodeError:
                        continue

                    event_type = event.get("type", "")
                    if event_type == "response.output_text.delta":
                        output_text += event.get("delta", "")
                    elif event_type == "response.output_text.done":
                        output_text = event.get("text", output_text)

    except CodexExecutionError:
        raise
    except httpx.HTTPError as exc:
        raise CodexExecutionError(f"Codex API request failed: {exc}") from exc

    if not output_text:
        raise CodexExecutionError(
            "Codex API completed but returned no text output."
        )

    return output_text

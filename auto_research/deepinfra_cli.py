"""Call an OpenAI-compatible API (DeepInfra) using an API key.

Uses the standard /chat/completions endpoint with streaming.
"""

from __future__ import annotations

import base64
import json
from pathlib import Path
from typing import Any

import httpx

from auto_research.config import (
    DEEPINFRA_API_KEY,
    DEEPINFRA_BASE_URL,
    DEEPINFRA_TIMEOUT_SECONDS,
)

DEFAULT_MODEL = "meta-llama/Llama-3.3-70B-Instruct"


class DeepInfraError(RuntimeError):
    """Raised when a DeepInfra API call fails."""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_MEDIA_TYPES = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "webp": "image/webp",
}


def _build_user_content(
    prompt: str,
    image_paths: list[Path] | None = None,
) -> list[dict]:
    """Build the content array for the user message."""
    parts: list[dict] = [{"type": "text", "text": prompt}]
    for img in image_paths or []:
        if not img.exists():
            continue
        data = base64.b64encode(img.read_bytes()).decode("ascii")
        media = _MEDIA_TYPES.get(img.suffix.lower().lstrip("."), "image/png")
        parts.append({
            "type": "image_url",
            "image_url": {"url": f"data:{media};base64,{data}"},
        })
    return parts


def _schema_instruction(output_schema: dict[str, Any]) -> str:
    """Turn a JSON schema into a system-level instruction."""
    return (
        "You MUST respond with valid JSON that conforms to the following JSON schema. "
        "Do not include any text outside the JSON object.\n\n"
        f"```json\n{json.dumps(output_schema, indent=2)}\n```"
    )


# ---------------------------------------------------------------------------
# API call
# ---------------------------------------------------------------------------

def run_deepinfra_prompt(
    prompt: str,
    model: str | None = None,
    output_schema: dict[str, Any] | None = None,
    image_paths: list[Path] | None = None,
    cwd: Path | None = None,
    timeout_seconds: int | None = None,
) -> str:
    """Send a prompt to DeepInfra's chat completions API and return the response."""
    api_key = DEEPINFRA_API_KEY
    if not api_key:
        raise DeepInfraError(
            "DEEPINFRA_API_KEY environment variable is not set. "
            "Get an API key at https://deepinfra.com/dash/api_keys"
        )

    resolved_model = model or DEFAULT_MODEL

    messages: list[dict[str, Any]] = []

    # System message with optional schema constraint
    system_parts = ["You are a helpful assistant."]
    if output_schema is not None:
        system_parts.append(_schema_instruction(output_schema))
    messages.append({"role": "system", "content": "\n\n".join(system_parts)})

    # User message (text + optional images)
    if image_paths:
        messages.append({"role": "user", "content": _build_user_content(prompt, image_paths)})
    else:
        messages.append({"role": "user", "content": prompt})

    body: dict[str, Any] = {
        "model": resolved_model,
        "messages": messages,
        "stream": True,
    }

    # Request JSON output when a schema is provided
    if output_schema is not None:
        body["response_format"] = {"type": "json_object"}

    timeout = float(timeout_seconds or DEEPINFRA_TIMEOUT_SECONDS)
    return _call_api(api_key, body, timeout)


def _call_api(api_key: str, body: dict, timeout: float) -> str:
    url = f"{DEEPINFRA_BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }

    output_text = ""

    try:
        with httpx.Client(timeout=httpx.Timeout(timeout)) as client:
            with client.stream("POST", url, json=body, headers=headers) as resp:
                if resp.status_code == 401:
                    resp.read()
                    raise DeepInfraError(
                        f"Authentication failed (401): {resp.text}\n"
                        "Check your DEEPINFRA_API_KEY."
                    )

                if resp.status_code == 429:
                    resp.read()
                    raise DeepInfraError(
                        f"Rate limited by DeepInfra API: {resp.text}"
                    )

                if resp.status_code != 200:
                    resp.read()
                    raise DeepInfraError(
                        f"DeepInfra API error ({resp.status_code}): {resp.text}"
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

                    for choice in event.get("choices", []):
                        delta = choice.get("delta", {})
                        content = delta.get("content")
                        if content:
                            output_text += content

    except DeepInfraError:
        raise
    except httpx.HTTPError as exc:
        raise DeepInfraError(f"DeepInfra API request failed: {exc}") from exc

    if not output_text:
        raise DeepInfraError(
            "DeepInfra API completed but returned no text output."
        )

    return output_text

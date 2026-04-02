"""Unified LLM entry point that dispatches to the configured provider."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from auto_research.config import LLM_PROVIDER


def run_prompt(
    prompt: str,
    model: str | None = None,
    output_schema: dict[str, Any] | None = None,
    image_paths: list[Path] | None = None,
    cwd: Path | None = None,
    timeout_seconds: int | None = None,
) -> str:
    """Send a prompt to the configured LLM provider and return the response text.

    Set AUTO_RESEARCH_LLM_PROVIDER=codex to use OpenAI's Codex API,
    or AUTO_RESEARCH_LLM_PROVIDER=deepinfra (default) for DeepInfra.
    """
    if LLM_PROVIDER == "codex":
        from auto_research.codex_cli import run_codex_prompt

        return run_codex_prompt(
            prompt,
            model=model,
            output_schema=output_schema,
            image_paths=image_paths,
            cwd=cwd,
            timeout_seconds=timeout_seconds,
        )

    from auto_research.deepinfra_cli import run_deepinfra_prompt

    return run_deepinfra_prompt(
        prompt,
        model=model,
        output_schema=output_schema,
        image_paths=image_paths,
        cwd=cwd,
        timeout_seconds=timeout_seconds,
    )

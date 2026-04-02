"""Harness that runs QA specialists in source, browser, or browser-use mode."""

import asyncio
import json
import re
from pathlib import Path

from auto_research.agents.schemas import AgentReport, Finding
from auto_research.browser.playwright_runner import BrowserCapture, capture_browser_context
from auto_research.llm import run_prompt
from auto_research.config import (
    AGENT_TYPES,
    DEFAULT_RUN_MODE,
    ITERATION_MODEL,
    PROMPTS_DIR,
    RESULTS_DIR,
    SOURCE_FILES,
)


def _load_source_code() -> str:
    """Load all source files into a single formatted string."""
    parts = []
    for name, path in SOURCE_FILES.items():
        if path.exists():
            content = path.read_text(encoding="utf-8", errors="replace")
            parts.append(f"=== FILE: {name} ===\n{content}\n=== END FILE: {name} ===\n")
    return "\n".join(parts)


def _load_prompt(agent_type: str, version: int) -> str:
    """Load the prompt for a given agent type and version."""
    prompt_path = PROMPTS_DIR / f"v{version}" / f"{agent_type}.md"
    if not prompt_path.exists():
        raise FileNotFoundError(f"Prompt not found: {prompt_path}")
    return prompt_path.read_text(encoding="utf-8")


def _normalize_mode(mode: str | None) -> str:
    """Normalize and validate the requested execution mode."""
    normalized = (mode or DEFAULT_RUN_MODE or "browser-use").strip().lower()
    if normalized not in {"browser", "source", "browser-use"}:
        raise ValueError("mode must be 'browser', 'source', or 'browser-use'")
    return normalized


def prepare_shared_context(
    mode: str | None = None,
    app_url: str | None = None,
    artifact_dir: Path | None = None,
) -> tuple[str, BrowserCapture | None]:
    """Prepare the shared source/browser context for one iteration."""
    normalized_mode = _normalize_mode(mode)
    source_code = _load_source_code() if normalized_mode in {"browser", "source"} else ""
    browser_capture = None
    if normalized_mode == "browser":
        browser_capture = capture_browser_context(app_url=app_url, artifact_dir=artifact_dir)
    return source_code, browser_capture


def _build_task_prompt(
    prompt: str,
    mode: str,
    source_code: str,
    browser_capture: BrowserCapture | None,
) -> str:
    """Build the LLM task prompt for the chosen execution mode."""
    if mode == "browser" and browser_capture is not None:
        return (
            f"{prompt}\n\n"
            "PRIMARY EXECUTION MODE: browser\n\n"
            "Analyze the live browser observations below first. Use the source "
            "code as supporting evidence for root cause, file attribution, and "
            "line-level evidence. Do not invent interactions that are not "
            "supported by the crawl artifacts.\n\n"
            f"## LIVE APP URL\n{browser_capture.app_url}\n\n"
            f"## BROWSER OBSERVATIONS\n{browser_capture.summary_text}\n\n"
            "## SOURCE CODE\n"
            "IMPORTANT: Ignore all inline code comments (especially any "
            "comments referencing bug IDs like BUG-XXX). Find issues by "
            "analyzing the actual code logic, not by reading comments.\n\n"
            f"{source_code}"
        )

    return (
        f"{prompt}\n\n"
        "PRIMARY EXECUTION MODE: source\n\n"
        "Analyze the following web application source code for bugs and issues "
        "within your area of expertise. Report all findings in the specified "
        "JSON format.\n\n"
        "IMPORTANT: Ignore all inline code comments (especially any comments "
        "referencing bug IDs like BUG-XXX). Find issues by analyzing the "
        "actual code logic, not by reading comments.\n\n"
        f"{source_code}"
    )


def _parse_agent_response(agent_type: str, text: str) -> AgentReport:
    """Parse the JSON response from an agent, handling markdown code fences."""
    # Strip markdown code fences if present
    json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?\s*```', text, re.DOTALL)
    if json_match:
        text = json_match.group(1)

    # Try to find JSON object in the response
    brace_start = text.find('{')
    if brace_start == -1:
        return AgentReport(
            agent_type=agent_type,
            findings=[],
            analysis_summary=f"Failed to parse response: no JSON found",
        )

    # Find the matching closing brace
    depth = 0
    for i in range(brace_start, len(text)):
        if text[i] == '{':
            depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth == 0:
                json_str = text[brace_start:i + 1]
                break
    else:
        json_str = text[brace_start:]

    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        return AgentReport(
            agent_type=agent_type,
            findings=[],
            analysis_summary=f"Failed to parse JSON: {e}",
        )

    # Normalize findings to match schema
    findings = []
    for f in data.get("findings", []):
        findings.append(Finding(
            id=f.get("id", ""),
            severity=f.get("severity", "medium"),
            category=f.get("category", ""),
            title=f.get("title", ""),
            description=f.get("description", ""),
            file=f.get("file", ""),
            function_or_section=f.get("function_or_section", ""),
            line_evidence=f.get("line_evidence", ""),
            impact=f.get("impact", ""),
            reproduction=f.get("reproduction", ""),
        ))

    return AgentReport(
        agent_type=data.get("agent_type", agent_type),
        findings=findings,
        analysis_summary=data.get("analysis_summary", ""),
    )


def run_agent(
    agent_type: str,
    version: int,
    model: str | None = None,
    mode: str | None = None,
    source_code: str | None = None,
    browser_capture: BrowserCapture | None = None,
    app_url: str | None = None,
    artifact_dir: Path | None = None,
) -> AgentReport:
    """Run a single QA agent and return its report."""
    model = model or ITERATION_MODEL
    normalized_mode = _normalize_mode(mode)
    prompt = _load_prompt(agent_type, version)
    if source_code is None:
        source_code, browser_capture = prepare_shared_context(
            mode=normalized_mode,
            app_url=app_url,
            artifact_dir=artifact_dir,
        )

    task_prompt = _build_task_prompt(
        prompt=prompt,
        mode=normalized_mode,
        source_code=source_code,
        browser_capture=browser_capture,
    )
    text = run_prompt(
        task_prompt,
        model=model,
        output_schema=AgentReport.model_json_schema(),
        image_paths=browser_capture.image_paths if browser_capture is not None else None,
    )
    return _parse_agent_response(agent_type, text)


async def run_agent_async(
    agent_type: str,
    version: int,
    model: str | None = None,
    mode: str | None = None,
    source_code: str | None = None,
    browser_capture: BrowserCapture | None = None,
) -> AgentReport:
    """Async wrapper for run_agent using asyncio.to_thread."""
    return await asyncio.to_thread(
        run_agent,
        agent_type,
        version,
        model,
        mode,
        source_code,
        browser_capture,
    )


async def run_all_agents(
    version: int,
    model: str | None = None,
    mode: str | None = None,
    agent_types: list[str] | None = None,
    source_code: str | None = None,
    browser_capture: BrowserCapture | None = None,
    app_url: str | None = None,
    artifact_dir: Path | None = None,
) -> dict[str, AgentReport]:
    """Run all QA agents concurrently and return their reports."""
    agent_types = agent_types or AGENT_TYPES
    normalized_mode = _normalize_mode(mode)

    # Browser-use mode: delegate to the autonomous browser-use runner
    if normalized_mode == "browser-use":
        from auto_research.browser.browser_use_runner import run_all_browser_use_agents
        return await run_all_browser_use_agents(
            agent_types=agent_types,
            app_url=app_url,
            llm_model=model,
        )

    if source_code is None:
        source_code, browser_capture = prepare_shared_context(
            mode=normalized_mode,
            app_url=app_url,
            artifact_dir=artifact_dir,
        )

    coros = [
        run_agent_async(agent_type, version, model, normalized_mode, source_code, browser_capture)
        for agent_type in agent_types
    ]
    reports = await asyncio.gather(*coros)

    return dict(zip(agent_types, reports))


def save_findings(
    run_id: int,
    reports: dict[str, AgentReport],
) -> Path:
    """Save raw findings to the results directory."""
    run_dir = RESULTS_DIR / f"run_{run_id:03d}" / "raw_findings"
    run_dir.mkdir(parents=True, exist_ok=True)

    for agent_type, report in reports.items():
        output_path = run_dir / f"{agent_type}.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(report.model_dump(), f, indent=2)

    return run_dir.parent

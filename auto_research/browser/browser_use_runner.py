"""Run QA specialist agents with browser-use against the live localhost app."""

from __future__ import annotations

import inspect
import json
import os
import re
import subprocess
import time
from contextlib import contextmanager
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlparse
from urllib.request import urlopen

from pydantic import BaseModel, Field

from auto_research.agents.schemas import AgentReport, Finding
from auto_research.browser.playwright_runner import (
    _existing_url,
    _resolve_app_url,
    _wait_for_url,
)
from auto_research.config import (
    BROWSER_USE_CDP_URL,
    BROWSER_USE_CHROMIUM_EXECUTABLE,
    BROWSER_USE_CONFIG_DIR,
    BROWSER_USE_HEADLESS,
    BROWSER_USE_LLM_MODEL,
    BROWSER_USE_LLM_PROVIDER,
    BROWSER_USE_MAX_STEPS,
    BROWSER_USE_OAUTH2_TOKEN_FILE,
    BROWSER_USE_REMOTE_DEBUGGING_PORT,
    BROWSER_USE_USE_VISION,
    DEEPINFRA_API_KEY,
    DEEPINFRA_BASE_URL,
)


class BrowserUseFinding(BaseModel):
    """A single QA finding discovered by a browser-use agent."""

    id: str = ""
    severity: str = "medium"
    category: str = ""
    title: str = ""
    description: str = ""
    file: str = ""
    function_or_section: str = ""
    line_evidence: str = ""
    impact: str = ""
    reproduction: str = ""


class BrowserUseQAOutput(BaseModel):
    """Structured output returned by browser-use QA agents."""

    agent_type: str = ""
    findings: list[BrowserUseFinding] = Field(default_factory=list)
    analysis_summary: str = ""


_LOGIN_INSTRUCTIONS = (
    "First, log in to the app: look in the top-right header for a 'Login' button "
    "(it may say 'Login' or show a user avatar). Click it to open the login modal. "
    "In the modal, fill the email field with test@example.com and the password field "
    "with password123, then click the submit/Login button inside the modal. "
    "Confirm you are logged in by checking the header shows a user name or avatar "
    "instead of the Login button before proceeding."
)

SPECIALIST_TASKS: dict[str, str] = {
    "happy_path": (
        "You are a QA tester. Open {app_url} and perform a thorough walkthrough "
        "as a normal end user.\n\n"
        f"{_LOGIN_INSTRUCTIONS}\n\n"
        "Visit every main page through the sidebar: Dashboard, Jobs, Candidates, "
        "Employees, Time Off, Reviews, Departments, Onboarding, Training, Payroll, "
        "Documents, Reports, Calendar, and Settings.\n\n"
        "On each page check for broken links, missing images, placeholder text, "
        "stale metrics, empty sections with no explanation, and inconsistent date "
        "or currency formatting.\n\n"
        "Report every real bug you find from the live browser."
    ),
    "edge_case": (
        "You are a QA engineer testing edge cases and input validation. Open {app_url}.\n\n"
        f"{_LOGIN_INSTRUCTIONS}\n\n"
        "Exercise unusual and invalid inputs. Try empty submissions, malformed "
        "emails, negative and huge numbers, whitespace-only names, letters in "
        "phone fields, duplicate create clicks, future dates, end dates before "
        "start dates, and HTML or script strings in text fields.\n\n"
        "Report every real bug you find from the live browser."
    ),
    "accessibility": (
        "You are an accessibility QA specialist testing WCAG 2.1 AA issues in the "
        "running app at {app_url}.\n\n"
        f"{_LOGIN_INSTRUCTIONS}\n\n"
        "Use the keyboard heavily. Check labels, focus order, modal focus handling, "
        "skip navigation, alt text, tab semantics, and obvious low-contrast text.\n\n"
        "Report every real accessibility issue you find from the live browser."
    ),
    "error_recovery": (
        "You are a QA engineer testing error handling and recovery. Open {app_url}.\n\n"
        f"{_LOGIN_INSTRUCTIONS}\n\n"
        "Try broken routes, refreshes, back/forward navigation, closing modals at "
        "awkward times, and flows that should show errors or recover gracefully. "
        "Use browser-visible errors and console-visible errors when relevant.\n\n"
        "Report every real bug you find from the live browser."
    ),
    "viewport": (
        "You are a responsive design QA specialist. Open {app_url}.\n\n"
        f"{_LOGIN_INSTRUCTIONS}\n\n"
        "Check the app at desktop, tablet, and mobile widths. Look for clipped "
        "content, overlapping UI, sideways scrolling, modal overflow, tiny tap "
        "targets, and sticky UI collisions.\n\n"
        "Report every real layout bug you find from the live browser."
    ),
    "security": (
        "You are a security QA specialist. Open {app_url}.\n\n"
        f"{_LOGIN_INSTRUCTIONS}\n\n"
        "Test for browser-observable security issues such as unsafe rendering of "
        "HTML/script strings, exposed sensitive data in the UI, weak logout flow, "
        "and unsafe client-side storage visible through the browser.\n\n"
        "Report every real security issue you find from the live browser."
    ),
}

QA_SYSTEM_EXTENSION = """
IMPORTANT QA TESTING INSTRUCTIONS:
You are performing quality assurance testing on a web application called TalentFlow.
Base your findings only on what you observe in the running browser.
Do not inspect repository files, source code, or inline bug comments to hunt for issues.
Visit relevant pages, click controls, submit forms, and use the browser UI to verify behavior.
When you find a bug, remember the exact steps to reproduce it.
For the `file` field, use the page, route, or browser context such as `#/employees`,
`Dashboard`, or `browser-observation` instead of source filenames.
For `function_or_section`, name the visible area or control.
For `line_evidence`, use visible text, a console error, or another browser artifact.
"""

JSON_OUTPUT_CONTRACT = """
Return ONLY valid JSON with this exact shape:
{
  "agent_type": "<agent_type>",
  "analysis_summary": "2-4 sentences summarizing what you tested and the most important issues.",
  "findings": [
    {
      "id": "F-001",
      "severity": "critical",
      "category": "validation",
      "title": "Short bug title",
      "description": "What happened in the live app and why it is a bug.",
      "file": "#/jobs",
      "function_or_section": "Job creation modal",
      "line_evidence": "Visible text, console error, or other browser evidence",
      "impact": "Why this matters to the user or business",
      "reproduction": "1. ... 2. ... 3. ..."
    }
  ]
}

If you do not find any issues, return an empty findings list and explain what you tested.
"""


def _supports_parameter(callable_obj, name: str) -> bool:
    """Return whether a callable exposes a named parameter."""

    try:
        return name in inspect.signature(callable_obj).parameters
    except (TypeError, ValueError):
        return False


def _create_llm(provider: str | None = None, model: str | None = None):
    """Create the browser-use LLM client for the configured provider."""

    try:
        import browser_use  # noqa: F401
    except ImportError as exc:
        raise ImportError(
            "browser-use is required for browser-use mode. Install it with "
            "`pip install -e .[browser-use]` or `pip install browser-use`."
        ) from exc

    resolved_provider = (provider or BROWSER_USE_LLM_PROVIDER or "openai").strip().lower()
    resolved_model = (model or BROWSER_USE_LLM_MODEL or "gpt-5.4-mini").strip()

    try:
        from browser_use.llm import ChatOpenAI
    except ImportError:
        from browser_use import ChatOpenAI

    kwargs: dict = {"model": resolved_model}

    if resolved_provider == "deepinfra":
        # Use DeepInfra's OpenAI-compatible endpoint
        if not DEEPINFRA_API_KEY:
            raise ValueError(
                "DEEPINFRA_API_KEY is required when BROWSER_USE_LLM_PROVIDER=deepinfra. "
                "Get an API key at https://deepinfra.com/dash/api_keys"
            )
        if _supports_parameter(ChatOpenAI.__init__, "base_url"):
            kwargs["base_url"] = f"{DEEPINFRA_BASE_URL.rstrip('/')}"
        if _supports_parameter(ChatOpenAI.__init__, "api_key"):
            kwargs["api_key"] = DEEPINFRA_API_KEY
    else:
        # OpenAI / Codex provider
        if _supports_parameter(ChatOpenAI.__init__, "oauth2_token_file"):
            kwargs["oauth2_token_file"] = BROWSER_USE_OAUTH2_TOKEN_FILE

    if _supports_parameter(ChatOpenAI.__init__, "temperature"):
        kwargs["temperature"] = 0.0
    return ChatOpenAI(**kwargs)


def _resolve_chromium_executable() -> str:
    """Return a Chromium-based browser executable for CDP mode."""

    candidates = []
    if BROWSER_USE_CHROMIUM_EXECUTABLE:
        candidates.append(Path(BROWSER_USE_CHROMIUM_EXECUTABLE))

    candidates.extend(
        [
            Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
            Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
            Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
            Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
        ]
    )

    for candidate in candidates:
        if candidate.exists():
            return str(candidate)

    raise FileNotFoundError(
        "Could not find Chrome or Edge for CDP mode. "
        "Set BROWSER_USE_CHROMIUM_EXECUTABLE to a Chromium-based browser path."
    )


def _wait_for_cdp(cdp_url: str, timeout_seconds: int = 20) -> None:
    """Wait for a Chrome DevTools Protocol endpoint to become ready."""

    endpoint = f"{cdp_url.rstrip('/')}/json/version"
    deadline = time.time() + timeout_seconds
    last_error: Exception | None = None

    while time.time() < deadline:
        try:
            with urlopen(endpoint, timeout=2):
                return
        except (URLError, OSError) as exc:
            last_error = exc
            time.sleep(0.5)

    raise RuntimeError(f"Timed out waiting for browser CDP at {endpoint}: {last_error}")


@contextmanager
def _cdp_browser(cdp_url: str, headless: bool | None = None):
    """Ensure a Chromium browser is running with a CDP endpoint."""

    resolved_headless = BROWSER_USE_HEADLESS if headless is None else headless
    os.environ["BROWSER_USE_CONFIG_DIR"] = str(BROWSER_USE_CONFIG_DIR)
    BROWSER_USE_CONFIG_DIR.mkdir(parents=True, exist_ok=True)

    try:
        _wait_for_cdp(cdp_url, timeout_seconds=2)
        yield cdp_url
        return
    except RuntimeError:
        pass

    executable = _resolve_chromium_executable()
    parsed = urlparse(cdp_url)
    port = parsed.port or BROWSER_USE_REMOTE_DEBUGGING_PORT
    profile_dir = BROWSER_USE_CONFIG_DIR / "chrome-profile"
    profile_dir.mkdir(parents=True, exist_ok=True)

    command = [
        executable,
        f"--remote-debugging-port={port}",
        f"--user-data-dir={profile_dir}",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-background-networking",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-software-rasterizer",
        "about:blank",
    ]
    if resolved_headless:
        command.append("--headless=new")

    process = subprocess.Popen(
        command,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        _wait_for_cdp(cdp_url)
        yield cdp_url
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()


def _build_task(agent_type: str, app_url: str) -> str:
    """Build the browser-only task for one QA specialist."""

    task_template = SPECIALIST_TASKS.get(agent_type)
    if task_template is None:
        raise KeyError(agent_type)

    return (
        f"{task_template.format(app_url=app_url)}\n\n"
        f"{QA_SYSTEM_EXTENSION.strip()}\n\n"
        f"{JSON_OUTPUT_CONTRACT.replace('<agent_type>', agent_type).strip()}"
    )


def _create_browser(cdp_url: str):
    """Create a browser-use browser object attached to a CDP endpoint."""

    os.environ["BROWSER_USE_CONFIG_DIR"] = str(BROWSER_USE_CONFIG_DIR)

    try:
        from browser_use import Browser

        return Browser(cdp_url=cdp_url)
    except ImportError:
        pass
    except TypeError:
        pass

    from browser_use import BrowserSession

    try:
        return BrowserSession(cdp_url=cdp_url)
    except TypeError:
        pass

    raise RuntimeError(
        "This browser-use installation does not support Browser(cdp_url=...) "
        "or BrowserSession(cdp_url=...)."
    )


def _extract_result_text(result) -> str:
    """Return the most likely final result text from a browser-use run."""

    if result is None:
        return ""
    if isinstance(result, str):
        return result

    for attr in ("final_result", "final_response", "result"):
        value = getattr(result, attr, None)
        if callable(value):
            try:
                extracted = value()
            except TypeError:
                continue
            if extracted:
                return str(extracted)
        elif value:
            return str(value)

    if hasattr(result, "model_dump_json"):
        return result.model_dump_json()
    return str(result)


async def run_browser_use_agent(
    agent_type: str,
    app_url: str,
    cdp_url: str | None = None,
    llm_provider: str | None = None,
    llm_model: str | None = None,
    max_steps: int | None = None,
) -> AgentReport:
    """Run a single browser-use QA agent and return its report."""

    from browser_use import Agent

    if agent_type not in SPECIALIST_TASKS:
        return AgentReport(
            agent_type=agent_type,
            findings=[],
            analysis_summary=f"Unknown agent type: {agent_type}",
        )

    resolved_max_steps = BROWSER_USE_MAX_STEPS if max_steps is None else max_steps
    task = _build_task(agent_type, app_url)
    llm = _create_llm(provider=llm_provider, model=llm_model)
    browser = _create_browser(cdp_url or BROWSER_USE_CDP_URL)

    agent_kwargs = {
        "task": task,
        "llm": llm,
    }
    if _supports_parameter(Agent.__init__, "browser"):
        agent_kwargs["browser"] = browser
    elif _supports_parameter(Agent.__init__, "browser_session"):
        agent_kwargs["browser_session"] = browser
    if _supports_parameter(Agent.__init__, "use_vision"):
        agent_kwargs["use_vision"] = BROWSER_USE_USE_VISION
    if _supports_parameter(Agent.__init__, "max_actions_per_step"):
        agent_kwargs["max_actions_per_step"] = 3
    if _supports_parameter(Agent.__init__, "extend_system_message"):
        agent_kwargs["extend_system_message"] = QA_SYSTEM_EXTENSION.strip()

    agent = Agent(**agent_kwargs)

    try:
        if _supports_parameter(agent.run, "max_steps"):
            result = await agent.run(max_steps=resolved_max_steps)
        else:
            result = await agent.run()
        result_text = _extract_result_text(result)
        if result_text:
            return _parse_browser_use_result(agent_type, result_text)
        return AgentReport(
            agent_type=agent_type,
            findings=[],
            analysis_summary="Agent completed but produced no structured output.",
        )
    except Exception as exc:
        return AgentReport(
            agent_type=agent_type,
            findings=[],
            analysis_summary=f"Agent failed with error: {exc}",
        )


def _extract_json_object(text: str, start: int) -> str:
    """Extract the outermost JSON object starting at *start*."""

    depth = 0
    for index in range(start, len(text)):
        if text[index] == "{":
            depth += 1
        elif text[index] == "}":
            depth -= 1
            if depth == 0:
                return text[start : index + 1]
    return text[start:]


def _output_to_report(agent_type: str, output: BrowserUseQAOutput) -> AgentReport:
    """Convert a BrowserUseQAOutput instance to an AgentReport."""

    findings = [
        Finding(
            id=finding.id,
            severity=finding.severity,
            category=finding.category,
            title=finding.title,
            description=finding.description,
            file=finding.file,
            function_or_section=finding.function_or_section,
            line_evidence=finding.line_evidence,
            impact=finding.impact,
            reproduction=finding.reproduction,
        )
        for finding in output.findings
    ]
    return AgentReport(
        agent_type=output.agent_type or agent_type,
        findings=findings,
        analysis_summary=output.analysis_summary,
    )


def _parse_browser_use_result(agent_type: str, text: str) -> AgentReport:
    """Parse browser-use agent output into an AgentReport."""

    try:
        data = BrowserUseQAOutput.model_validate_json(text)
        return _output_to_report(agent_type, data)
    except Exception:
        pass

    json_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    if json_match:
        text = json_match.group(1)

    brace_start = text.find("{")
    if brace_start == -1:
        return AgentReport(
            agent_type=agent_type,
            findings=[],
            analysis_summary="Could not parse agent output because no JSON object was found.",
        )

    try:
        raw = json.loads(_extract_json_object(text, brace_start))
    except json.JSONDecodeError as exc:
        return AgentReport(
            agent_type=agent_type,
            findings=[],
            analysis_summary=f"Failed to parse agent JSON: {exc}",
        )

    findings = [
        Finding(
            id=item.get("id", ""),
            severity=item.get("severity", "medium"),
            category=item.get("category", ""),
            title=item.get("title", ""),
            description=item.get("description", ""),
            file=item.get("file", ""),
            function_or_section=item.get("function_or_section", ""),
            line_evidence=item.get("line_evidence", ""),
            impact=item.get("impact", ""),
            reproduction=item.get("reproduction", ""),
        )
        for item in raw.get("findings", [])
    ]
    return AgentReport(
        agent_type=raw.get("agent_type", agent_type),
        findings=findings,
        analysis_summary=raw.get("analysis_summary", ""),
    )


async def run_all_browser_use_agents(
    agent_types: list[str],
    app_url: str | None = None,
    cdp_url: str | None = None,
    llm_provider: str | None = None,
    llm_model: str | None = None,
    headless: bool | None = None,
    max_steps: int | None = None,
) -> dict[str, AgentReport]:
    """Run all browser-use QA agents against the live benchmark app."""

    resolved_url, server_cm = _resolve_app_url(app_url)
    context_manager = _existing_url(resolved_url) if server_cm is None else server_cm
    reports: dict[str, AgentReport] = {}

    with context_manager as active_url, _cdp_browser(cdp_url or BROWSER_USE_CDP_URL, headless=headless) as active_cdp_url:
        _wait_for_url(active_url)
        print(f"  Benchmark app ready at {active_url}")
        print(f"  Browser CDP ready at {active_cdp_url}")

        for agent_type in agent_types:
            print(f"  Running browser-use agent: {agent_type}...")
            report = await run_browser_use_agent(
                agent_type=agent_type,
                app_url=active_url,
                cdp_url=active_cdp_url,
                llm_provider=llm_provider,
                llm_model=llm_model,
                max_steps=max_steps,
            )
            reports[agent_type] = report
            print(f"    -> {len(report.findings)} findings")

    return reports

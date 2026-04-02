"""LLM-as-judge matching between agent findings and known bugs."""

import json
import re

from pydantic import BaseModel, Field

from auto_research.agents.schemas import Bug, Finding, MatchResult
from auto_research.llm import run_prompt
from auto_research.config import VALIDATION_MODEL

JUDGE_PROMPT = """You are an evaluation judge. Your job is to match QA findings to known bugs.

You will receive:
1. A list of FINDINGS reported by a QA agent (each with an id, title, description, file, function, and evidence)
2. A list of KNOWN BUGS (each with an id, issue description, location, and trigger)

For each known bug, determine if any finding describes the SAME underlying issue.
A match means the finding identifies the same code defect — even if worded differently.

Rules:
- Each finding can match at most ONE bug
- Each bug can match at most ONE finding
- Only match if you are confident they describe the same defect (>70% sure)
- Also flag "near misses" where a finding is related but not quite the same defect (40-70% sure)

Return ONLY valid JSON with this exact structure:
```json
{
  "matches": [
    {"finding_id": "F-001", "bug_id": "BUG-001", "confidence": 0.95, "reasoning": "Both describe email validation only checking for @ symbol"}
  ],
  "near_misses": [
    {"finding_id": "F-005", "bug_id": "BUG-010", "confidence": 0.55, "reasoning": "Finding mentions numeric validation but for a different field"}
  ]
}
```"""


class JudgeEntry(BaseModel):
    """One match or near-miss candidate from the reviewer/judge."""

    finding_id: str
    bug_id: str
    confidence: float
    reasoning: str = ""


class JudgeResponse(BaseModel):
    """Structured result returned by the reviewer/judge."""

    matches: list[JudgeEntry] = Field(default_factory=list)
    near_misses: list[JudgeEntry] = Field(default_factory=list)


def _format_findings(findings: list[Finding]) -> str:
    """Format findings for the judge prompt."""
    items = []
    for f in findings:
        items.append(
            f"- ID: {f.id}\n"
            f"  Title: {f.title}\n"
            f"  Description: {f.description}\n"
            f"  File: {f.file}\n"
            f"  Function: {f.function_or_section}\n"
            f"  Evidence: {f.line_evidence}"
        )
    return "\n".join(items) if items else "(no findings)"


def _format_bugs(bugs: list[Bug]) -> str:
    """Format bugs for the judge prompt."""
    items = []
    for b in bugs:
        items.append(
            f"- ID: {b.id}\n"
            f"  Issue: {b.issue}\n"
            f"  Location: {b.location}\n"
            f"  Trigger: {b.trigger}"
        )
    return "\n".join(items)


def _parse_judge_response(text: str) -> JudgeResponse:
    """Parse the judge's JSON response."""
    json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?\s*```', text, re.DOTALL)
    if json_match:
        text = json_match.group(1)

    brace_start = text.find('{')
    if brace_start == -1:
        return JudgeResponse()

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
        return JudgeResponse.model_validate(json.loads(json_str))
    except (json.JSONDecodeError, ValueError):
        return JudgeResponse()


def _to_match_result(entry: JudgeEntry) -> MatchResult:
    """Convert a judge match entry to a MatchResult."""
    return MatchResult(
        finding_id=entry.finding_id,
        bug_id=entry.bug_id,
        confidence=entry.confidence,
        reasoning=entry.reasoning,
    )


def match_findings_to_bugs(
    findings: list[Finding],
    bugs: list[Bug],
) -> tuple[list[MatchResult], list[MatchResult]]:
    """Match findings to bugs using an LLM judge.

    Returns (matches, near_misses).
    """
    if not findings or not bugs:
        return [], []

    user_msg = (
        f"{JUDGE_PROMPT}\n\n"
        f"## FINDINGS ({len(findings)} total)\n\n"
        f"{_format_findings(findings)}\n\n"
        f"## KNOWN BUGS ({len(bugs)} total)\n\n"
        f"{_format_bugs(bugs)}\n\n"
        "Match each known bug to the finding that describes the same defect, if any."
    )
    text = run_prompt(
        user_msg,
        model=VALIDATION_MODEL,
        output_schema=JudgeResponse.model_json_schema(),
    )
    data = _parse_judge_response(text)

    # Validate: no duplicate assignments
    used_findings: set[str] = set()
    used_bugs: set[str] = set()

    matches = []
    for entry in data.matches:
        fid = entry.finding_id
        bid = entry.bug_id
        if fid not in used_findings and bid not in used_bugs:
            matches.append(_to_match_result(entry))
            used_findings.add(fid)
            used_bugs.add(bid)

    near_misses = []
    for entry in data.near_misses:
        fid = entry.finding_id
        bid = entry.bug_id
        if fid not in used_findings and bid not in used_bugs:
            near_misses.append(_to_match_result(entry))

    return matches, near_misses

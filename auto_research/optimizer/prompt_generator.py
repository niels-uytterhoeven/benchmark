"""Generate improved agent prompts based on gap analysis."""

import json
import shutil
from pathlib import Path

from auto_research.agents.schemas import AgentReport, Bug, EvalResult
from auto_research.llm import run_prompt
from auto_research.config import (
    BUGS_JSON,
    OPTIMIZER_MODEL,
    PROMPTS_DIR,
)
from auto_research.optimizer.meta_prompt import META_PROMPT


def _load_bugs_by_id() -> dict[str, Bug]:
    with open(BUGS_JSON, encoding="utf-8") as f:
        return {b["id"]: Bug(**b) for b in json.load(f)}


def _format_true_positives(eval_result: EvalResult) -> str:
    """Format true positives for the meta-prompt."""
    bugs = _load_bugs_by_id()
    lines = []
    for tp in eval_result.true_positives:
        bug = bugs.get(tp.bug_id)
        if bug:
            lines.append(f"- {tp.bug_id}: {bug.issue[:100]} (confidence: {tp.confidence:.2f})")
    return "\n".join(lines) if lines else "None"


def _format_false_negatives(eval_result: EvalResult, gap_analysis: dict) -> str:
    """Format false negatives with gap details for the meta-prompt."""
    bugs = _load_bugs_by_id()
    lines = []
    for missed in gap_analysis.get("missed_bugs", []):
        bug = bugs.get(missed["bug_id"])
        if bug:
            lines.append(
                f"- {missed['bug_id']} [{missed['bug_severity']}] "
                f"({missed['gap_type']}): {bug.issue[:100]}\n"
                f"  Reason missed: {missed['reason']}"
            )
    return "\n".join(lines) if lines else "None"


def _format_false_positives(eval_result: EvalResult) -> str:
    """Format false positive summary."""
    count = len(eval_result.false_positives)
    if count == 0:
        return "None"
    return (
        f"{count} findings did not match any known bug. "
        f"Finding IDs: {', '.join(eval_result.false_positives[:10])}"
    )


def _format_gap_summary(gap_analysis: dict) -> str:
    """Format the gap type summary."""
    lines = []
    summary = gap_analysis.get("gap_type_summary", {})
    for gap_type, count in summary.items():
        lines.append(f"- {gap_type}: {count} bugs missed due to this pattern")

    bugs_by_type = gap_analysis.get("gap_type_bugs", {})
    for gap_type, bug_ids in bugs_by_type.items():
        lines.append(f"  {gap_type} bugs: {', '.join(bug_ids)}")

    return "\n".join(lines) if lines else "No specific patterns identified"


def generate_improved_prompt(
    agent_type: str,
    current_version: int,
    eval_result: EvalResult,
    gap_analysis: dict,
) -> str:
    """Call Codex with the meta-prompt to generate an improved agent prompt."""
    current_prompt_path = PROMPTS_DIR / f"v{current_version}" / f"{agent_type}.md"
    current_prompt = current_prompt_path.read_text(encoding="utf-8")

    filled_prompt = META_PROMPT.format(
        current_prompt=current_prompt,
        true_positives=_format_true_positives(eval_result),
        false_negatives=_format_false_negatives(eval_result, gap_analysis),
        false_positives=_format_false_positives(eval_result),
        gap_analysis=_format_gap_summary(gap_analysis),
    )

    return run_prompt(
        filled_prompt,
        model=OPTIMIZER_MODEL,
    )


def save_improved_prompt(
    agent_type: str,
    new_version: int,
    prompt_text: str,
) -> Path:
    """Save the improved prompt to the new version directory."""
    version_dir = PROMPTS_DIR / f"v{new_version}"
    version_dir.mkdir(parents=True, exist_ok=True)
    prompt_path = version_dir / f"{agent_type}.md"
    prompt_path.write_text(prompt_text, encoding="utf-8")
    return prompt_path


def optimize_all_prompts(
    current_version: int,
    run_result,
    gaps: dict[str, dict],
) -> int:
    """Optimize all agent prompts and save as new version.

    Returns the new version number.
    """
    new_version = current_version + 1

    for eval_result in run_result.agent_results:
        agent_type = eval_result.agent_type
        gap_analysis = gaps.get(agent_type, {})

        # Skip optimization if agent already has perfect recall
        if eval_result.recall >= 0.95 and eval_result.precision >= 0.80:
            # Copy current prompt as-is
            src = PROMPTS_DIR / f"v{current_version}" / f"{agent_type}.md"
            dst_dir = PROMPTS_DIR / f"v{new_version}"
            dst_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst_dir / f"{agent_type}.md")
            print(f"  {agent_type}: already excellent (R={eval_result.recall:.2f}), copying unchanged")
            continue

        print(f"  {agent_type}: optimizing (R={eval_result.recall:.2f}, P={eval_result.precision:.2f})...")
        improved = generate_improved_prompt(
            agent_type, current_version, eval_result, gap_analysis,
        )
        save_improved_prompt(agent_type, new_version, improved)
        print(f"  {agent_type}: saved v{new_version} prompt")

    return new_version

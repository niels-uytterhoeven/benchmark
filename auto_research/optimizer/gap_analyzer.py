"""Analyze gaps between agent findings and ground truth to guide prompt improvement."""

import json
from pathlib import Path

from auto_research.agents.schemas import AgentReport, Bug, EvalResult
from auto_research.config import BUGS_JSON, RESULTS_DIR


def load_bugs_by_id() -> dict[str, Bug]:
    """Load bugs indexed by ID."""
    with open(BUGS_JSON, encoding="utf-8") as f:
        data = json.load(f)
    return {b["id"]: Bug(**b) for b in data}


def classify_gap(bug: Bug, report: AgentReport) -> dict:
    """Classify why a bug was missed by an agent.

    Gap types:
    - blind_spot: Agent never examined the bug's category/area
    - wrong_file: Agent didn't look at the relevant file
    - shallow_analysis: Agent looked at the right area but missed the specific defect
    - pattern_miss: Agent flagged something similar but didn't identify the actual issue
    """
    finding_files = {f.file.lower() for f in report.findings}
    finding_funcs = {f.function_or_section.lower() for f in report.findings}
    finding_categories = {f.category.lower() for f in report.findings}

    bug_file = bug.matching_file.lower()
    bug_func = bug.matching_function.lower()
    bug_category = bug.category.lower()

    # Check if agent examined the right file
    file_examined = any(bug_file in ff or ff in bug_file for ff in finding_files) if bug_file else False

    # Check if agent examined the right function
    func_examined = any(bug_func in ff or ff in bug_func for ff in finding_funcs) if bug_func else False

    # Check if agent examined the right category
    category_examined = any(
        bug_category in fc or fc in bug_category
        for fc in finding_categories
    )

    if not file_examined and not category_examined:
        gap_type = "blind_spot"
        reason = f"Agent never examined {bug.matching_file} or the '{bug.category}' category"
    elif file_examined and not func_examined:
        gap_type = "wrong_file"
        reason = f"Agent examined {bug.matching_file} but didn't analyze {bug.matching_function}"
    elif file_examined and func_examined:
        gap_type = "shallow_analysis"
        reason = f"Agent examined {bug.matching_function} in {bug.matching_file} but missed the specific defect"
    else:
        gap_type = "pattern_miss"
        reason = f"Agent found issues in '{bug.category}' but not this specific pattern"

    return {
        "bug_id": bug.id,
        "bug_severity": bug.severity,
        "bug_category": bug.category,
        "bug_issue": bug.issue,
        "bug_file": bug.matching_file,
        "bug_function": bug.matching_function,
        "gap_type": gap_type,
        "reason": reason,
    }


def analyze_gaps(
    eval_result: EvalResult,
    report: AgentReport,
) -> dict:
    """Analyze all gaps for a single agent."""
    bugs_by_id = load_bugs_by_id()

    missed_analysis = []
    for bug_id in eval_result.false_negatives:
        bug = bugs_by_id.get(bug_id)
        if bug:
            gap = classify_gap(bug, report)
            # Add near miss info if available
            near_miss = next(
                (nm for nm in eval_result.near_misses if nm.bug_id == bug_id),
                None,
            )
            if near_miss:
                gap["near_miss_finding"] = near_miss.finding_id
                gap["near_miss_confidence"] = near_miss.confidence
                gap["near_miss_reasoning"] = near_miss.reasoning
            missed_analysis.append(gap)

    # Summarize gap patterns
    gap_types = {}
    for gap in missed_analysis:
        gap_types.setdefault(gap["gap_type"], []).append(gap["bug_id"])

    # Summarize false positive patterns
    fp_count = len(eval_result.false_positives)

    return {
        "agent_type": eval_result.agent_type,
        "total_expected": len(eval_result.true_positives) + len(eval_result.false_negatives),
        "total_found": len(eval_result.true_positives) + len(eval_result.false_positives),
        "matched": len(eval_result.true_positives),
        "missed_bugs": missed_analysis,
        "gap_type_summary": {k: len(v) for k, v in gap_types.items()},
        "gap_type_bugs": gap_types,
        "false_positive_count": fp_count,
    }


def analyze_all_gaps(
    run_result,
    reports: dict[str, AgentReport],
) -> dict[str, dict]:
    """Analyze gaps for all agents in a run."""
    all_gaps = {}
    for eval_result in run_result.agent_results:
        report = reports.get(eval_result.agent_type)
        if report:
            all_gaps[eval_result.agent_type] = analyze_gaps(eval_result, report)
    return all_gaps


def save_gaps(run_id: int, gaps: dict[str, dict]) -> Path:
    """Save gap analysis to the run directory."""
    run_dir = RESULTS_DIR / f"run_{run_id:03d}"
    run_dir.mkdir(parents=True, exist_ok=True)
    gaps_path = run_dir / "gaps.json"
    with open(gaps_path, "w", encoding="utf-8") as f:
        json.dump(gaps, f, indent=2)
    return gaps_path

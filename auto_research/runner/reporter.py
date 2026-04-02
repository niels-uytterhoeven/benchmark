"""Generate markdown analysis reports for each run."""

import json
from pathlib import Path

from auto_research.agents.schemas import Bug, EvalResult, RunResult
from auto_research.config import BUGS_JSON, RESULTS_DIR


def _load_bugs_by_id() -> dict[str, Bug]:
    """Load bugs indexed by ID."""
    with open(BUGS_JSON, encoding="utf-8") as f:
        data = json.load(f)
    return {b["id"]: Bug(**b) for b in data}


def generate_report(run_id: int, result: RunResult) -> str:
    """Generate a markdown report for a run."""
    bugs_by_id = _load_bugs_by_id()
    lines = []

    lines.append(f"# Run {run_id:03d} Results\n")
    lines.append(f"**Overall**: P={result.overall_precision:.2f}, "
                 f"R={result.overall_recall:.2f}, F1={result.overall_f1:.2f}\n")

    # Per-agent table
    lines.append("## Per-Agent Breakdown\n")
    lines.append("| Agent | Expected | Found | Matched | Precision | Recall | F1 |")
    lines.append("|-------|----------|-------|---------|-----------|--------|------|")

    for ar in result.agent_results:
        expected = len(ar.true_positives) + len(ar.false_negatives)
        found = len(ar.true_positives) + len(ar.false_positives)
        matched = len(ar.true_positives)
        lines.append(
            f"| {ar.agent_type} | {expected} | {found} | {matched} "
            f"| {ar.precision:.2f} | {ar.recall:.2f} | {ar.f1:.2f} |"
        )

    # True positives
    lines.append("\n## True Positives (Matched Bugs)\n")
    for ar in result.agent_results:
        if ar.true_positives:
            lines.append(f"### {ar.agent_type}\n")
            for tp in ar.true_positives:
                bug = bugs_by_id.get(tp.bug_id)
                bug_desc = bug.issue[:80] if bug else "Unknown"
                lines.append(
                    f"- **{tp.bug_id}** (confidence {tp.confidence:.2f}): "
                    f"{bug_desc}"
                )
            lines.append("")

    # False negatives (missed bugs)
    lines.append("## Missed Bugs (False Negatives)\n")
    for ar in result.agent_results:
        if ar.false_negatives:
            lines.append(f"### {ar.agent_type}\n")
            for bug_id in ar.false_negatives:
                bug = bugs_by_id.get(bug_id)
                if bug:
                    # Check for near miss
                    near = next((nm for nm in ar.near_misses if nm.bug_id == bug_id), None)
                    near_info = f" (near miss: {near.finding_id} scored {near.confidence:.2f})" if near else ""
                    lines.append(
                        f"- **{bug_id}** [{bug.severity}]: {bug.issue[:80]}{near_info}"
                    )
            lines.append("")

    # False positives
    lines.append("## False Positives\n")
    for ar in result.agent_results:
        if ar.false_positives:
            lines.append(f"### {ar.agent_type}\n")
            for fp_id in ar.false_positives:
                lines.append(f"- Finding {fp_id}: no matching known bug")
            lines.append("")

    # Near misses
    if any(ar.near_misses for ar in result.agent_results):
        lines.append("## Near Misses (Reviewer-Judged)\n")
        for ar in result.agent_results:
            if ar.near_misses:
                lines.append(f"### {ar.agent_type}\n")
                for nm in ar.near_misses:
                    bug = bugs_by_id.get(nm.bug_id)
                    bug_desc = bug.issue[:60] if bug else "Unknown"
                    reason = f" Reasoning: {nm.reasoning}" if nm.reasoning else ""
                    lines.append(
                        f"- {nm.finding_id} -> {nm.bug_id} "
                        f"(conf={nm.confidence:.2f}): {bug_desc}{reason}"
                    )
                lines.append("")

    return "\n".join(lines)


def save_report(run_id: int, result: RunResult) -> Path:
    """Generate and save the markdown report."""
    report_text = generate_report(run_id, result)
    run_dir = RESULTS_DIR / f"run_{run_id:03d}"
    run_dir.mkdir(parents=True, exist_ok=True)
    report_path = run_dir / "report.md"
    report_path.write_text(report_text, encoding="utf-8")
    return report_path


def update_summary(run_id: int, result: RunResult) -> Path:
    """Update the cross-run summary with this run's metrics."""
    summary_path = RESULTS_DIR / "summary.json"

    if summary_path.exists():
        with open(summary_path, encoding="utf-8") as f:
            summary = json.load(f)
    else:
        summary = {"runs": []}

    run_entry = {
        "run_id": run_id,
        "overall_precision": result.overall_precision,
        "overall_recall": result.overall_recall,
        "overall_f1": result.overall_f1,
        "per_agent": {
            ar.agent_type: {"precision": ar.precision, "recall": ar.recall, "f1": ar.f1}
            for ar in result.agent_results
        },
    }

    # Replace existing entry for this run_id or append
    existing_idx = next(
        (i for i, r in enumerate(summary["runs"]) if r["run_id"] == run_id),
        None,
    )
    if existing_idx is not None:
        summary["runs"][existing_idx] = run_entry
    else:
        summary["runs"].append(run_entry)

    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    return summary_path

"""Evaluate agent findings against ground truth bugs."""

import json
from pathlib import Path

from auto_research.agents.schemas import (
    AgentReport,
    Bug,
    EvalResult,
    RunResult,
)
from auto_research.ground_truth.matching import match_findings_to_bugs
from auto_research.config import BUGS_JSON, RESULTS_DIR


def load_ground_truth() -> list[Bug]:
    """Load bugs from bugs.json."""
    with open(BUGS_JSON, encoding="utf-8") as f:
        data = json.load(f)
    return [Bug(**b) for b in data]


def evaluate_agent(
    report: AgentReport,
    bugs: list[Bug],
) -> EvalResult:
    """Evaluate a single agent's findings against the ground truth.

    Only evaluates against bugs that this agent type is expected to find.
    """
    agent_type = report.agent_type
    expected_bugs = [b for b in bugs if agent_type in b.expected_agents]

    if not expected_bugs:
        return EvalResult(
            agent_type=agent_type,
            true_positives=[],
            false_positives=[f.id for f in report.findings],
            false_negatives=[],
            near_misses=[],
            precision=0.0,
            recall=0.0,
            f1=0.0,
        )

    matches, near_misses = match_findings_to_bugs(report.findings, expected_bugs)

    matched_finding_ids = {m.finding_id for m in matches}
    matched_bug_ids = {m.bug_id for m in matches}

    false_positives = [f.id for f in report.findings if f.id not in matched_finding_ids]
    false_negatives = [b.id for b in expected_bugs if b.id not in matched_bug_ids]

    tp = len(matches)
    fp = len(false_positives)
    fn = len(false_negatives)

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

    return EvalResult(
        agent_type=agent_type,
        true_positives=matches,
        false_positives=false_positives,
        false_negatives=false_negatives,
        near_misses=near_misses,
        precision=round(precision, 4),
        recall=round(recall, 4),
        f1=round(f1, 4),
    )


def evaluate_run(
    reports: dict[str, AgentReport],
    bugs: list[Bug] | None = None,
) -> RunResult:
    """Evaluate all agent reports for a single run."""
    if bugs is None:
        bugs = load_ground_truth()

    agent_results = []
    total_tp = 0
    total_fp = 0
    total_fn = 0

    for agent_type, report in reports.items():
        result = evaluate_agent(report, bugs)
        agent_results.append(result)
        total_tp += len(result.true_positives)
        total_fp += len(result.false_positives)
        total_fn += len(result.false_negatives)

    overall_precision = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0.0
    overall_recall = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0.0
    overall_f1 = (
        2 * overall_precision * overall_recall / (overall_precision + overall_recall)
        if (overall_precision + overall_recall) > 0
        else 0.0
    )

    return RunResult(
        run_id=0,  # Set by caller
        agent_results=agent_results,
        overall_precision=round(overall_precision, 4),
        overall_recall=round(overall_recall, 4),
        overall_f1=round(overall_f1, 4),
    )


def save_scores(run_id: int, result: RunResult) -> Path:
    """Save evaluation scores to the run directory."""
    run_dir = RESULTS_DIR / f"run_{run_id:03d}"
    run_dir.mkdir(parents=True, exist_ok=True)
    scores_path = run_dir / "scores.json"
    with open(scores_path, "w", encoding="utf-8") as f:
        json.dump(result.model_dump(), f, indent=2)
    return scores_path

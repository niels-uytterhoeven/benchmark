"""Main entry point: orchestrates the auto-research QA agent training loop."""

import asyncio
import time
from pathlib import Path

from auto_research.config import (
    DEFAULT_APP_URL,
    DEFAULT_RUN_MODE,
    MAX_ITERATIONS,
    MIN_F1_IMPROVEMENT,
    NO_IMPROVEMENT_PATIENCE,
    RESULTS_DIR,
)
from auto_research.ground_truth.parser import generate_bugs_json
from auto_research.runner.harness import prepare_shared_context, run_all_agents, save_findings
from auto_research.runner.evaluator import evaluate_run, load_ground_truth, save_scores
from auto_research.runner.reporter import save_report, update_summary
from auto_research.optimizer.gap_analyzer import analyze_all_gaps, save_gaps
from auto_research.optimizer.prompt_generator import optimize_all_prompts


def has_meaningful_improvement(
    current_f1: float,
    best_f1: float | None,
    min_improvement: float,
) -> bool:
    """Return whether the current F1 meaningfully improves on the best so far."""
    if best_f1 is None:
        return True
    return current_f1 > best_f1 + min_improvement


async def run_iteration(
    run_id: int,
    version: int,
    model: str | None = None,
    mode: str | None = None,
    app_url: str | None = None,
    agent_types: list[str] | None = None,
) -> tuple[float, dict, object]:
    """Run one full iteration: skills -> evaluate -> report -> gaps.

    Returns (f1_score, gaps_dict, run_result).
    """
    print(f"\n{'='*60}")
    print(f"  ITERATION {run_id} (prompt version v{version})")
    print(f"{'='*60}\n")
    normalized_mode = (mode or DEFAULT_RUN_MODE).strip().lower()
    run_dir = RESULTS_DIR / f"run_{run_id:03d}"
    run_dir.mkdir(parents=True, exist_ok=True)

    # 1. Run all specialist skills
    if agent_types:
        print(f"Running {len(agent_types)} specialist QA skills in {normalized_mode} mode...")
    else:
        print(f"Running all specialist QA skills in {normalized_mode} mode...")
    source_code, browser_capture = prepare_shared_context(
        mode=normalized_mode,
        app_url=app_url,
        artifact_dir=run_dir / "browser_artifacts",
    )
    start = time.time()
    reports = await run_all_agents(
        version=version,
        model=model,
        mode=normalized_mode,
        agent_types=agent_types,
        source_code=source_code,
        browser_capture=browser_capture,
        app_url=app_url,
        artifact_dir=run_dir / "browser_artifacts",
    )
    elapsed = time.time() - start
    print(f"  Skills completed in {elapsed:.1f}s")
    if browser_capture is not None:
        print(f"  Browser artifacts saved to {browser_capture.artifact_dir}")

    for agent_type, report in reports.items():
        print(f"  {agent_type}: {len(report.findings)} findings")

    # 2. Save raw findings
    save_findings(run_id, reports)

    # 3. Evaluate against ground truth
    print("\nEvaluating against ground truth...")
    bugs = load_ground_truth()
    run_result = evaluate_run(reports, bugs)
    run_result.run_id = run_id
    save_scores(run_id, run_result)

    print(f"\n  Overall: P={run_result.overall_precision:.2f}, "
          f"R={run_result.overall_recall:.2f}, F1={run_result.overall_f1:.2f}")
    for ar in run_result.agent_results:
        print(f"  {ar.agent_type}: P={ar.precision:.2f}, R={ar.recall:.2f}, "
              f"F1={ar.f1:.2f} ({len(ar.true_positives)} matched, "
              f"{len(ar.false_negatives)} missed, {len(ar.false_positives)} FP)")

    # 4. Generate report
    report_path = save_report(run_id, run_result)
    print(f"\n  Report saved to {report_path}")

    # 5. Analyze gaps
    print("\nAnalyzing gaps...")
    gaps = analyze_all_gaps(run_result, reports)
    save_gaps(run_id, gaps)

    for agent_type, gap in gaps.items():
        types = gap.get("gap_type_summary", {})
        print(f"  {agent_type}: {types}")

    # 6. Update summary
    update_summary(run_id, run_result)

    return run_result.overall_f1, gaps, run_result


async def main(
    max_iterations: int | None = None,
    model: str | None = None,
    mode: str | None = None,
    app_url: str | None = None,
    agent_types: list[str] | None = None,
    min_improvement: float | None = None,
    patience: int | None = None,
):
    """Run the full auto-research training loop."""
    max_iterations = max_iterations or MAX_ITERATIONS
    mode = (mode or DEFAULT_RUN_MODE).strip().lower()
    app_url = app_url or DEFAULT_APP_URL or None
    min_improvement = MIN_F1_IMPROVEMENT if min_improvement is None else min_improvement
    patience = NO_IMPROVEMENT_PATIENCE if patience is None else patience
    if min_improvement < 0:
        raise ValueError("min_improvement must be >= 0")
    if patience < 1:
        raise ValueError("patience must be >= 1")
    if mode not in {"browser", "source", "browser-use"}:
        raise ValueError("mode must be 'browser', 'source', or 'browser-use'")

    # Ensure ground truth is generated
    print("Generating ground truth from BENCHMARK.md...")
    generate_bugs_json()
    print("  100 bugs parsed and saved\n")

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    f1_history: list[float] = []
    version = 0
    best_f1: float | None = None
    best_version = 0
    no_improvement_streak = 0

    for iteration in range(max_iterations):
        run_id = iteration + 1

        f1, gaps, run_result = await run_iteration(
            run_id,
            version,
            model,
            mode,
            app_url,
            agent_types,
        )
        f1_history.append(f1)

        if has_meaningful_improvement(f1, best_f1, min_improvement):
            previous_best = best_f1
            best_f1 = f1
            best_version = version
            no_improvement_streak = 0
            if previous_best is None:
                print(f"\n  Baseline best F1 set to {best_f1:.2f} (v{best_version})")
            else:
                print(
                    f"\n  New best F1: {best_f1:.2f} (v{best_version}, "
                    f"+{best_f1 - previous_best:.4f})"
                )
        else:
            no_improvement_streak += 1
            delta = f1 - best_f1
            print(
                f"\n  No meaningful improvement this run "
                f"(current {f1:.2f} vs best {best_f1:.2f}, "
                f"delta {delta:+.4f}, epsilon {min_improvement:.4f}) "
                f"[{no_improvement_streak}/{patience}]"
            )

        if no_improvement_streak >= patience:
            print(
                f"\n  Stopping after {no_improvement_streak} consecutive iterations "
                f"without improvement above {min_improvement:.4f}."
            )
            break

        # Optimize prompts for next iteration (skip on last iteration and browser-use mode)
        if iteration < max_iterations - 1 and mode != "browser-use":
            print(f"\nOptimizing prompts for v{version + 1}...")
            version = optimize_all_prompts(version, run_result, gaps)

    # Final summary
    print(f"\n{'='*60}")
    print(f"  TRAINING COMPLETE")
    print(f"{'='*60}")
    print(f"  Iterations: {len(f1_history)}")
    print(f"  F1 trajectory: {' -> '.join(f'{f:.2f}' for f in f1_history)}")
    print(f"  Best F1: {(best_f1 if best_f1 is not None else 0.0):.2f} (v{best_version})")
    print(f"  Results saved to: {RESULTS_DIR}")

    return best_version, best_f1 if best_f1 is not None else 0.0


def cli():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Auto-Research QA Agent Training")
    parser.add_argument("--iterations", type=int, default=MAX_ITERATIONS, help="Max iterations")
    parser.add_argument("--model", type=str, default=None, help="Override model for agent runs")
    parser.add_argument(
        "--mode",
        type=str,
        default=DEFAULT_RUN_MODE,
        choices=["browser", "source", "browser-use"],
        help="Execution mode: 'browser' (Playwright+Codex), 'source' (Codex only), 'browser-use' (autonomous browser-use agent)",
    )
    parser.add_argument(
        "--app-url",
        type=str,
        default=DEFAULT_APP_URL or None,
        help="Live app URL for browser/browser-use modes; if omitted, a local server is started when possible",
    )
    parser.add_argument("--single", type=str, default=None, help="Run only one agent type")
    parser.add_argument(
        "--min-improvement",
        type=float,
        default=MIN_F1_IMPROVEMENT,
        help="Minimum F1 improvement required to reset the no-improvement streak",
    )
    parser.add_argument(
        "--patience",
        type=int,
        default=NO_IMPROVEMENT_PATIENCE,
        help="Stop after this many consecutive iterations without meaningful F1 improvement",
    )
    parser.add_argument("--export", action="store_true", help="Export best prompts after training")
    args = parser.parse_args()

    agent_types = [args.single] if args.single else None

    best_version, best_f1 = asyncio.run(
        main(
            max_iterations=args.iterations,
            model=args.model,
            mode=args.mode,
            app_url=args.app_url,
            agent_types=agent_types,
            min_improvement=args.min_improvement,
            patience=args.patience,
        )
    )

    if args.export:
        print("\nExporting optimized Codex skills...")
        from auto_research.exports.export import export_all
        export_all(best_version)


if __name__ == "__main__":
    cli()

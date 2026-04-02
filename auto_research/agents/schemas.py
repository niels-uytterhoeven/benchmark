"""Pydantic models for agent findings and ground truth bugs."""

from pydantic import BaseModel


class Finding(BaseModel):
    """A single bug finding reported by a QA agent."""
    id: str
    severity: str
    category: str
    title: str
    description: str
    file: str
    function_or_section: str
    line_evidence: str
    impact: str
    reproduction: str


class AgentReport(BaseModel):
    """Complete report from one QA agent run."""
    agent_type: str
    findings: list[Finding]
    analysis_summary: str


class Bug(BaseModel):
    """A known bug from the benchmark ground truth."""
    id: str
    severity: str
    category: str
    issue: str
    location: str
    trigger: str
    expected_agents: list[str]
    matching_file: str
    matching_function: str
    matching_keywords: list[str]
    code_evidence: str = ""


class MatchResult(BaseModel):
    """Result of matching a finding to a known bug."""
    finding_id: str
    bug_id: str
    confidence: float
    reasoning: str = ""


class EvalResult(BaseModel):
    """Evaluation results for one agent run."""
    agent_type: str
    true_positives: list[MatchResult]
    false_positives: list[str]  # finding IDs with no match
    false_negatives: list[str]  # bug IDs with no match
    near_misses: list[MatchResult]
    precision: float
    recall: float
    f1: float


class RunResult(BaseModel):
    """Results for a complete iteration across all agents."""
    run_id: int
    agent_results: list[EvalResult]
    overall_precision: float
    overall_recall: float
    overall_f1: float

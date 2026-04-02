"""Parse BENCHMARK.md into structured bug records and extract code evidence."""

import json
import re
from pathlib import Path

from auto_research.agents.schemas import Bug
from auto_research.config import BENCHMARK_MD, BUGS_JSON, SOURCE_FILES


# Agent-to-bug mapping from BENCHMARK.md lines 177-182
AGENT_BUG_MAP = {
    "happy_path": [
        "BUG-036", "BUG-037", "BUG-038", "BUG-040", "BUG-044", "BUG-045",
        "BUG-047", "BUG-094", "BUG-095", "BUG-096", "BUG-097", "BUG-098",
        "BUG-100",
    ],
    "edge_case": [
        "BUG-001", "BUG-002", "BUG-003", "BUG-004", "BUG-005", "BUG-007",
        "BUG-008", "BUG-009", "BUG-011", "BUG-012", "BUG-013", "BUG-014",
        "BUG-015", "BUG-016", "BUG-017", "BUG-021", "BUG-022", "BUG-023",
        "BUG-025", "BUG-029", "BUG-032", "BUG-076", "BUG-077", "BUG-078",
    ],
    "accessibility": [
        "BUG-019", "BUG-030", "BUG-051", "BUG-052", "BUG-053", "BUG-054",
        "BUG-055", "BUG-056", "BUG-057", "BUG-058", "BUG-059", "BUG-060",
        "BUG-061", "BUG-062", "BUG-063", "BUG-064", "BUG-065",
    ],
    "error_recovery": [
        "BUG-024", "BUG-027", "BUG-031", "BUG-033", "BUG-034", "BUG-035",
        "BUG-040", "BUG-086", "BUG-088", "BUG-089", "BUG-092", "BUG-099",
    ],
    "viewport": [
        "BUG-041", "BUG-043", "BUG-046", "BUG-066", "BUG-067", "BUG-068",
        "BUG-069", "BUG-070", "BUG-071", "BUG-072", "BUG-073", "BUG-074",
        "BUG-075",
    ],
    "security": [
        "BUG-076", "BUG-077", "BUG-078", "BUG-079", "BUG-080", "BUG-081",
        "BUG-082", "BUG-083", "BUG-084", "BUG-085",
    ],
}


def _invert_agent_map() -> dict[str, list[str]]:
    """Return bug_id -> list of agent types that should find it."""
    result: dict[str, list[str]] = {}
    for agent, bugs in AGENT_BUG_MAP.items():
        for bug_id in bugs:
            result.setdefault(bug_id, []).append(agent)
    return result


def _extract_file_and_function(location: str) -> tuple[str, str]:
    """Extract file name and function from the Location column."""
    location = location.strip()

    # Extract file: look for known filenames
    file_map = {
        "store.js": "js/store.js",
        "app.js": "js/app.js",
        "render.js": "js/render.js",
        "data.js": "js/data.js",
        "style.css": "style.css",
        "index.html": "index.html",
    }
    matched_file = ""
    for short, full in file_map.items():
        if short in location:
            matched_file = full
            break

    # Extract function: look for backtick-wrapped text
    func_match = re.search(r'`([^`]+)`', location)
    matched_func = func_match.group(1) if func_match else ""

    return matched_file, matched_func


def _extract_keywords(issue: str, trigger: str) -> list[str]:
    """Extract matching keywords from issue description and trigger."""
    combined = f"{issue} {trigger}".lower()
    # Remove punctuation, split, deduplicate, filter short words
    words = re.findall(r'[a-z][a-z0-9_]+', combined)
    stopwords = {
        "the", "and", "for", "not", "with", "only", "from", "that", "this",
        "when", "into", "all", "any", "but", "has", "was", "are", "can",
        "its", "does", "without", "instead", "still", "shows", "using",
        "after", "before", "check", "checks", "checked",
    }
    return list(dict.fromkeys(w for w in words if w not in stopwords and len(w) > 2))


def _extract_code_evidence(bug_id: str, file_path: str) -> str:
    """Search source files for code evidence related to a bug."""
    for src_name, src_path in SOURCE_FILES.items():
        if not src_path.exists():
            continue
        content = src_path.read_text(encoding="utf-8", errors="replace")
        # Look for BUG-XXX comments and grab surrounding context
        pattern = rf'/\*.*?{re.escape(bug_id)}.*?\*/'
        match = re.search(pattern, content)
        if match:
            # Get the line after the comment (the actual buggy code)
            start = match.end()
            next_lines = content[start:start + 200].strip().split('\n')
            if next_lines:
                return next_lines[0].strip()
    return ""


def parse_benchmark() -> list[Bug]:
    """Parse BENCHMARK.md and return structured bug records."""
    content = BENCHMARK_MD.read_text(encoding="utf-8")
    bug_to_agents = _invert_agent_map()

    bugs: list[Bug] = []

    # Match table rows: | BUG-XXX | severity | category | issue | location | trigger |
    row_pattern = re.compile(
        r'^\|\s*(BUG-\d{3})\s*\|\s*(\w+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|',
        re.MULTILINE,
    )

    for m in row_pattern.finditer(content):
        bug_id = m.group(1).strip()
        severity = m.group(2).strip()
        category = m.group(3).strip()
        issue = m.group(4).strip()
        location = m.group(5).strip()
        trigger = m.group(6).strip()

        matched_file, matched_func = _extract_file_and_function(location)
        keywords = _extract_keywords(issue, trigger)
        code_evidence = _extract_code_evidence(bug_id, matched_file)

        bugs.append(Bug(
            id=bug_id,
            severity=severity,
            category=category,
            issue=issue,
            location=location,
            trigger=trigger,
            expected_agents=bug_to_agents.get(bug_id, []),
            matching_file=matched_file,
            matching_function=matched_func,
            matching_keywords=keywords,
            code_evidence=code_evidence,
        ))

    return bugs


def generate_bugs_json() -> Path:
    """Parse benchmark and write bugs.json."""
    bugs = parse_benchmark()
    BUGS_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(BUGS_JSON, "w", encoding="utf-8") as f:
        json.dump([b.model_dump() for b in bugs], f, indent=2)
    return BUGS_JSON


if __name__ == "__main__":
    path = generate_bugs_json()
    print(f"Generated {path} with {len(json.loads(path.read_text()))} bugs")

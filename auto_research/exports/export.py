"""Export optimized prompts as portable Codex skills."""

from pathlib import Path

from auto_research.config import EXPORTS_DIR, PROMPTS_DIR, SKILL_TYPES


# Mapping of skill types to human-readable names and descriptions
SKILL_META = {
    "happy_path": {
        "name": "qa-happy-path",
        "display": "Happy Path QA",
        "description": "Analyze web application source code for visual bugs, broken links, display errors, and stale visible data during normal usage. Use when Codex needs a focused happy-path QA pass on a web application.",
    },
    "edge_case": {
        "name": "qa-edge-case",
        "display": "Edge Case QA",
        "description": "Analyze web application source code for validation gaps, race conditions, destructive actions, and adversarial input handling bugs. Use when Codex needs an edge-case or abuse-case QA pass.",
    },
    "accessibility": {
        "name": "qa-accessibility",
        "display": "Accessibility Audit",
        "description": "Audit web application source code against WCAG 2.1 AA criteria including labels, ARIA, keyboard navigation, focus management, and screen reader support. Use when Codex needs an accessibility-focused QA pass.",
    },
    "error_recovery": {
        "name": "qa-error-recovery",
        "display": "Error Recovery QA",
        "description": "Analyze web application source code for error handling gaps, stale state issues, session problems, and recovery flow defects. Use when Codex needs an error-path and state-lifecycle QA pass.",
    },
    "viewport": {
        "name": "qa-viewport",
        "display": "Responsive/Viewport QA",
        "description": "Audit web application CSS and markup for responsive design issues, touch target sizing, print gaps, and viewport overflow problems. Use when Codex needs a responsive-layout QA pass.",
    },
    "security": {
        "name": "qa-security",
        "display": "Security Audit",
        "description": "Perform a white-box security audit of web application source code for XSS, sensitive data exposure, upload flaws, and auth/session weaknesses. Use when Codex needs a security-focused QA pass.",
    },
    "reviewer": {
        "name": "qa-reviewer",
        "display": "QA Reviewer",
        "description": "Review specialist QA findings, merge duplicates, challenge weak evidence, and surface high-confidence missed issues across specialists. Use when Codex needs a senior reviewer after specialist QA passes.",
    },
}


def _resolve_prompt_path(skill_type: str, version: int) -> Path:
    """Resolve a prompt path, falling back to v0 for reviewer or legacy exports."""
    candidates = [
        PROMPTS_DIR / f"v{version}" / f"{skill_type}.md",
        PROMPTS_DIR / "v0" / f"{skill_type}.md",
    ]
    for prompt_path in candidates:
        if prompt_path.exists():
            return prompt_path
    raise FileNotFoundError(f"No prompt found for {skill_type} in v{version} or v0")


def export_prompt(skill_type: str, version: int) -> Path:
    """Export a single prompt as a reference markdown file."""
    meta = SKILL_META[skill_type]
    prompt_path = _resolve_prompt_path(skill_type, version)
    prompt_content = prompt_path.read_text(encoding="utf-8")

    output_dir = EXPORTS_DIR / "prompts"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{meta['name']}.md"
    output_path.write_text(prompt_content, encoding="utf-8")
    return output_path


def export_skill(skill_type: str, version: int) -> Path:
    """Export a single prompt as a Codex skill folder."""
    meta = SKILL_META[skill_type]
    prompt_path = _resolve_prompt_path(skill_type, version)
    prompt_content = prompt_path.read_text(encoding="utf-8")

    skill_md = f"""---
name: {meta['name']}
description: "{meta['description']}"
---

{prompt_content}
"""

    output_dir = EXPORTS_DIR / "skills" / meta["name"]
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "SKILL.md"
    output_path.write_text(skill_md, encoding="utf-8")
    return output_path


def export_all(version: int) -> dict[str, list[Path]]:
    """Export all prompts and skills for the given prompt version."""
    prompts = []
    skills = []

    for skill_type in SKILL_TYPES:
        try:
            prompt_path = _resolve_prompt_path(skill_type, version)
        except FileNotFoundError:
            print(f"  Warning: no prompt for {skill_type}, skipping")
            continue

        prompt_path = export_prompt(skill_type, version)
        skill_path = export_skill(skill_type, version)
        prompts.append(prompt_path)
        skills.append(skill_path)
        print(f"  Exported {skill_type}: {prompt_path.name}, {skill_path.parent.name}/SKILL.md")

    # Generate a README for the exports
    readme = _generate_export_readme(version)
    readme_path = EXPORTS_DIR / "README.md"
    readme_path.write_text(readme, encoding="utf-8")

    return {"prompts": prompts, "skills": skills}


def _generate_export_readme(version: int) -> str:
    """Generate a README explaining how to use the exported prompts/skills."""
    skill_list = "\n".join(
        f"- `{meta['name']}.md` - {meta['display']}: {meta['description']}"
        for meta in SKILL_META.values()
    )

    return f"""# QA Skills For Codex (Optimized v{version})

These QA skills were trained using the auto-research pipeline
against a benchmark web application with 100 known bugs. They are designed
to be **generalizable** - they work on any web application, not just the
training benchmark.

## Use With Codex

Copy each folder from `skills/` into your Codex skills directory:
```
cp -r skills/qa-edge-case ~/.codex/skills/
```

Codex can auto-trigger the skill from its frontmatter description, or you can
explicitly mention it in your prompt.

Examples:
```
Use qa-edge-case to audit this frontend for validation bugs and XSS.
Use qa-reviewer after the specialist QA passes and consolidate overlaps.
```

The raw specialist prompt markdown is also exported under `prompts/` for direct
Codex CLI runs or further customization.

## Available Skills

{skill_list}

## Recommended Workflow

1. Run **qa-happy-path** first for a broad surface-level scan
2. Run **qa-edge-case** for input validation and form handling
3. Run **qa-security** for vulnerability assessment
4. Run **qa-accessibility** for WCAG compliance
5. Run **qa-viewport** for responsive design audit
6. Run **qa-error-recovery** for error handling and state management
7. Run **qa-reviewer** last to merge duplicates, challenge weak evidence, and propose high-confidence follow-up gaps

## Training Metrics

See `../results/summary.json` for the full training trajectory.
"""

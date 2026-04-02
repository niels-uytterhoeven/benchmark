# QA Skills For Codex (Optimized v0)

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

- `qa-happy-path.md` - Happy Path QA: Analyze web application source code for visual bugs, broken links, display errors, and stale visible data during normal usage. Use when Codex needs a focused happy-path QA pass on a web application.
- `qa-edge-case.md` - Edge Case QA: Analyze web application source code for validation gaps, race conditions, destructive actions, and adversarial input handling bugs. Use when Codex needs an edge-case or abuse-case QA pass.
- `qa-accessibility.md` - Accessibility Audit: Audit web application source code against WCAG 2.1 AA criteria including labels, ARIA, keyboard navigation, focus management, and screen reader support. Use when Codex needs an accessibility-focused QA pass.
- `qa-error-recovery.md` - Error Recovery QA: Analyze web application source code for error handling gaps, stale state issues, session problems, and recovery flow defects. Use when Codex needs an error-path and state-lifecycle QA pass.
- `qa-viewport.md` - Responsive/Viewport QA: Audit web application CSS and markup for responsive design issues, touch target sizing, print gaps, and viewport overflow problems. Use when Codex needs a responsive-layout QA pass.
- `qa-security.md` - Security Audit: Perform a white-box security audit of web application source code for XSS, sensitive data exposure, upload flaws, and auth/session weaknesses. Use when Codex needs a security-focused QA pass.
- `qa-reviewer.md` - QA Reviewer: Review specialist QA findings, merge duplicates, challenge weak evidence, and surface high-confidence missed issues across specialists. Use when Codex needs a senior reviewer after specialist QA passes.

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

# AIBIS Codex Review Protocol

## Codex Role

The Codex is a **reviewer**, not the primary implementer by default.

## Codex Responsibilities

1. **Architecture audit** — Review planned changes against existing codebase structure
2. **Active component tracing** — Map which components, services, and types are affected
3. **Security review** — Check for auth bypass, data exposure, unsafe patterns
4. **QA check reconciliation** — Verify that QA checks match the actual changes made
5. **Browser visual QA automation** — Take screenshots, check for visual regressions
6. **PR/diff review** — Review the diff before commit

## When Codex Modifies Source

Codex may modify source only when:

- Explicitly assigned to a fix task by the Execution Agent
- The fix is a direct, minimal correction (1-5 lines)
- The fix does not change the milestone's scope
- The fix is documented in the milestone report

## Review Triggers

Codex review is triggered when:

- A milestone involves 3+ files changing in app source
- A milestone creates new routes or components
- A milestone touches auth, data flow, or storage
- A milestone completes and is ready for commit
- A FIX_TASK.md is created

## Review Output

Codex review produces a brief section in the milestone report or PASS.md:

```
## Codex Review
- Architecture: OK / <notes>
- Security: OK / <notes>
- Component tracing: OK / <notes>
- Visual QA: OK / <notes>
- Overall: APPROVED / CHANGES_REQUESTED
```

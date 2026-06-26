# AIBIS Status Protocol

## Runtime File Locations

| File | Path |
|---|---|
| PASS | `AGENT_FACTORY/runtime/PASS.md` — created on milestone pass |
| FIX_TASK | `AGENT_FACTORY/runtime/FIX_TASK.md` — created on fixable failure |
| BLOCKED | `AGENT_FACTORY/runtime/BLOCKED.md` — created on blocker |
| REPORT | `AGENT_FACTORY/runtime/REPORT.md` — created per milestone |
| STATUS | `AGENT_FACTORY/runtime/STATUS.md` — updated on status change |

Templates (reference only, not authoritative runtime state):
`AGENT_FACTORY/templates/PASS_TEMPLATE.md` etc.

Root-level `AGENT_FACTORY/PASS.md`, `AGENT_FACTORY/FIX_TASK.md` etc. must NOT exist.
They are stale artifacts if present at root level.

## PASS.md Format

```markdown
# PASS

## Milestone
<milestone-id> — <milestone-title>

## Changed Files
- path/to/file.ext — <description of change>

## Checks Run
- [x] npm run build — <result>
- [x] npm run test — <result> (if applicable)
- [x] Safety scripts — <result>
- [x] Milestone-specific checks — <result>

## Visual QA
Screenshots saved to: docs/visual-qa/<milestone>/
- <viewport>-<page>.png — <status>
- <viewport>-<page>.png — <status>

## Evidence
- Build output excerpt
- Safety script output excerpt
- Grep results confirming no forbidden patterns
- File diff summary confirming no forbidden files

## Safety Confirmation
- [ ] Supabase writes still disabled
- [ ] No .env files changed
- [ ] No real client data added
- [ ] No public routes created
- [ ] No guaranteed claims introduced

## Risks
- <any risks or open questions>

## Next Milestone
<next-milestone-id> — <next-milestone-title>
```

## FIX_TASK.md Format

```markdown
# FIX_TASK

## Milestone
<milestone-id> — <milestone-title>

## Failure Type
<build_error | typescript_error | ui_regression | visual_qa_failure | safety_check_failure | check_failure>

## Exact Issues
1. <issue>
2. <issue>

## Files Likely Involved
- path/to/file.ext

## Required Fix
<specific instructions for what to fix>

## Checks To Re-run
- npm run build
- <other checks>

## Scope Limits
<what should not be changed during the fix>
```

## BLOCKED.md Format

```markdown
# BLOCKED

## Milestone
<milestone-id> — <milestone-title>

## Blocker Type
<build_failure | visual_qa_failure | scope_creep | security | approval_required | max_attempts_reached | direction_change | unknown>

## Why Blocked
<clear explanation of what is blocked and why>

## What Was Tried
1. <attempt>
2. <attempt>
3. <attempt>

## Required Human Decision
<exact question the human needs to answer>

## Files Touched
- path/to/file.ext

## Safety Impact
<is the app in a safe state? can it build? are there security concerns?>
```

## REPORT.md Format

```markdown
# Milestone Report — <milestone-id>

## Summary
<1-2 paragraph summary>

## Deliverables
- <deliverable>
- <deliverable>

## Files Changed
- path/to/file.ext

## QA Results
| Check | Result |
|---|---|
| Build | PASS/FAIL |
| Test | PASS/FAIL/NA |
| Safety | PASS/FAIL |
| Visual | PASS/FAIL/NA |

## Status
PASS | FIX_TASK | BLOCKED

## Duration
<start time> → <end time>
```

## STATUS.md Format

```markdown
# AIBIS Agent Status

## Current Phase
<phase name>

## Current Milestone
<milestone-id> — <milestone-title> — <status>

## Last Completed
<milestone-id> — <milestone-title>

## Next
<next-milestone-id> — <next-milestone-title>

## Overall Progress
<n> / <total> milestones complete

## Safety Status
- Supabase writes: DISABLED
- Production: UNTOUCHED
- Real data: NONE
- Forbidden files: CLEAN
```

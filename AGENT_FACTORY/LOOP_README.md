# AIBIS Agent Loop — README

## Overview

The Agent Loop is a controlled autonomous execution system for AIBIS milestones. It runs milestones one at a time, verifies each one with checks and evidence, and only advances when a milestone passes.

## How to Run

### Run Current Milestone

```powershell
.\run-current-milestone.ps1
```

This will:
1. Clear old status files
2. Call OpenCode with the current milestone from CURRENT_MILESTONE.md
3. Run baseline checks (build, safety scripts)
4. Create PASS.md, FIX_TASK.md, or BLOCKED.md

### Run the Full Loop

```powershell
.\run-aibis-loop.ps1
```

This will:
1. Loop over milestones up to MaxMilestones (default 20)
2. Run each milestone via OpenCode
3. Handle FIX_TASK with up to MaxFixAttempts (default 3) retries
4. Handle BLOCKED by stopping
5. Handle PASS by verifying evidence and advancing
6. Commit only if checks pass
7. Stop at MANUAL_APPROVAL_REQUIRED milestones
8. Log all runs to `logs/`

### Advance Milestone Manually

```powershell
.\advance-milestone.ps1
```

This marks the current milestone DONE and sets the next TODO milestone as current.

## PASS / FIX_TASK / BLOCKED Cycle

### PASS
- All checks passed
- Evidence exists
- Milestone is complete
- Loop advances to next milestone

### FIX_TASK
- Some checks failed
- The issue is fixable
- Loop retries up to 3 times
- Each retry passes the FIX_TASK details to OpenCode

### BLOCKED
- Cannot proceed
- Human decision required
- Loop stops
- No further milestones executed

## How to Stop

- The loop stops automatically on BLOCKED
- Press Ctrl+C to interrupt at any time
- The loop does not auto-push without successful checks

## How to Resume

1. If BLOCKED: resolve the blocker, delete BLOCKED.md, re-run `.\run-current-milestone.ps1`
2. If PASS but not committed: verify evidence, commit manually, then run `.\advance-milestone.ps1`
3. If interrupted mid-milestone: re-run `.\run-current-milestone.ps1` to continue

## Runtime File Paths

Status files are always written to and read from `AGENT_FACTORY/runtime/`:

| File | Path | Purpose |
|---|---|---|
| `PASS.md` | `runtime/PASS.md` | Milestone passed |
| `FIX_TASK.md` | `runtime/FIX_TASK.md` | Fixable failure |
| `BLOCKED.md` | `runtime/BLOCKED.md` | Cannot proceed |
| `STATUS.md` | `runtime/STATUS.md` | Current agent status |

Templates (reference only, not runtime) are in `AGENT_FACTORY/templates/`.
Root-level `AGENT_FACTORY/PASS.md` etc. must NOT exist — they are stale artifacts.

## Safety Notes

- The loop never modifies `.env`, Supabase, production, or real data
- The loop never auto-advances past MANUAL_APPROVAL_REQUIRED milestones
- The loop never commits with failing checks
- If unsure, the loop stops and writes BLOCKED.md

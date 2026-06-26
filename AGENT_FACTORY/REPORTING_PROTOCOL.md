# AIBIS Reporting Protocol

## Mandatory Documents Per Milestone

Every milestone must produce the following documents:

| Document | Required? | Timing |
|---|---|---|
| Milestone plan doc | If milestone changes code/UI | Before execution |
| QA doc | If milestone changes UI | After visual QA |
| Check script | If milestone introduces new functionality | After execution |
| Lock doc | ✅ Always | After PASS |
| Final report summary | ✅ Always | After PASS |

## Lock Document Requirements

File: `docs/MILESTONE_<ID>_<NAME>_LOCK.md`

Must include:

- Milestone summary
- Files changed
- Checks run and results
- Visual QA results (if applicable)
- Safety confirmation
- Any open questions or risks

## Status File Updates

After each milestone:

1. Update `AGENT_FACTORY/STATUS.md` with current status
2. Archive PASS/FIX_TASK/BLOCKED to `logs/` with timestamp
3. Clear working status files from AGENT_FACTORY root

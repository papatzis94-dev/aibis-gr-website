# AIBIS Agent Factory

Autonomous milestone execution system for the AIBIS admin CRM + diagnostic/audit pipeline.

## Structure

```
AGENT_FACTORY/
├── MASTERPLAN.md                 # Full mission, rules, and phase definition
├── CURRENT_MILESTONE.md          # Active milestone (single source of truth)
├── MILESTONES.md                 # Full milestone sequence with statuses
├── AGENT_RULES.md                # Execution rules for OpenCode
├── VISUAL_QA_STANDARD.md         # Premium visual QA criteria
├── ERROR_PROTOCOL.md             # Error handling procedures
├── STATUS_PROTOCOL.md            # PASS/FIX_TASK/BLOCKED format definitions
├── STOP_CONDITIONS.md            # Conditions that halt execution
├── REPORTING_PROTOCOL.md         # Required documentation per milestone
├── CODEX_REVIEW_PROTOCOL.md      # Codex reviewer role and triggers
├── LOOP_README.md                # How to run the loop
├── POST_LOOP_*.md                # Post-loop audit documents
├── run-aibis-loop.ps1            # Full autonomous loop
├── run-current-milestone.ps1     # Run single milestone
├── advance-milestone.ps1         # Advance to next milestone
├── README.md                     # This file
├── templates/                    # Reference templates (not authoritative)
│   ├── PASS_TEMPLATE.md
│   ├── FIX_TASK_TEMPLATE.md
│   ├── BLOCKED_TEMPLATE.md
│   ├── REPORT_TEMPLATE.md
│   └── STATUS_TEMPLATE.md
├── runtime/                      # Active runtime output files
│   ├── PASS.md                   # Created on milestone pass
│   ├── FIX_TASK.md               # Created on fixable failure
│   ├── BLOCKED.md                # Created on blocker
│   ├── REPORT.md                 # Created per milestone
│   └── STATUS.md                 # Current agent status
└── logs/                         # Run logs and archived status files
```

## Runtime vs Root Files

- **Root-level** `PASS.md`, `FIX_TASK.md`, `BLOCKED.md`, `REPORT.md`, `STATUS.md` must NOT exist at root.
- **Active runtime files** live in `AGENT_FACTORY/runtime/`.
- **Templates** (reference format) live in `AGENT_FACTORY/templates/`.
- Scripts always read/write from `runtime/`.

## First Automation Phase

**AIBIS CRM + Diagnostic/Audit Pipeline Phase**

Starting milestone: `12A.1B — CRM Schema Alignment Review`

## Run Commands

```powershell
.\run-current-milestone.ps1     # Execute current milestone
.\run-aibis-loop.ps1            # Run full autonomous loop
.\advance-milestone.ps1         # Manually advance milestone
```

See `LOOP_README.md` for detailed instructions.

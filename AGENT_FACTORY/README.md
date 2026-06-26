# AIBIS Agent Factory

Autonomous milestone execution system for the AIBIS admin CRM + diagnostic/audit pipeline.

## Structure

```
AGENT_FACTORY/
├── MASTERPLAN.md              # Full mission, rules, and phase definition
├── CURRENT_MILESTONE.md       # Active milestone (single source of truth)
├── MILESTONES.md              # Full milestone sequence with statuses
├── AGENT_RULES.md             # Execution rules for OpenCode
├── VISUAL_QA_STANDARD.md      # Premium visual QA criteria
├── ERROR_PROTOCOL.md          # Error handling procedures
├── STATUS_PROTOCOL.md         # PASS/FIX_TASK/BLOCKED format definitions
├── STOP_CONDITIONS.md         # Conditions that halt execution
├── REPORTING_PROTOCOL.md      # Required documentation per milestone
├── CODEX_REVIEW_PROTOCOL.md   # Codex reviewer role and triggers
├── LOOP_README.md             # How to run the loop
├── run-aibis-loop.ps1         # Full autonomous loop
├── run-current-milestone.ps1  # Run single milestone
├── advance-milestone.ps1      # Advance to next milestone
├── README.md                  # This file
├── PASS.md                    # Generated on milestone pass
├── FIX_TASK.md                # Generated on fixable failure
├── BLOCKED.md                 # Generated on blocker
├── REPORT.md                  # Generated milestone report
├── STATUS.md                  # Current agent status
└── logs/                      # Run logs and archived status files
```

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

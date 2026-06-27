# CRM RLS Plan QA — 12B.2

## Files Created

| Category | Files |
|---|---|
| RLS Plan | `AGENT_FACTORY/CRM_RLS_PLAN_12B2.md` |
| RLS SQL Drafts (8) | `docs/sql-drafts/12B2-crm-rls-plan/` — README, 001–005, ROLLBACK, CHECKLIST |
| Sandbox Runbook | `AGENT_FACTORY/SANDBOX_MIGRATION_RUNBOOK_12B3A.md` |
| Verification Plan | `AGENT_FACTORY/SANDBOX_RLS_VERIFICATION_PLAN_12B3B.md` |
| Safety Script | `scripts/crm-rls-plan-safety-check-12b2.mjs` |
| Expected Result Explanation | `AGENT_FACTORY/SQL_DRAFT_SAFETY_EXPECTED_RESULT_EXPLANATION_12B2.md` |

## RLS Plan Summary

- 12 tables covered with admin-only access model
- Current `aibis_admin` role used via `current_aibis_role()` function
- No anonymous or public access
- No client visibility in v1
- Future visibility model documented but not implemented

## Runbook Summary

- 10-step execution plan for sandbox migration
- Requires `APPROVE_12B_SANDBOX_MIGRATION_EXECUTION` before execution
- Includes backup, verification, failure stop, and rollback steps

## Verification Plan Summary

- 3 test roles: admin, non-admin, anonymous
- 24 test cases across all CRUD boundaries
- Expected PASS/FAIL matrix
- Blocker conditions documented

## Safety Checks

| Check | Result |
|---|---|
| SQL executed | **NO** |
| Supabase touched | **NO** |
| Env changed | **NO** |
| Real data used | **NO** |
| Writes enabled | **NO** |
| RLS executed | **NO** (draft only) |
| Anonymous access allowed | **NO** |
| Service_role used | **NO** |

## Next Gate

Requires `APPROVE_12B_SANDBOX_MIGRATION_EXECUTION` before any sandbox execution.

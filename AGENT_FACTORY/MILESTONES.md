# AIBIS Milestone Sequence

## Phase: Admin CRM + Diagnostic/Audit Pipeline

| # | Milestone | Status | Notes |
|---|---|---|---|
| 1 | 12A.1B — CRM Schema Alignment Review | **DONE** | PASS — evidence in runtime/PASS.md and POST_LOOP_MILESTONE_RECONCILIATION |
| 2 | 12A.2 — CRM Data Contract & Adapter Boundary | **DONE** | PASS — `docs/ADMIN_CRM_DATA_CONTRACT_12A2.md` |
| 3 | 12A.3 — Supabase Migration Draft | **DONE** | PASS — SAFE_DOC_ONLY, no SQL executed, `docs/ADMIN_CRM_SUPABASE_MIGRATION_DRAFT_12A3.md` |
| 4 | 12A.4 — Static CRM UI Prototype | **DONE** | PASS — AdminCrm.tsx, crmMockData.ts, route added |
| 5 | 12A.5 — Premium Visual QA Pass | **DONE** | PASS — screenshots at 3 viewports, QA report |
| 6 | **12A.5A — Milestone State Sync + CRM Mobile Overflow Micro-Fix** | **DONE** | PASS — state synced, 375px overflow fixed, 18/18 check script |
| 7 | **12A.6 — Diagnostic Intake Link** | **IN_PROGRESS** | CURRENT — CRM candidate prefills Diagnostic Lab, no external send |
| 8 | 12A.7 — Audit Report Pipeline Link | TODO | Diagnostic state links to report preview/export, no publish |
| 9 | 12A.8 — CRM + Audit Pipeline QA Lock | TODO | Full technical + visual QA, all checks pass, lock doc |

## Phase: Supabase Migration (Manual Approval Required)

| # | Milestone | Status | Pass Criteria | Notes |
|---|---|---|---|---|
| 10 | 12B.1 — Supabase CRM Migration Draft | MANUAL_APPROVAL_REQUIRED | SQL draft only, no execution, no Supabase writes | Requires: `APPROVE_12B_SQL_DRAFT_ONLY` |
| 11 | 12B.2 — CRM RLS Plan | MANUAL_APPROVAL_REQUIRED | RLS plan document only, no execution | Requires: `APPROVE_12B_RLS_SANDBOX_TEST` |
| 12 | 12B.3 — Controlled Sandbox Migration Gate | MANUAL_APPROVAL_REQUIRED | Sandbox migration only, requires explicit approval | Requires: `APPROVE_12B_SANDBOX_MIGRATION` |

## Manual Approval Phrases

| Phrase | Grants Permission To |
|---|---|
| `APPROVE_12B_SQL_DRAFT_ONLY` | Draft SQL migration files (no execution) |
| `APPROVE_12B_SANDBOX_MIGRATION` | Run migration against Supabase sandbox only |
| `APPROVE_12B_RLS_SANDBOX_TEST` | Test RLS policies in sandbox |
| `APPROVE_REAL_CLIENT_DATA_INTAKE` | Create records for real (non-demo) businesses |
| `APPROVE_PRODUCTION_READONLY_ACTIVATION` | Enable production read-only mode |

# AIBIS Milestone Sequence

## Phase: Admin CRM + Diagnostic/Audit Pipeline

| # | Milestone | Status | Pass Criteria | Notes |
|---|---|---|---|---|
| 1 | 12A.1B — CRM Schema Alignment Review | **TODO** | Schema doc reviewed, naming decisions documented, no source changes | Document-only review |
| 2 | 12A.2 — CRM Data Contract | TODO | TypeScript data contracts defined for CRM entities, no UI, no DB | Data layer only |
| 3 | 12A.3 — Admin CRM Static UI Skeleton | TODO | Admin CRM pages exist with mock data, navigable, no real data | UI skeleton |
| 4 | 12A.4 — Admin CRM Premium Visual Pass | TODO | Visual QA passed, screenshots saved, premium standard met | Visual polish |
| 5 | 12A.5 — CRM Local Store + Manual Workflow | TODO | localStorage CRUD for leads, contacts, outreach, tasks, notes | Local storage |
| 6 | 12A.6 — Diagnostic Intake Link | TODO | CRM candidate prefills Diagnostic Lab, no external send | Pipeline connect |
| 7 | 12A.7 — Audit Report Pipeline Link | TODO | Diagnostic state links to report preview/export, no publish | Pipeline connect |
| 8 | 12A.8 — CRM + Audit Pipeline QA Lock | TODO | Full technical + visual QA, all checks pass, lock doc | Final lock |

## Phase: Supabase Migration (Manual Approval Required)

| # | Milestone | Status | Pass Criteria | Notes |
|---|---|---|---|---|
| 9 | 12B.1 — Supabase CRM Migration Draft | MANUAL_APPROVAL_REQUIRED | SQL draft only, no execution, no Supabase writes | Requires: `APPROVE_12B_SQL_DRAFT_ONLY` |
| 10 | 12B.2 — CRM RLS Plan | MANUAL_APPROVAL_REQUIRED | RLS plan document only, no execution | Requires: `APPROVE_12B_RLS_SANDBOX_TEST` |
| 11 | 12B.3 — Controlled Sandbox Migration Gate | MANUAL_APPROVAL_REQUIRED | Sandbox migration only, requires explicit approval | Requires: `APPROVE_12B_SANDBOX_MIGRATION` |

## Manual Approval Phrases

| Phrase | Grants Permission To |
|---|---|
| `APPROVE_12B_SQL_DRAFT_ONLY` | Draft SQL migration files (no execution) |
| `APPROVE_12B_SANDBOX_MIGRATION` | Run migration against Supabase sandbox only |
| `APPROVE_12B_RLS_SANDBOX_TEST` | Test RLS policies in sandbox |
| `APPROVE_REAL_CLIENT_DATA_INTAKE` | Create records for real (non-demo) businesses |
| `APPROVE_PRODUCTION_READONLY_ACTIVATION` | Enable production read-only mode |

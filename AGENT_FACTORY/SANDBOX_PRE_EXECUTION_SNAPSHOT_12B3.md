# Sandbox Pre-Execution Snapshot — 12B.3

**Timestamp:** 2026-06-27
**Approval:** `APPROVE_12B_SANDBOX_MIGRATION_EXECUTION`

## State

| Item | Status |
|---|---|
| Branch (project root) | `master` — clean |
| Branch (app repo) | `codex/10l7-qa-reconciliation` — clean |
| Current milestone | 12B.3 — Controlled Sandbox Migration Execution |
| Project ref | `fzpukpmopxvfekxvcdka` |
| Sandbox confirmed | YES |

## SQL Files to Execute

**Schema + Tables (12B.1):**
1. `docs/sql-drafts/12B1-crm-migration-draft/001_crm_schema_draft.sql`
2. `docs/sql-drafts/12B1-crm-migration-draft/002_crm_indexes_constraints_draft.sql`
3. `docs/sql-drafts/12B1-crm-migration-draft/004_crm_seed_reference_data_draft.sql`

**RLS (12B.2):**
4. `docs/sql-drafts/12B2-crm-rls-plan/001_enable_rls_draft.sql`
5. `docs/sql-drafts/12B2-crm-rls-plan/002_admin_read_policies_draft.sql`
6. `docs/sql-drafts/12B2-crm-rls-plan/003_admin_write_policies_draft.sql`

## SQL Files NOT to Execute

- `003_crm_rls_placeholder_draft.sql` (superseded by 12B.2 RLS drafts)
- `004_no_anonymous_access_notes.sql` (documentation only, not executable)
- `ROLLBACK_DRAFT.sql` (only if failure occurs)
- `ROLLBACK_RLS_DRAFT.sql` (only if failure occurs)

## Expected Tables After Execution

| Schema | Table | Expected |
|---|---|---|
| crm | business_verticals | ✓ |
| crm | lead_sources | ✓ |
| crm | businesses | ✓ |
| crm | contacts | ✓ |
| crm | leads | ✓ |
| crm | outreach_events | ✓ |
| crm | follow_up_tasks | ✓ |
| crm | notes | ✓ |
| crm | diagnostics | ✓ |
| crm | diagnostic_inputs | ✓ |
| crm | audit_reports | ✓ |
| crm | report_files | ✓ |
| crm | recommendations | ❌ deferred |
| crm | automation_alerts | ❌ deferred |

## Expected Seed Data

- `crm.business_verticals`: 4 rows (accommodation, restaurant-cafe, beauty-local, other)
- `crm.lead_sources`: 4 rows (manual, research, form, referral)
- All other tables: 0 rows (no real data)

## Rollback Location

`docs/sql-drafts/12B1-crm-migration-draft/ROLLBACK_DRAFT.sql`
`docs/sql-drafts/12B2-crm-rls-plan/ROLLBACK_RLS_DRAFT.sql`

## Stop Conditions

- Project ref does not match → STOP
- SQL syntax error → STOP, run rollback
- FK violation → STOP, run rollback
- Unexpected rows after seed → STOP

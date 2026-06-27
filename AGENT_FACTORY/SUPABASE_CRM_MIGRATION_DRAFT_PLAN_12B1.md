# Supabase CRM Migration Draft Plan — 12B.1

## Approval Phrase Received
`APPROVE_12B_SQL_DRAFT_ONLY` — confirmed 2026-06-27

## Scope
**Draft only.** No SQL executed. No Supabase touched. No env changed. No writes enabled.

## Files Created

All under `docs/sql-drafts/12B1-crm-migration-draft/`:

| File | Purpose |
|---|---|
| `README.md` | Overview, file order, tables included/deferred |
| `001_crm_schema_draft.sql` | Schema + 12 core tables with triggers |
| `002_crm_indexes_constraints_draft.sql` | Performance indexes |
| `003_crm_rls_placeholder_draft.sql` | RLS intent only — not executable |
| `004_crm_seed_reference_data_draft.sql` | Reference data (verticals, lead sources) |
| `ROLLBACK_DRAFT.sql` | Complete rollback |
| `MIGRATION_REVIEW_CHECKLIST.md` | Pre-execution checklist |

## Tables Included (12)

1. `crm.business_verticals` (reference)
2. `crm.lead_sources` (reference)
3. `crm.businesses` (core)
4. `crm.contacts` (core)
5. `crm.leads` (core)
6. `crm.outreach_events` (core)
7. `crm.follow_up_tasks` (core)
8. `crm.notes` (core, polymorphic)
9. `crm.diagnostics` (audit)
10. `crm.diagnostic_inputs` (audit)
11. `crm.audit_reports` (audit)
12. `crm.report_files` (audit)

## Tables Deferred

| Table | Reason |
|---|---|
| `crm.recommendations` | Future feature — schema-ready only |
| `crm.automation_alerts` | Future feature — schema-ready only |

## Risk Notes

- `assigned_to` and `approved_by` columns exist as UUID without hard FK to `auth.users`. This is intentionally deferred until auth integration is stable. If this causes issues later, a FK migration will be needed.
- `data_source` CHECK constraint intentionally excludes `'automated'` — it is reserved for future explicit approval.
- RLS is placeholder-only. Actual RLS design requires 12B.2.
- The `crm` schema is isolated from `public` — existing client-facing tables are unaffected.

## Required Owner Decisions Before Execution

1. [ ] Confirm the `current_aibis_role()` function exists or will be created
2. [ ] Confirm the `aibis_admin` role value
3. [ ] Provide `APPROVE_12B_SANDBOX_MIGRATION` phrase for sandbox execution

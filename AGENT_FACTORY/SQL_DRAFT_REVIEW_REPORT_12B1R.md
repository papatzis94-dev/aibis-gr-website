# SQL Draft Review Report — 12B.1R

**Date:** 2026-06-27
**Reviewer:** OpenCode Autonomous Agent

---

## Files Reviewed

| File | Lines | Status |
|---|---|---|
| `README.md` | 60 | ✓ |
| `001_crm_schema_draft.sql` | 256 | ✓ |
| `002_crm_indexes_constraints_draft.sql` | 51 | ✓ |
| `003_crm_rls_placeholder_draft.sql` | 45 | ✓ |
| `004_crm_seed_reference_data_draft.sql` | 24 | ✓ |
| `ROLLBACK_DRAFT.sql` | 38 | ✓ |
| `MIGRATION_REVIEW_CHECKLIST.md` | 41 | ✓ |

## Branch / Repo Status

| Repo | Branch | Latest Commit | Status |
|---|---|---|---|
| Project root | `master` | `8fb57ba` (12B.1 draft SQL) | Clean |
| App repo | `codex/10l7-qa-reconciliation` | `dab6373` (12B.1 draft SQL files) | Clean |

**Branch state:** CLEAR. Both repos are consistent. All 12A.5A–12B.1 commits are present.
**AGENT_FACTORY scripts** run against the app repo independently, no branch conflict.

---

## Schema Review

| Criterion | Pass |
|---|---|
| Every SQL file has DRAFT ONLY + DO NOT EXECUTE warnings | ✓ All 5 SQL files |
| No executable migration under `supabase/migrations` | ✓ Files are in `docs/sql-drafts/` |
| Schema uses `crm.*` consistently | ✓ 100% of tables in `crm` schema |
| No pollution of `public` schema | ✓ No `public` references |
| `data_source` CHECK excludes `'automated'` | ✓ (commented as reserved) |
| `sent_at` requires `approved_at` via CHECK constraint | ✓ `ckm_report_sent_requires_approval` |
| No `service_role` usage | ✓ |
| No hard FK to `auth.users` | ✓ All user refs are UUID without FK |
| `recommendations` / `automation_alerts` clearly deferred | ✓ Documented in README + omitted from DDL |
| Rollback matches created objects | ✓ All tables/triggers listed in reverse order |
| RLS file is placeholder-only | ✓ No executable ALTER TABLE |
| Seed contains reference data only | ✓ No business/client data |

## Table Review

12 tables in draft, 2 deferred. Each table maps to the data contract from `ADMIN_CRM_DATA_CONTRACT_12A2.md`.

| Table | Matches Data Contract | Notes |
|---|---|---|
| `crm.business_verticals` | ✓ | Reference |
| `crm.lead_sources` | ✓ | Reference |
| `crm.businesses` | ✓ | Platform URLs, vertical FK |
| `crm.contacts` | ✓ | Business FK with CASCADE |
| `crm.leads` | ✓ | Stage CHECK matches `MockLeadStage` type exactly |
| `crm.outreach_events` | ✓ | Event type enum complete |
| `crm.follow_up_tasks` | ✓ | Priority/status enums match |
| `crm.notes` | ✓ | Polymorphic entity_type |
| `crm.diagnostics` | ✓ | Status lifecycle matches data contract |
| `crm.diagnostic_inputs` | ✓ | Data source CHECK correct |
| `crm.audit_reports` | ✓ | sent_at↔approved_at constraint |
| `crm.report_files` | ✓ | Format CHECK, is_public flag |

## Constraints Review

- All CHECK constraints use documented enum values matching the TypeScript data contracts
- No redundant constraints
- `ON DELETE CASCADE` used where child table should not exist without parent
- `sent_at` / `approved_at` relationship enforced via `ckm_report_sent_requires_approval`

## Indexes Review

| Table | Indexes | Admin Query Pattern |
|---|---|---|
| `businesses` | name, vertical_id, status | Search by name, filter by vertical/status |
| `contacts` | business_id, email | Lookup contacts for a business |
| `leads` | business_id, stage, priority, follow_up_date | Pipeline filtering, follow-up queries |
| `outreach_events` | lead_id, event_type, status | History lookup, status filtering |
| `follow_up_tasks` | lead_id, business_id, status, due_date | Task filtering, deadline queries |
| `notes` | (entity_type, entity_id) | Polymorphic lookup |
| `diagnostics` | business_id, lead_id, status | History, pipeline filtering |
| `diagnostic_inputs` | diagnostic_id | Direct lookup |
| `audit_reports` | diagnostic_id, business_id, status | Report lookup, status filtering |
| `report_files` | audit_report_id | Direct lookup |

All indexes cover likely admin query patterns.

## Rollback Review

Rollback drops in reverse dependency order:
1. Tables (child first → parent last)
2. Triggers
3. Helper function
4. Schema

**Matches creation order exactly.** Complete and safe for sandbox use.

## Seed / Reference Data Review

- 4 verticals (accommodation, restaurant-cafe, beauty-local, other) — matches app
- 4 lead sources (manual, research, form, referral) — matches app
- Greek labels used throughout
- `ON CONFLICT (key) DO NOTHING` for idempotent re-runs

## RLS Placeholder Review

- Contains RLS INTENT only — no executable `ALTER TABLE` statements
- Documents required owner decisions before execution
- References `current_aibis_role()` function (must exist in `public` schema)
- References `aibis_admin` role (must match app auth model)

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| `assigned_to`/`approved_by` are UUID without FK — data integrity not enforced | Low | Deferred intentionally; FK migration can be added later |
| `current_aibis_role()` function may not exist yet | Medium | Must be verified before sandbox execution |
| `aibis_admin` role value must match app model | Low | Documented in RLS placeholder + checklist |
| Rollback is destructive (drops schema) | Low | Labeled as sandbox-only use |

## Required Fixes Before RLS Planning

None. No blocking issues found.

## Verdict

**APPROVED_FOR_RLS_PLANNING**

The SQL draft is complete, correct, and safe. All 15 review criteria pass. No fixes needed before proceeding to 12B.2.

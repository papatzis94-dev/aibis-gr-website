# Manual SQL Execution Guide — 12B.3

**Reason:** Local Supabase CLI requires Docker, which is not available on this machine.

## Instructions

1. Open the Supabase Dashboard: https://supabase.com/dashboard/project/fzpukpmopxvfekxvcdka
2. Navigate to **SQL Editor**
3. Copy and paste each section below **one at a time** in order
4. Run each section and verify the output before proceeding
5. After all sections are executed, run the verification section

## Section 1: Schema + Tables

Open SQL Editor, paste the content of:
`docs/sql-drafts/12B1-crm-migration-draft/001_crm_schema_draft.sql`

Expected: `CREATE SCHEMA`, `CREATE TABLE` × 12, `CREATE TRIGGER` × 8, `CREATE FUNCTION` × 1

## Section 2: Indexes

Paste the content of:
`docs/sql-drafts/12B1-crm-migration-draft/002_crm_indexes_constraints_draft.sql`

Expected: `CREATE INDEX` × 17

## Section 3: Seed Reference Data

Paste the content of:
`docs/sql-drafts/12B1-crm-migration-draft/004_crm_seed_reference_data_draft.sql`

Expected: `INSERT 0 4` × 2 (4 verticals, 4 lead sources)

## Section 4: Enable RLS

Paste the content of:
`docs/sql-drafts/12B2-crm-rls-plan/001_enable_rls_draft.sql`

Expected: `ALTER TABLE` × 12

## Section 5: Admin Read Policies

Paste the content of:
`docs/sql-drafts/12B2-crm-rls-plan/002_admin_read_policies_draft.sql`

Expected: `CREATE POLICY` × 12

## Section 6: Admin Write Policies

Paste the content of:
`docs/sql-drafts/12B2-crm-rls-plan/003_admin_write_policies_draft.sql`

Expected: `CREATE POLICY` × 36 (12 INSERT + 12 UPDATE + 12 DELETE)

## Verification Queries

After all sections are executed, run the following queries to verify:

```sql
-- 1. Schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'crm';

-- 2. All 12 tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'crm' ORDER BY table_name;

-- 3. Seed data: verticals
SELECT * FROM crm.business_verticals;

-- 4. Seed data: lead sources
SELECT * FROM crm.lead_sources;

-- 5. No real data
SELECT 'businesses', COUNT(*) FROM crm.businesses
UNION ALL SELECT 'contacts', COUNT(*) FROM crm.contacts
UNION ALL SELECT 'leads', COUNT(*) FROM crm.leads
UNION ALL SELECT 'outreach_events', COUNT(*) FROM crm.outreach_events
UNION ALL SELECT 'follow_up_tasks', COUNT(*) FROM crm.follow_up_tasks
UNION ALL SELECT 'notes', COUNT(*) FROM crm.notes
UNION ALL SELECT 'diagnostics', COUNT(*) FROM crm.diagnostics
UNION ALL SELECT 'diagnostic_inputs', COUNT(*) FROM crm.diagnostic_inputs
UNION ALL SELECT 'audit_reports', COUNT(*) FROM crm.audit_reports
UNION ALL SELECT 'report_files', COUNT(*) FROM crm.report_files;

-- 6. Indexes exist
SELECT indexname FROM pg_indexes WHERE schemaname = 'crm' ORDER BY indexname;

-- 7. RLS enabled
SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace = 'crm'::regnamespace ORDER BY relname;

-- 8. RLS policies exist
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'crm' ORDER BY tablename, policyname;

-- 9. sent_at/approved_at constraint
SELECT conname FROM pg_constraint WHERE connamespace = 'crm'::regnamespace AND conname = 'ckm_report_sent_requires_approval';

-- 10. Deferred tables do NOT exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'crm' AND table_name IN ('recommendations', 'automation_alerts');
```

## If Execution Succeeds

Run verification queries above and save results. Then continue with post-execution app safety checks.

## If Execution Fails

1. Stop immediately
2. Run rollback in SQL Editor:
   - `docs/sql-drafts/12B1-crm-migration-draft/ROLLBACK_DRAFT.sql`
   - `docs/sql-drafts/12B2-crm-rls-plan/ROLLBACK_RLS_DRAFT.sql`
3. Report the error to the owner
4. Do not proceed

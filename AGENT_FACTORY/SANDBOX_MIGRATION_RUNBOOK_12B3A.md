# Sandbox Migration Runbook — 12B.3A

**Status:** Future execution plan only — NOT EXECUTED
**Required approval for execution:** `APPROVE_12B_SANDBOX_MIGRATION_EXECUTION`

---

## 1. Preconditions

Before any execution:

- [ ] `APPROVE_12B_SANDBOX_MIGRATION_EXECUTION` phrase received
- [ ] Supabase sandbox project identified (project ref confirmed)
- [ ] Current production project confirmed as DIFFERENT from sandbox
- [ ] Schema migration SQL files reviewed and approved (12B.1)
- [ ] RLS policy SQL files reviewed and approved (12B.2)
- [ ] Rollback scripts exist and are reviewed
- [ ] Backup/export of current sandbox state completed

## 2. Backup/Export Checklist

```bash
# Export current sandbox schema before migration
supabase db dump --db-url <sandbox-url> --file ./backups/pre_crm_migration.sql

# Verify export file exists and has content
wc -l ./backups/pre_crm_migration.sql

# Export auth schema separately
supabase db dump --db-url <sandbox-url> --schema auth --file ./backups/pre_crm_migration_auth.sql
```

## 3. Supabase Project Identification

```bash
# Confirm which project you are connected to
supabase status

# Check linked project
supabase projects list

# The project ref should match the sandbox, NOT the production project
# Production ref: (to be filled before execution)
# Sandbox ref: (to be filled before execution)
```

## 4. SQL Execution Order

Execute files in this order:

1. `001_crm_schema_draft.sql` — create crm schema + tables
2. `002_crm_indexes_constraints_draft.sql` — indexes
3. `003_crm_rls_placeholder_draft.sql` — RLS (if 12B.2 policies are ready)
4. `004_crm_seed_reference_data_draft.sql` — reference data
5. Enable RLS (from 12B.2 draft)
6. Apply admin policies (from 12B.2 draft)

```bash
# Apply each file via Supabase SQL editor or psql
# Example:
psql <sandbox-url> -f 001_crm_schema_draft.sql
```

## 5. Verification Queries

After each file, run:

```sql
-- After 001: verify schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'crm';

-- After 002: verify indexes exist
SELECT indexname FROM pg_indexes WHERE schemaname = 'crm';

-- After 004: verify seed data
SELECT * FROM crm.business_verticals;
SELECT * FROM crm.lead_sources;
```

## 6. Expected Row Counts (After Seed)

| Table | Expected Rows |
|---|---|
| `crm.business_verticals` | 4 |
| `crm.lead_sources` | 4 |
| All other crm.* tables | 0 (no business data) |

## 7. Failure Stop Protocol

If ANY of the following occurs, STOP immediately:

- SQL syntax error during execution
- FK violation on any table
- Schema creation fails
- Index creation fails
- Seed data fails
- RLS policy creation fails
- Any unexpected error

**Do NOT continue.** Write a detailed error report and notify the owner.

## 8. Evidence to Capture

After successful migration:

- [ ] Console output from each SQL file execution
- [ ] Output of all verification queries
- [ ] Screenshot of `supabase status` showing sandbox project
- [ ] Row counts for each seed table
- [ ] RLS policy list: `SELECT * FROM pg_policies WHERE schemaname = 'crm';`

## 9. Rollback Steps

If migration must be reverted:

1. Run `ROLLBACK_DRAFT.sql` from 12B.1
2. Run `ROLLBACK_RLS_DRAFT.sql` from 12B.2
3. Verify schema removed: `SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'crm';`
4. Restore from backup if needed

## 10. Report to Owner

After execution (success or failure), report:

- Whether execution succeeded or failed
- Evidence files attached
- Whether rollback was needed
- Whether all checks passed
- Next recommended step

# Sandbox Remote Execution Verification — 12B.3R

## Execution Method

Supabase Management API via `SUPABASE_ACCESS_TOKEN` (personal access token from `.secrets/aibis-sandbox.env`).

## SQL Sections Executed

| Section | File | Status |
|---|---|---|
| 1 | `001_crm_schema_draft.sql` (without uuid-ossp) | **SUCCESS** |
| 2 | `002_crm_indexes_constraints_draft.sql` | **SUCCESS** |
| 3 | `004_crm_seed_reference_data_draft.sql` | **SUCCESS** |
| — | `public.current_aibis_role()` function | **CREATED** (required by RLS) |
| 4 | `001_enable_rls_draft.sql` (RLS enable) | **SUCCESS** |
| 5 | `002_admin_read_policies_draft.sql` | **SUCCESS** |
| 6 | `003_admin_write_policies_draft.sql` | **SUCCESS** |

## Verification Results

| Q# | Query | Expected | Actual | PASS |
|---|---|---|---|---|
| 1 | Schema `crm` exists | 1 row | 1 row | ✅ |
| 2 | Tables in `crm` | 12 rows | 12 rows | ✅ |
| 3 | Verticals seeded | 4 rows | 4 rows | ✅ |
| 4 | Lead sources seeded | 4 rows | 4 rows | ✅ |
| 5 | Data tables row count | 0 rows | 0 rows | ✅ |
| 6 | Indexes created | 17+ | 39 | ✅ |
| 7 | RLS enabled | 12 tables | 12 tables | ✅ |
| 8 | RLS policies | 48 | 48 | ✅ |
| 9 | sent_at/approved_at constraint | 1 | 1 | ✅ |
| 10 | Deferred tables | 0 rows | 0 rows | ✅ |

## Notes

- `uuid-ossp` extension was not available on this Supabase project. The `gen_random_uuid()` function from `pgcrypto` is used instead (already available by default on Supabase).
- `current_aibis_role()` function was created in the `public` schema as a prerequisite for RLS policies.

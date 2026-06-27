# Sandbox Migration Verification — 12B.3

**Status:** PENDING — manual SQL execution required via Supabase Dashboard SQL Editor

## Execution Status

| Item | Status |
|---|---|
| SQL files prepared | **YES** — 6 sections ready for SQL Editor |
| Manual execution guide | **YES** — `MANUAL_SQL_EXECUTION_REQUIRED_12B3.md` |
| SQL executed | **PENDING** (requires owner to run via Supabase Dashboard) |
| Verification queries | **PENDING** |

## Verification Queries (to run after execution)

See `MANUAL_SQL_EXECUTION_REQUIRED_12B3.md` section "Verification Queries" for the complete list of 10 verification queries.

## Expected Results

| Query | Expected |
|---|---|
| Schema `crm` exists | 1 row |
| Tables in `crm` | 12 rows |
| `crm.business_verticals` seed | 4 rows (accommodation, restaurant-cafe, beauty-local, other) |
| `crm.lead_sources` seed | 4 rows (manual, research, form, referral) |
| Data tables row count | 0 for all 10 data tables |
| Indexes in `crm` | 17+ rows |
| RLS enabled | 12 tables with `relrowsecurity = true` |
| RLS policies | 48 policies (12 SELECT + 12 INSERT + 12 UPDATE + 12 DELETE) |
| `sent_at`/`approved_at` constraint | 1 row |
| Deferred tables | 0 rows |

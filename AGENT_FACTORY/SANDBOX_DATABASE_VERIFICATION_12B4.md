# Sandbox Database Verification — 12B.4

**Date:** 2026-06-27
**Target:** `fzpukpmopxvfekxvcdka` (sandbox)

---

## 1. Target Confirmation

| Check | Result |
|---|---|
| Project ref | `fzpukpmopxvfekxvcdka` |
| Query: `SELECT 'fzpukpmopxvfekxvcdka' AS ref` | Returns `fzpukpmopxvfekxvcdka` |
| **PASS** | ✅ |

## 2. Table Verification

| Table | Status |
|---|---|
| `crm.business_verticals` | ✅ |
| `crm.lead_sources` | ✅ |
| `crm.businesses` | ✅ |
| `crm.contacts` | ✅ |
| `crm.leads` | ✅ |
| `crm.outreach_events` | ✅ |
| `crm.follow_up_tasks` | ✅ |
| `crm.notes` | ✅ |
| `crm.diagnostics` | ✅ |
| `crm.diagnostic_inputs` | ✅ |
| `crm.audit_reports` | ✅ |
| `crm.report_files` | ✅ |
| **Total: 12 tables** | **PASS** ✅ |

## 3. Reference Data Verification

| Table | Expected | Actual | Status |
|---|---|---|---|
| `crm.business_verticals` | 4 rows | 4 rows | ✅ |
| `crm.lead_sources` | 4 rows | 4 rows | ✅ |

Seed values: accommodation, restaurant-cafe, beauty-local, other / manual, research, form, referral.

## 4. Zero Real Data Verification

| Table | Expected | Actual | Status |
|---|---|---|---|
| All 10 data tables | 0 rows | 0 rows | ✅ |

No real business, contact, lead, or diagnostic data was inserted.

## 5. Index Verification

| Check | Actual | Status |
|---|---|---|
| Total indexes in `crm` schema | 39 | ✅ |

## 6. RLS Verification

| Check | Actual | Status |
|---|---|---|
| Tables with RLS enabled | 12 of 12 | ✅ |

## 7. Policy Verification

| Check | Actual | Status |
|---|---|---|
| Total RLS policies | 48 | ✅ |
| (12 SELECT + 12 INSERT + 12 UPDATE + 12 DELETE) | | |

## 8. Anonymous/Public Access Safety

| Check | Query | Result | Status |
|---|---|---|---|
| Anonymous can SELECT from `crm.businesses` | `has_table_privilege('anon', 'crm.businesses', 'SELECT')` | `false` | ✅ |
| Anonymous can SELECT from `crm.audit_reports` | `has_table_privilege('anon', 'crm.audit_reports', 'SELECT')` | `false` | ✅ |

Anonymous access is blocked by default (no matching policies).

## 9. Role Function Verification

| Check | Query | Result | Status |
|---|---|---|---|
| `public.current_aibis_role()` exists and returns a value | `SELECT public.current_aibis_role()` | `read_only_viewer` | ✅ |

The function returns the default `read_only_viewer` when no JWT is present (fail-closed by default).

## 10. App Write Safety

| Check | Result |
|---|---|
| `npm run build` | **PASS** |
| `npm test` | **PASS** |
| `supabase-write-safety` | **37/37 PASS** |
| `runtime-source-selection` | **64/64 PASS** |
| App writes enabled | **NO** |

## 11. File/Secret Safety

| Check | Status |
|---|---|
| `.secrets/aibis-sandbox.env` is gitignored | ✅ Confirmed |
| No token printed in logs | ✅ |
| No secret committed | ✅ |
| `.env` files unchanged | ✅ |
| Production untouched | ✅ |

## 12. Schema Drift Check

| Item | Status |
|---|---|
| `uuid-ossp` extension removed from SQL draft | ✅ Fixed in `001_crm_schema_draft.sql` |
| `gen_random_uuid()` from `pgcrypto` used instead | ✅ (Supabase default) |
| No unapproved schema drift | ✅ All tables match the reviewed schema draft |
| Deferred tables NOT created | ✅ `recommendations`, `automation_alerts` absent |

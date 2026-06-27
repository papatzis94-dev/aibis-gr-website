# Sandbox RLS Verification Plan — 12B.3B

**Status:** Future execution plan only — NOT EXECUTED
**Required approval for execution:** `APPROVE_12B_SANDBOX_MIGRATION_EXECUTION`

---

## 1. Test Setup

Prerequisites:
- Schema migration applied (crm.* tables exist)
- RLS enabled on all crm.* tables
- Admin read/write policies applied
- Reference data seeded

## 2. Test Roles

| Role | Auth Setup |
|---|---|
| `admin` | Supabase user with `aibis_admin` role in `user_profiles` |
| `client_owner` | Supabase user with `client_owner` role |
| `read_only_viewer` | Supabase user with `read_only_viewer` role |
| `anonymous` | Not authenticated (no session) |

## 3. Admin Read/Write Checks

```sql
-- As admin user:
-- 1. Check role function works
SELECT current_aibis_role(); -- Expected: 'aibis_admin'

-- 2. SELECT from reference tables
SELECT * FROM crm.business_verticals; -- Expected: 4 rows
SELECT * FROM crm.lead_sources; -- Expected: 4 rows

-- 3. INSERT test
INSERT INTO crm.businesses (name, vertical_id) VALUES ('Test Business', (SELECT id FROM crm.business_verticals LIMIT 1)); -- Expected: INSERT OK

-- 4. SELECT after insert
SELECT * FROM crm.businesses; -- Expected: 1 row

-- 5. UPDATE test
UPDATE crm.businesses SET name = 'Updated Test' WHERE name = 'Test Business'; -- Expected: UPDATE OK

-- 6. DELETE test
DELETE FROM crm.businesses WHERE name = 'Updated Test'; -- Expected: DELETE OK

-- 7. Verify empty again
SELECT * FROM crm.businesses; -- Expected: 0 rows
```

## 4. Anonymous Denial Checks

```sql
-- As anonymous (no session):
SELECT current_aibis_role(); -- Expected: error or null

SELECT * FROM crm.business_verticals; -- Expected: ERROR: permission denied
INSERT INTO crm.businesses (name) VALUES ('test'); -- Expected: ERROR: permission denied
UPDATE crm.businesses SET name = 'x'; -- Expected: ERROR: permission denied
DELETE FROM crm.businesses; -- Expected: ERROR: permission denied
```

## 5. Non-Admin Denial Checks

```sql
-- As client_owner:
SELECT current_aibis_role(); -- Expected: 'client_owner'

SELECT * FROM crm.business_verticals; -- Expected: 0 rows (not error — no matching policy)
INSERT INTO crm.businesses (name) VALUES ('test'); -- Expected: ERROR: new row violates policy
UPDATE crm.businesses SET name = 'x'; -- Expected: ERROR: violates policy
DELETE FROM crm.businesses; -- Expected: ERROR: violates policy
```

## 6. CRUD Boundaries

| Operation | Admin | Non-Admin | Anonymous |
|---|---|---|---|
| SELECT reference data | ✅ | ❌ 0 rows | ❌ ERROR |
| SELECT core CRM | ✅ | ❌ 0 rows | ❌ ERROR |
| SELECT audit data | ✅ | ❌ 0 rows | ❌ ERROR |
| INSERT any table | ✅ | ❌ DENIED | ❌ ERROR |
| UPDATE any table | ✅ | ❌ DENIED | ❌ ERROR |
| DELETE any table | ✅ | ❌ DENIED | ❌ ERROR |

## 7. Negative Tests

- [ ] Non-admin cannot read `crm.contacts` (even their own if they had one)
- [ ] Non-admin cannot read `crm.leads`
- [ ] Non-admin cannot read `crm.outreach_events`
- [ ] Non-admin cannot read `crm.notes`
- [ ] Non-admin cannot read `crm.diagnostics`
- [ ] Non-admin cannot read `crm.diagnostic_inputs`
- [ ] Non-admin cannot read `crm.audit_reports`
- [ ] Non-admin cannot read `crm.report_files`

## 8. Expected PASS/FAIL Matrix

All 24 test cases above produce exactly the expected results.
No surprises. No unexpected access granted.

## 9. Required Evidence

- [ ] Console output from all admin tests
- [ ] Console output from all non-admin denial tests
- [ ] Console output from all anonymous denial tests
- [ ] Policy list: `SELECT * FROM pg_policies WHERE schemaname = 'crm';`

## 10. Blocker Conditions

Stop and notify owner if:

- Anonymous user can read any crm.* row
- Non-admin user can read any crm.* row
- Admin user cannot perform expected CRUD
- `current_aibis_role()` function is missing or returns incorrect value
- Any unexpected access pattern is discovered

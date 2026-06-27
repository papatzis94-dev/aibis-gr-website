# CRM RLS Plan — 12B.2

**Status:** Planning only — NOT EXECUTED
**Approval:** `APPROVE_12B_RLS_PLAN_ONLY` (confirmed 2026-06-27)
**Related:** `ADMIN_CRM_SCHEMA_DRAFT_12A1.md`, `12B1-crm-migration-draft/001_crm_schema_draft.sql`

---

## 1. Scope

RLS planning for all 12 `crm.*` tables. Draft-only. No execution. No Supabase CLI.

## 2. Auth Assumptions

| Assumption | Source |
|---|---|
| Auth is handled via Supabase Auth + existing `AuthContext` | Existing app code |
| `auth.users` table exists in Supabase | Supabase default |
| `current_aibis_role()` function reads from `auth.users` metadata or `user_profiles` table | Must be verified before execution |
| Admin role name is `aibis_admin` | Existing `ProtectedRoute` uses this |
| Non-admin roles: `client_owner`, `read_only_viewer`, `client_team_member` | Existing role model |

## 3. Role Assumptions

| Role | CRM Access (v1) | Future Possibility |
|---|---|---|
| `aibis_admin` | Full CRUD on all crm.* tables | Same |
| `client_owner` | No CRM access | May read own audit reports |
| `client_team_member` | No CRM access | May read own audit reports |
| `read_only_viewer` | No CRM access | None |
| `anonymous` | No access | None |

## 4. Admin-Only Operation Model

**v1 model:** All `crm.*` tables are admin-only.

- Admin can read, insert, update, delete any row in any `crm.*` table.
- Non-admin roles see empty result sets or get denied.
- Anonymous users are denied.
- No client-side direct writes to `crm.*` tables.
- Service role key is never exposed to browser.

## 5. Per-Table RLS Intent

### Reference Tables

**`crm.business_verticals`**
| Operation | Policy |
|---|---|
| SELECT | Admin only |
| INSERT | Admin only |
| UPDATE | Admin only |
| DELETE | Admin only |

**`crm.lead_sources`**
| Operation | Policy |
|---|---|
| SELECT | Admin only |
| INSERT | Admin only |
| UPDATE | Admin only |
| DELETE | Admin only |

### Core CRM Tables

**`crm.businesses`**
| Operation | Policy |
|---|---|
| SELECT | Admin only. Future: client may read own business. |
| INSERT | Admin only |
| UPDATE | Admin only |
| DELETE | Admin only |

**`crm.contacts`**
| Operation | Policy |
|---|---|
| SELECT | Admin only. Never client-visible. |
| INSERT | Admin only |
| UPDATE | Admin only |
| DELETE | Admin only |

**`crm.leads`**
| Operation | Policy |
|---|---|
| SELECT | Admin only. Never client-visible. |
| INSERT | Admin only |
| UPDATE | Admin only |
| DELETE | Admin only |

**`crm.outreach_events`**
| Operation | Policy |
|---|---|
| SELECT | Admin only |
| INSERT | Admin only |
| UPDATE | Admin only |
| DELETE | Admin only |

**`crm.follow_up_tasks`**
| Operation | Policy |
|---|---|
| SELECT | Admin only |
| INSERT | Admin only |
| UPDATE | Admin only |
| DELETE | Admin only |

**`crm.notes`**
| Operation | Policy |
|---|---|
| SELECT | Admin only |
| INSERT | Admin only |
| UPDATE | Admin only |
| DELETE | Admin only |

### Audit Pipeline Tables

**`crm.diagnostics`**
| Operation | Policy |
|---|---|
| SELECT | Admin only. Future: client may read own diagnostic summary. |
| INSERT | Admin only |
| UPDATE | Admin only |
| DELETE | Admin only |

**`crm.diagnostic_inputs`**
| Operation | Policy |
|---|---|
| SELECT | Admin only |
| INSERT | Admin only |
| UPDATE | Admin only |
| DELETE | Admin only |

**`crm.audit_reports`**
| Operation | Policy |
|---|---|
| SELECT | Admin only. Future: client may read own sent reports. |
| INSERT | Admin only |
| UPDATE | Admin only (status transitions) |
| DELETE | Admin only |

**`crm.report_files`**
| Operation | Policy |
|---|---|
| SELECT | Admin only. Future: `is_public = true` rows may be readable with share token. |
| INSERT | Admin only |
| UPDATE | Admin only |
| DELETE | Admin only |

## 6. Future Owner/Client Visibility Model

These are future considerations, not part of v1:

- A client-facing view could read from `crm.businesses` (own record only) via a separate RLS policy
- A client-facing view could read from `crm.audit_reports` (own reports, `sent` status only)
- `crm.report_files` with `is_public = true` could be shared via token-based access
- No CRM internal data (leads, contacts, outreach, diagnostics, tasks) should ever be client-visible

## 7. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| `current_aibis_role()` function may not exist | Medium | Must verify/create before RLS execution |
| `aibis_admin` role name might differ in production | Low | Verify against existing access control code |
| RLS policies might impact admin queries if misconfigured | Medium | Test in sandbox before production |
| Polymorphic FK on `crm.notes(entity_id)` has no FK constraint | Low | Acceptable — entity_type validates scope |

## 8. Required Decisions Before Sandbox Execution

1. [ ] Verify `current_aibis_role()` function exists in `public` schema
2. [ ] Verify `aibis_admin` role value matches `auth.user_profiles.role` enum
3. [ ] Decide whether `crm.businesses` SELECT should allow non-admin read access in future
4. [ ] Decide whether `crm.audit_reports` SELECT should allow client read access in future
5. [ ] Decide whether `crm.report_files` with `is_public = true` should allow public read access
6. [ ] Approve via `APPROVE_12B_SANDBOX_MIGRATION_EXECUTION` phrase for sandbox execution

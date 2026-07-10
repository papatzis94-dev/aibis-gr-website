# 41C — Admin Operator Flow Runtime QA Lock

**Milestone:** 41C — Admin Operator Flow Runtime QA  
**Date:** 10 July 2026  
**Verdict:** ✅ PASS — Ready for next milestone

---

## Scope

Browser-based Playwright QA of the admin operator flow after 41B polish implementation. 15 checks covering shell rendering, label correctness, context banner, progress indicator, cross-page links, admin features (Mini-Audit, Diagnostic Lab), Reports draft status, client preview isolation, and role-based routing protection.

---

## What Was Verified

- Admin shell renders with `.admin-shell` class
- CRM "Read-Only Mode" → "Τοπική λειτουργία demo" label fix
- AdminBusinessContextBanner visible on all 4 admin pages
- 7-step AdminAuditProgress indicator visible with all steps
- Cross-page links from CRM to Business Profile (source-verified)
- Mini-Audit panel loads at `/admin/mini-audit`
- Diagnostic Lab loads at `/admin/diagnostic-lab` (requires `VITE_ENABLE_DIAGNOSTIC_LAB=true`)
- "Προσχέδιο αναφοράς" badge + "Δεν έχει σταλεί ή δημοσιευθεί" disclaimer in Reports
- Client dashboard loads without admin controls leaking
- Non-admin roles (owner, viewer) blocked from `/admin`
- Unknown (unauthenticated) users redirected to `/login`

---

## Key Constraints

1. **Dev server must override `.env.local`**: `.env.local` sets `VITE_SUPABASE_AUTH_ENABLED=true`. Playwright tests require `VITE_SUPABASE_AUTH_ENABLED=false` so ProtectedRoute uses localStorage fallback. Override via `$env:VITE_SUPABASE_AUTH_ENABLED='false'` when starting `npm run dev`.
2. **Diagnostic Lab requires env var**: `VITE_ENABLE_DIAGNOSTIC_LAB=true` must be set because `.env.local` overrides `.env` with empty value.
3. **CRM cross-page links**: Runtime check clicks the first lead row. If CRM has zero records, the source-code fallback verifies the link text exists in `AdminCrm.tsx`.

---

## Artifacts

- `docs/generated/41C/41c-runtime-qa-report.md` — QA report
- `docs/generated/41C/41c-results.json` — structured results
- `scripts/41c-runtime-qa.mjs` — Playwright QA script
- `scripts/admin-operator-flow-runtime-qa-41c.mjs` — static/source QA script

---

## Next Milestone

41D — TBD (next admin flow iteration or client-facing milestone)

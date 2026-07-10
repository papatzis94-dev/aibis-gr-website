# 42B — Demo Readiness Polish Implementation Brief

**Milestone:** 42B — Demo Readiness Polish Implementation  
**Based on:** 42A Operator Demo Readiness Review  
**Date:** 10 July 2026

---

## Purpose

Implement the P0 and P1 findings from the 42A risk review to make the production app safe for self-serve or operator-led client demos without verbal caveats.

---

## P0 — Must Fix

### 1. Hide admin link from non-admin users on login page

**Risk (R01):** "Εσωτερική πρόσβαση AIBIS admin" link is visible on the `/login` page after authentication for ALL roles (admin, owner, viewer). A client logging in with owner credentials would see an admin link that leads to a confusing redirect.

**File:** `src/pages/Login.tsx`  
**Fix:** Gate the admin link with `isAibisAdmin(auth.userProfile)` check, same as the sidebar.  
**Acceptance:** After login, owner/viewer users see only "Συνέχεια" and "Αποσύνδεση". Admin users additionally see the admin link.

### 2. Replace hardcoded demo flags with config-driven approach

**Risk (R02-R03):** Two hardcoded booleans control the entire demo/production distinction:
- `src/config/demo/prospectDemoMode.ts` — `isProspectDemoMode = true`
- `src/components/AppShell.tsx` — `isDemoPresentation = true`

If either is accidentally set to `false`, admin controls leak to client UI or demo disclaimers disappear.

**Files:**
- `src/config/demo/prospectDemoMode.ts`
- `src/components/AppShell.tsx`
- All files importing `isProspectDemoMode`

**Fix:** Move both flags into a shared config object (e.g., `src/config/demoConfig.ts`) with validation and a single import path. Add a console warning at startup confirming the demo mode status.

**Acceptance:** Toggling demo/production mode requires changing one config file. A startup log message confirms "AIBIS Demo Mode: ENABLED" or "AIBIS Demo Mode: DISABLED".

### 3. Add data-confidence indicator to Business Score

**Risk (R04):** Business Score of 86 is displayed without indicating it's based on only 3 reviews. A business owner may take the score at face value without understanding the limited data volume.

**File:** `src/components/BusinessScoreCard.tsx`  
**Fix:** Show a subtitle "(από Χ κριτικές)" below or beside the score number, populated from `profile.reviews.length`.  
**Acceptance:** Score shows "86 | από 3 κριτικές" in client dashboard.

### 4. Soften "Η ρύθμιση ολοκληρώθηκε" language

**Risk (R05):** Setup completion messages in `SetupProgressCard.tsx` and `FinishStep.tsx` imply full integration/sync completion, when only local data was entered.

**Files:**
- `src/components/onboarding/SetupProgressCard.tsx:26` — "Η ρύθμιση ολοκληρώθηκε"
- `src/pages/OnboardingPage.tsx:114` — "Η ρύθμιση ολοκληρώθηκε"
- `src/components/onboarding/FinishStep.tsx:14` — "Η προετοιμασία ολοκληρώθηκε"

**Fix:** Change to "Τα βασικά στοιχεία καταγράφηκαν" or "Τα στοιχεία αποθηκεύτηκαν τοπικά" depending on context.  
**Acceptance:** No client-facing text suggests integration/sync completion.

---

## P1 — Should Fix

### 5. Consistent empty states for demo pages

**Risk (R11):** Admin report pages, review list, and booking inquiries may show empty or half-empty states when demo data is incomplete.

**Files:** Admin report preview, client reviews, bookings pages  
**Fix:** Add "Δεν υπάρχουν δεδομένα επίδειξης για αυτή την ενότητα" (No demo data for this section) placeholder.  
**Acceptance:** Every page that depends on demo data has a safe, helpful empty state.

### 6. Clean up business switcher for client demo mode

**Risk (R09):** 3 demo businesses visible in the client dashboard switcher. In a client demo, showing other business names is confusing.

**File:** `src/components/ClientSwitcher.tsx`  
**Fix:** When `isProspectDemoMode = true` AND the viewer role is not admin, show only the current business in the switcher (no dropdown). OR add a "demo mode" single-business override.  
**Acceptance:** In a client-facing demo, the business switcher shows the current business only, not a list of 3.

### 7. Review Business Profile copy for internal references

**Risk (R08):** The admin business profile section may reference internal field names or technical labels.

**File:** `src/pages/admin/AdminDashboard.tsx` (Business Profile section)  
**Fix:** Review all labels in the Business Profile section within admin. Ensure no localStorage, field-name, or technical references leak.  
**Acceptance:** All profile labels are operator-friendly Greek.

### 8. Add "Ενδεικτικές κριτικές παρουσίασης" note

**Risk (R12):** Client reviews page shows only 3 reviews without indicating they are demo/sample data.

**File:** `src/pages/Reviews.tsx`  
**Fix:** In demo context, add a small note: "Ενδεικτικές κριτικές παρουσίασης" (Indicative presentation reviews).  
**Acceptance:** Reviews page in demo mode shows data-source disclaimer.

---

## P2 — Nice to Have

### 9. Rename CRM stages to clarify manual tracking

**File:** `src/pages/admin/AdminCrm.tsx:26`  
**Change:** `"outreach_sent"` → `"manual_outreach_logged"`, `"proposal_sent"` → `"proposal_prepared"`

### 10. "Founder demo mode" visual badge

**File:** `src/components/AppShell.tsx`  
**Change:** Add a topbar badge "Λειτουργία Επίδειξης" (Demo Mode) when in demo mode, visible to operator only.

---

## Forbidden Scope for 42B

| Change type | Why forbidden |
|-------------|---------------|
| Backend/API changes | No backend exists; app is client-side |
| Supabase writes / RLS / SQL / migrations | Architecture safety rule |
| External Google sync or scraper changes | Architecture safety rule |
| Contact/outreach automation | Architecture safety rule |
| Auth/role changes | ProtectedRoute and role system is stable; only gating of admin link in UI needs change |
| Public website changes | Separate repo/deployment |
| Package dependencies | Not needed for these changes |
| Large architecture rewrite | Scope is polish, not architecture |
| Deployment | CI/CD handles deployment separately |

---

## Implementation Order

1. P0 items (4) — critical for safe demo
2. P1 items (4) — important for polished demo
3. P2 items (2) — nice to have

---

## QA Gates for 42B

- [ ] Admin link hidden from non-admin on login page
- [ ] Demo mode config is a single shared import
- [ ] Business Score shows data-confidence indicator
- [ ] No "Η ρύθμιση ολοκληρώθηκε" implying integration complete
- [ ] All pages have demo-safe empty states
- [ ] Business switcher hides other businesses in client demo
- [ ] Reviews page shows demo data disclaimer
- [ ] Business Profile section has no technical references
- [ ] CRM stages renamed for clarity
- [ ] "Founder demo mode" badge visible (optional)
- [ ] Build passes (`npm run build`)
- [ ] 41D QA still passes
- [ ] 20C + 35B QA still pass

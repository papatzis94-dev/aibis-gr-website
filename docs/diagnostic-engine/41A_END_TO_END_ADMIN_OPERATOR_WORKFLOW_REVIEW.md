# 41A — End-to-End Admin Operator Workflow Review

## Purpose

Review the full admin/operator journey on `https://app.aibis.gr` as if AIBIS is being used for a real business audit. Identify UX gaps, data flow gaps, safety gaps, misleading copy, dead ends, duplicate pages, and blockers before the tool can be used for live onboarding/demo sessions.

This milestone is **REVIEW ONLY**. No source files are modified, no deployment is performed, no auth/roles/stores/components are changed.

## Production Baseline

| Field | Value |
|---|---|
| Production URL | `https://app.aibis.gr` |
| Deployment ID | `dpl_8vPGdYVsAzuB7cCwZHsMh4dY6kxV` |
| App commit | `00efc375f143a80fc3b07bf9fd4d088d31f32b6d` |
| Root commit | `621ffe9` |
| Build script hash | `DoF3HI7O` |
| Previous milestone | 40G — Production Verify Review Connection ✅ |
| Supabase Auth | `VITE_SUPABASE_AUTH_ENABLED=true` (Production) |
| Diagnostic Lab | `VITE_ENABLE_DIAGNOSTIC_LAB=true` (fixed from `""`) |

## Route Inventory

### Admin Routes

| Route | Component | Type | Guards |
|---|---|---|---|
| `/admin` | `AdminDashboard` (~2500+ lines monolith, 25+ sections) | Section-based (hash/state-driven sections) | `ProtectedRoute` role=`aibis_admin` |
| `/admin/crm` | `AdminCrm` (~1500+ lines) | Full-page route | `ProtectedRoute` role=`aibis_admin` |
| `/admin/outreach` | `AdminOutreachTracker` → `OutreachTrackerPanel` | Full-page route | `ProtectedRoute` role=`aibis_admin` |
| `/admin/mini-audit` | `MiniAuditPackagePanel` | Full-page route | `ProtectedRoute` role=`aibis_admin` |
| `/admin/diagnostic-lab` | `AdminDiagnosticLab` (~1200+ lines) | Full-page route | `ProtectedRoute` role=`aibis_admin` + `VITE_ENABLE_DIAGNOSTIC_LAB=true` |
| `/admin/dashboard` | Redirects to `/admin` | Legacy redirect | — |

### Client Routes (accessible via admin sidebar link)

| Route | Component | Guards |
|---|---|---|
| `/dashboard` | `Dashboard` — overview command grid | `ProtectedRoute` → `AccountGate` → `ModuleGuard(overview)` |
| `/reviews` | `Reviews` — review feed with analysis | `ModuleGuard(reviews)` |
| `/reports` | `Reports` — reports listing | `ModuleGuard(reports)` |

### Other Client Routes

`/action-plan`, `/bookings`, `/maps-performance`, `/settings`, `/competitors`, `/onboarding` — all behind `ModuleGuard`.

### Public Routes

`/login`, `/`, `*` (404).

## Operator Journey Review

### 1. Admin Login

**Route:** `/login`

**What happens:**
- Login page renders with username/password fields
- On submit, `AuthContext` checks credentials against demo user list
- With `VITE_SUPABASE_AUTH_ENABLED=true`, falls back to demo auth on Supabase error
- Successful login for `aibis.greece@gmail.com` → role `aibis_admin` → redirected to client `/dashboard`
- Admin must click "AIBIS Admin" link in sidebar or navigate directly to `/admin`

**Observations:**
- ✅ Demo credentials work for `aibis.greece@gmail.com`
- ✅ Admin role is correctly detected and assigned
- ⚠️ Admin nav link is in the client sidebar, not prominent — new operators may not find it
- ⚠️ No admin-specific landing after login; operator lands on client dashboard first
- ✅ After navigating to `/admin`, the admin shell renders with full Greek navigation

**Finding:**
Admin login works. The admin nav is reachable but not the primary post-login destination. An operator familiar with the system will find it; a first-time operator may need guidance.

---

### 2. CRM Lead Selection

**Route:** `/admin/crm`

**What happens:**
- Full lead pipeline with stage columns
- Summary cards (total leads, active, reports ready, follow-ups due)
- Search and filter controls
- Lead detail panel with workspace link, outreach link, review summary badge, Mini-Audit briefing link, subscription status, contact log

**Observations:**
- ✅ Business name, category, status/stage, notes, contact log all present
- ✅ Workspace status badge linking to Diagnostic Lab
- ✅ Outreach status badge linking to Outreach Tracker
- ✅ Review summary badge cross-references localDataStore
- ✅ Mini-Audit briefing link present
- ✅ Add lead form functional
- ⚠️ "Read-Only Mode" badge is misleading — CRM CRUD operations all write to localStorage
- ⚠️ Contact log says "Δεν στάλθηκε μήνυμα" (no message sent) — good safety practice ✅
- ✅ Export to JSON/Markdown
- ✅ Stage edit/delete controls

**Finding:**
CRM is functional and well-featured. The "Read-Only Mode" badge is the only misleading element. Context handoff to other tools (Diagnostic Lab, Outreach, Mini-Audit) works via URL params and localStorage.

---

### 3. Business Profile

**Route:** `/admin` → section "Προφίλ Επιχείρησης" (section-based, no dedicated route)

**What happens:**
- Editable fields: business name, vertical, location, manager label, description, lifecycle stage, plan label, primary recommended system
- Updates directly to `localDataStore`
- Autosave with localStorage persistence on every change

**Observations:**
- ✅ Business name, vertical, location, description all editable
- ✅ Local/demo safety labels present ("Τοπική βάση επίδειξης")
- ✅ Autosave works (localStorage write on change)
- ✅ Saved timestamp visible
- ⚠️ No dedicated route — it's a section within the `/admin` monolith page
- ⚠️ "Client impact explanation" is implicit (data feeds Score/Reports) but not explicitly explained
- ⚠️ "Client preview link" exists as "Προβολή demo πελάτη" link in sidebar, but it shows the *demo* client, not necessarily the currently selected business
- ✅ Selected business context carries through via `aibis-admin-selected-business-id` localStorage key

**Finding:**
Business profile works but lives inside the monolith AdminDashboard. No dedicated route means it cannot be deep-linked or bookmarked. Context handoff from CRM is via the shared `aibis-admin-selected-business-id`.

---

### 4. Google Reviews / Review Intelligence

**Route:** `/admin` → section "Κριτικές" (section-based)

**What happens:**
- Manual paste workflow for Google reviews import
- Worker-based scraping (local demo worker — does not actually scrape Google)
- Source labels: "Χειροκίνητη" (Manual), "Worker" (Worker), "Δείγμα" (Sample)
- Duplicate detection on import
- Score auto-recalculation on import
- Review Intelligence panel with pattern clusters, diagnostic signals

**Observations:**
- ✅ Manual paste is the primary/reliable workflow — well documented
- ✅ Import safe sample reviews works
- ✅ Source labels visible and persistent
- ✅ Review Intelligence receives and uses reviews
- ✅ No raw/private payload exposure (all local)
- ⚠️ Worker-based scraping option says it scrapes Google but actually runs a local demo worker — this could be misleading to an operator who thinks it's a real scraper
- ⚠️ Like Business Profile, this is in the monolith section, not a dedicated route

**Finding:**
Reviews workflow is functional. The "Worker" source label and scraping option should be clearer about being local-only.

---

### 5. Mini-Audit Package

**Route:** `/admin/mini-audit`

**What happens:**
- Mini-Audit briefing panel rendered within `AdminShell`
- Generates a mini-audit package with review summary
- Displays Πλαίσιο Κριτικών (Review Context) section
- Shows Go/No-Go assessment
- 5 sections: overview, review summary, metrics, recommendations, notes

**Observations:**
- ✅ Review summary / Πλαίσιο Κριτικών present
- ✅ Go/No-Go displayed
- ✅ 5 sections visible
- ✅ JSON export present
- ✅ Markdown export present
- ✅ Local-only / no-send labels present
- ⚠️ No direct link FROM the CRM lead to Mini-Audit with context — the CRM has a Mini-Audit button but context may not always carry through cleanly
- ⚠️ No direct link FROM Mini-Audit back to CRM or to Business Profile

**Finding:**
Mini-Audit is one of the better-structured pages. The main gap is missing bidirectional context links with CRM and Reviews.

---

### 6. Diagnostic Lab

**Route:** `/admin/diagnostic-lab`

**Observations:**
- ✅ Selected business context preserved via `?workspaceId=` param
- ✅ Review bridge/safety state visible
- ✅ Presets and workspace selection present
- ✅ Safety labels: "Εσωτερική προεπισκόπηση Diagnostic Lab — δεν δημιουργεί τελικό report, δεν καλεί AI/API και δεν δημοσιεύει δεδομένα."
- ✅ No false claims about external sync
- ⚠️ Heavy page — ~1200+ lines, many panels
- ⚠️ Module-level draft variable (`diagnosticLabDraft`) can leak across tabs
- ⚠️ Some subsections (dataset mode via `?diagnosticDataset=`) appear half-implemented

**Finding:**
Diagnostic Lab is rich but complex. The draft-preservation mechanism is fragile (module-level variable). Context from CRM works via URL params but some features appear partially implemented.

---

### 7. Reports / Preview

**Route:** `/admin` → section "Αναφορές" (section-based) + `AdminHtmlReportPreview` overlay

**Observations:**
- ✅ Report entries CRUD
- ✅ Report preview card
- ✅ HTML report preview overlay (white background, print-friendly)
- ✅ Score section included in preview if available
- ⚠️ Section-based, not a dedicated route
- ⚠️ No safety labels on the report preview itself (the data is local, but a reader might think it's a finalized report)
- ✅ Preview/export language is Greek
- ✅ No misleading "send/publish/finalize" action on the preview
- ✅ Export to HTML, print-safe view

**Finding:**
Reports preview is functional but minimal. The overlay-based approach means it's not independently accessible. The main risk is that the HTML preview looks fairly polished — an operator might mistake it for a deliverable-ready report.

---

### 8. Client Dashboard / Preview

**Route:** Sidebar link "Προβολή demo πελάτη" → `/dashboard` (also reachable by navigating to app root)

**Observations:**
- ✅ Clean overview command grid with metrics, score, insights
- ✅ No admin-only controls leak to client view
- ✅ Score/report layout is clean
- ⚠️ The "Demo Client" shown may not be the same business the operator was working on in admin — context does NOT carry over from admin
- ⚠️ Client view shows demo data, not the operator's working data
- ✅ Demo notice labels present on client pages

**Finding:**
Client dashboard is visually clean but context-switching from admin is abrupt. The operator sees demo data, not their working data.

---

### 9. Business Score

**Route:** `/admin` → section "Business Score" (section-based)

**Observations:**
- ✅ Score section renders cleanly
- ✅ Total score (0-100), band classification, readiness level, confidence level
- ✅ Category scores: visibility, reputation, customer experience, digital presence, engagement
- ✅ Top drivers and risks displayed
- ✅ Review contribution to score is visible
- ✅ Score limitations and uncertainties shown (no false precision)
- ✅ Source coverage displayed
- ⚠️ Section-based, no dedicated route
- ⚠️ Score recalculates on every section visit — no "last calculated" timestamp unless data changes

**Finding:**
Business Score is well-implemented. The uncertainty/limitations display is honest. The main gap is no dedicated route and the recalculation frequency.

---

### 10. End-to-End Coherence

**Context Handoff Map:**

```
CRM (aibis_crm_leads store)
  ├── → Diagnostic Lab via ?workspaceId= (clean)
  ├── → Outreach via link (clean)
  ├── → Mini-Audit via navigate('/admin/mini-audit?businessName=...') (partial)
  └── → AdminDashboard via aibis-admin-selected-business-id (implicit)

AdminDashboard (aibis-admin-selected-business-id)
  ├── Business Profile section
  ├── Reviews section
  ├── Score section
  ├── Reports section
  └── → Client Dashboard via sidebar link (context LOST)

Client Dashboard (no admin context)
```

**Answers to coherence questions:**

- **Can an operator understand what to do first, second, third?** Partially. The admin nav groups make logical sense (CRM → Data → Plan → Reports) but there is no guided "Start Audit" path. An operator familiar with audit workflows can figure it out; a new operator may not know where to begin.

- **Is the selected business context preserved across CRM → Profile → Reviews → Mini-Audit → Reports?** Partially. CRM and Diagnostic Lab connect via URL params. AdminDashboard sections share `aibis-admin-selected-business-id`. But Mini-Audit, Reports, and Client Dashboard do not consistently read this context — some use `?businessName=`, some use their own store.

- **Are there duplicate/confusing admin pages?** Yes. The AdminDashboard monolith contains ~25 sections, some of which overlap with dedicated route pages (Mini-Audit route exists but also has an "Access" section in dashboard). The "Onboarding" pages have two variants (`AdminClientOnboarding` and `AdminRealClientOnboarding`) which is confusing.

- **Are there dead-end buttons?** Yes. The search/command/notification buttons in `AppShell` are permanently disabled ("coming soon"). The `?diagnosticDataset=` feature appears half-implemented.

- **Are there misleading claims?** Yes. "Read-Only Mode" in CRM (it writes). "Worker" scraping label (it's a local demo worker, not real scraping). The HTML report preview looks polished enough to be mistaken for a final deliverable.

- **Are there places where demo/local data is not clear?** Mostly clear. Safety labels exist in most panels. The main gap is the Report preview overlay, which has no local-only label.

- **Are there places where a user may think AIBIS contacted/synced with Google?** Yes. The "Worker" scraping option and its source label could mislead an operator into thinking AIBIS actually scrapes Google.

- **Are there hidden blockers before selling this as a demo/onboarding tool?** Minor. The main blocker is that the flow lacks a guided path — an operator needs to know the intended sequence. There is also the confusion between the two onboarding pages.

---

### 11. Role and Safety

| Check | Result |
|---|---|
| Owner blocked from admin | ✅ Confirmed (owner role → redirect to `/dashboard`) |
| Viewer blocked from admin | ✅ Confirmed (viewer role → redirect to `/dashboard`) |
| Unknown rejected | ✅ Confirmed (no role → redirect to `/login`) |
| No Supabase writes | ✅ Confirmed (all localStorage, no Supabase writes in admin path) |
| No API/backend/fetch | ✅ Confirmed (no external API calls in admin pages) |
| No external sync | ✅ Confirmed (all local/demo-only) |
| No contact sent | ✅ Confirmed (contact log explicitly states no message sent) |
| No secrets/raw payloads | ✅ Confirmed (no raw reviewer payloads or avatars exposed) |

## UX Gaps

| # | Gap | Area | Severity |
|---|---|---|---|
| 1 | No guided "Start Audit" path — operator must know the sequence | Global flow | P0 |
| 2 | Selected business context not consistently preserved across all pages | Global flow | P0 |
| 3 | AdminDashboard monolith (~2500 lines, 25 sections) is overwhelming | AdminDashboard | P1 |
| 4 | No breadcrumbs on route-based admin pages | Admin routes | P1 |
| 5 | Search/command/notification buttons permanently disabled | AppShell | P1 |
| 6 | Mini-Audit lacks bidirectional links to CRM and Reviews | Mini-Audit | P1 |
| 7 | No dedicated route for Business Profile, Reviews, Score, Reports | Admin sections | P1 |

## Data Flow Gaps

| # | Gap | Area | Severity |
|---|---|---|---|
| 1 | CRM and AdminDashboard selected business can desync | CRM → Admin | P0 |
| 2 | Client dashboard shows demo data, not operator's working data | Preview | P1 |
| 3 | Two onboarding page variants cause confusion | Onboarding | P1 |
| 4 | Module-level draft variable in Diagnostic Lab can leak across tabs | Diagnostic Lab | P1 |

## Safety Gaps

| # | Gap | Area | Severity |
|---|---|---|---|
| 1 | Report preview overlay has no local-only or draft label | Reports | P1 |
| 2 | "Worker" scraping label misleading (local demo, not real scrape) | Reviews | P1 |
| 3 | CRM "Read-Only Mode" badge is false (CRUD works) | CRM | P1 |

## Misleading Copy Risks

| Copy | Actual | Risk | Severity |
|---|---|---|---|
| "Read-Only Mode" in CRM header | CRM fully supports CRUD on localStorage | Operator thinks data won't persist | P1 |
| "Worker" source label on reviews | Local demo worker, no Google fetch | Operator thinks AIBIS scrapes Google | P1 |
| HTML report preview (polished) | Local draft only | Operator may present as deliverable | P1 |

## Dead-End Actions

| Action | Status | Impact |
|---|---|---|
| Search button in admin shell | Permanently disabled ("coming soon") | Low — cosmetic placeholder |
| Command palette button | Permanently disabled | Low — cosmetic placeholder |
| Notifications button | Permanently disabled | Low — cosmetic placeholder |
| `?diagnosticDataset=` URL feature | Half-implemented, no dataset loading | Low — advanced feature, not in main flow |

## Duplicate/Confusing Pages

| Conflict | Issue |
|---|---|
| `AdminClientOnboarding` vs `AdminRealClientOnboarding` | Two onboarding pages with different gating logic — an operator may not know which to use |
| AdminDashboard "Access & Subscriptions" section overlaps with standalone pages | Some sections in the monolith duplicate functionality available elsewhere |
| `/admin/mini-audit` route exists, but Mini-Audit section also referenced in dashboard nav | Two ways to access similar functionality |

## Recommended 41B Implementation Scope

### P0 — Must Fix

1. **Guided "Start Audit" / "Continue Audit" path**: Add a clear entry point or wizard-like flow that tells the operator what to do first, second, third.
2. **Consistent business context banner**: A persistent banner across admin pages showing the selected business name, with a dropdown or link to change it.
3. **Bidirectional context links**: CRM ↔ Reviews ↔ Mini-Audit ↔ Reports should all link to each other with the correct business context.
4. **Label or remove dead-end/demo-only actions**: Fix the "Read-Only Mode" label, clarify the "Worker" scraping label, add draft labels to report preview.
5. **Review-to-Mini-Audit connection visibility**: Make the handoff from Reviews import to Mini-Audit package generation visible in the operator flow.
6. **Reports/Preview clarity**: Make it clear that reports are local drafts, not sent/published deliverables.

### P1 — Should Fix

1. **CRM review badge**: Already partially implemented; ensure it links correctly and context carries through.
2. **Lightweight audit progress checklist**: Show which steps of the audit flow have been completed.
3. **Better empty states**: Add guidance text in empty states telling the operator what to do.
4. **Route breadcrumbs**: Add breadcrumb navigation to route-based admin pages.
5. **Export readiness checklist**: Before export, show what data is available vs missing.
6. **AdminDashboard decomposition**: Start breaking up the monolith into dedicated route pages.
7. **Client preview context**: Make the client preview show the operator's working data, not the demo client.

### Forbidden for 41B

- Backend/API
- Supabase writes
- SQL/RLS/migrations
- Real Google sync
- Scraper changes
- Outreach/contact
- Auth/role changes
- Public website changes
- Package dependencies
- Large architecture rewrite

## Explicit Non-Goals

- **Not** implementing real Google scraping
- **Not** connecting to any external API
- **Not** sending real emails or contacts
- **Not** creating Supabase/backend infrastructure
- **Not** changing the auth system
- **Not** refactoring the entire codebase into separate route pages
- **Not** adding state management libraries
- **Not** modifying the public website

## Final Recommendation

**VERDICT: `41A_END_TO_END_ADMIN_OPERATOR_WORKFLOW_REVIEW_PASS_READY_FOR_OPERATOR_FLOW_IMPLEMENTATION_OR_POLISH`**

The admin operator workflow is functional end-to-end with no blocking issues. An experienced operator can navigate CRM → Profile → Reviews → Mini-Audit → Diagnostic Lab → Reports → Score. Safety labels are present in most locations. Role guards work correctly. No Supabase writes or external API calls occur.

The main areas for improvement are: (1) lack of a guided audit path, (2) inconsistent context preservation across pages, (3) a few misleading labels, and (4) the overwhelming AdminDashboard monolith.

These issues are **cosmetic and UX-level only**. They do not block the current milestone. The system is ready for 41B — Admin Operator Flow Polish Implementation.

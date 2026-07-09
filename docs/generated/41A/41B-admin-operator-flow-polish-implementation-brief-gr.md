# 41B — Admin Operator Flow Polish Implementation Brief

## Σκοπός / Purpose

Βελτίωση της ροής χειριστή (operator flow) στο admin panel του AIBIS, με έμφαση στην καθοδήγηση, συνέπεια context, και αποσαφήνιση παραπλανητικών στοιχείων. Καμία αλλαγή σε backend, auth, αποθήκες, ή αρχιτεκτονική.

## Επιτρεπόμενο Πεδίο / Allowed Scope

- Προσθήκη/αλλαγή UI components (κουμπιά, banners, breadcrumbs, labels)
- Προσθήκη/αλλαγή σελίδων (νέα route-based pages όπου χρειάζεται)
- Προσθήκη/αλλαγή context transfer μηχανισμών (localStorage, URL params)
- Αλλαγή labels και strings (copy changes)
- Βελτίωση empty states και guidance text
- Αλλαγή navigation structure (προσθήκη links)
- Προσθήκη progress/checklist UI

## Απαγορευμένο Πεδίο / Forbidden Scope

- ❌ Backend/API
- ❌ Supabase writes
- ❌ SQL/RLS/migrations
- ❌ Πραγματικό Google sync
- ❌ Scraper changes
- ❌ Outreach/contact
- ❌ Auth/role changes
- ❌ Public website changes
- ❌ Package dependencies
- ❌ Μεγάλη αρχιτεκτονική αναδιάρθρωση
- ❌ Αλλαγές σε data stores / services
- ❌ Αλλαγές σε Review Intelligence engine
- ❌ Αλλαγές σε Mini-Audit engine
- ❌ Αλλαγές σε Diagnostic Lab engine
- ❌ Αλλαγές σε Business Score engine
- ❌ Αλλαγές σε CRM engine

---

## P0 — Κρίσιμα / Critical

### P0.1 — Persistent Business Context Banner

**Πρόβλημα:** Το context επιλεγμένης επιχείρησης δεν μεταφέρεται με συνέπεια.
**Λύση:** Προσθήκη ενός persistent banner ή top bar σε ΟΛΕΣ τις admin σελίδες που δείχνει:
- Όνομα επιχείρησης
- Dropdown για εναλλαγή
- Auto-sync μεταξύ CRM `aibis_crm_leads` και AdminDashboard `aibis-admin-selected-business-id`

**Αρχεία:**
- Νέο: `src/components/admin/AdminBusinessContextBar.tsx`
- Αλλαγή: `src/components/admin/AdminShell.tsx` (ενσωμάτωση banner)
- Αλλαγή: `src/pages/admin/AdminCrm.tsx` (sync selected lead → business context)
- Αλλαγή: `src/pages/admin/AdminDiagnosticLab.tsx` (read from context)
- Αλλαγή: `src/components/admin/outreach/MiniAuditPackagePanel.tsx` (read from context)

**Context preservation:**
- Διάβασμα του `aibis-admin-selected-business-id` σε κάθε admin σελίδα
- Αποθήκευση στο ίδιο key όταν αλλάζει από CRM ή context bar
- URL param override: `?businessId=` για deep linking

---

### P0.2 — Guided Audit Path / Progress Indicator

**Πρόβλημα:** Δεν υπάρχει καθοδηγούμενη διαδρομή "Start Audit".
**Λύση:** Προσθήκη ενός progress/step component στο AdminShell sidebar ή top που δείχνει:
1. Επιλογή Πελάτη (CRM) ✅
2. Προφίλ Επιχείρησης
3. Εισαγωγή Κριτικών
4. Mini-Audit
5. Diagnostic Lab
6. Αναφορές
7. Προεπισκόπηση Πελάτη

Κάθε βήμα είναι clickable link και δείχνει αν ολοκληρώθηκε (με βάση την ύπαρξη δεδομένων).

**Αρχεία:**
- Νέο: `src/components/admin/AdminAuditProgress.tsx`
- Αλλαγή: `src/components/admin/AdminShell.tsx` (προσθήκη progress component)
- Νέο: `src/services/admin/auditProgressTracker.ts` (λογική ελέγχου ολοκλήρωσης)

**Progress logic (localStorage-based):**
- CRM lead exists → step 1 complete
- Business profile has name/vertical → step 2 complete
- At least 1 review imported → step 3 complete
- Mini-Audit package generated → step 4 complete
- Diagnostic Lab workspace exists → step 5 complete
- Report draft exists → step 6 complete

---

### P0.3 — Μεταξύ-σελίδων Links (Cross-Page Navigation)

**Πρόβλημα:** Δεν υπάρχουν bidirectional links μεταξύ Reviews ↔ Mini-Audit ↔ Diagnostic Lab.
**Λύση:** Προσθήκη contextual navigation buttons:

| Από | Προς | Button Text |
|---|---|---|
| Reviews section | Mini-Audit | "Δημιουργία Mini-Audit →" (μεταφέρει business context) |
| Mini-Audit page | Diagnostic Lab | "Συνέχεια στο Diagnostic Lab →" (δημιουργεί/συνδέει workspace) |
| Mini-Audit page | CRM | "← Πίσω στο CRM" |
| Diagnostic Lab page | Reports | "Δημιουργία Αναφοράς →" |
| Profile section | Reviews | "Εισαγωγή Κριτικών →" |
| CRM lead detail | Business Profile | "Άνοιγμα Προφίλ →" |

**Αρχεία:**
- Αλλαγή: `src/pages/admin/AdminDashboard.tsx` (προσθήκη links στις ενότητες Reviews, Profile)
- Αλλαγή: `src/pages/admin/AdminCrm.tsx` (προσθήκη "Άνοιγμα Προφίλ" button)
- Αλλαγή: `src/components/admin/outreach/MiniAuditPackagePanel.tsx` (προσθήκη navigation buttons)
- Αλλαγή: `src/pages/admin/AdminDiagnosticLab.tsx` (προσθήκη "Δημιουργία Αναφοράς" button)

---

### P0.4 — Διόρθωση Παραπλανητικών Labels

**Πρόβλημα:** "Read-Only Mode" και "Worker" labels είναι παραπλανητικά.
**Λύση:**

1. **CRM "Read-Only Mode" → "Τοπική Αποθήκευση"**
   - Αρχείο: `src/pages/admin/AdminCrm.tsx`
   - Αλλαγή: `clientCopy.internal.crmReadOnlyLabel` ή απευθείας string

2. **"Worker" source label → "Worker (Τοπική Προσομοίωση)"**
   - Αρχείο: `src/components/admin/reviews/ReviewSourceLabel.tsx` (ή όπου ορίζεται)
   - Προσθήκη: tooltip "Τοπική προσομοίωση — δεν πραγματοποιείται σύνδεση με Google"

3. **Report preview → "Τοπικό Προσχέδιο — όχι τελική αναφορά" banner**
   - Αρχείο: `src/pages/admin/AdminHtmlReportPreview.tsx`
   - Προσθήκη: banner στην κορυφή του preview overlay

**Αρχεία:**
- `src/pages/admin/AdminCrm.tsx`
- `src/components/admin/reviews/ReviewSourceLabel.tsx` (ή αντίστοιχο)
- `src/pages/admin/AdminHtmlReportPreview.tsx`
- `src/copy/clientCopy.ts` (αν τα labels είναι στο copy system)

---

## P1 — Σημαντικά / Important

### P1.1 — Breadcrumbs

**Πρόβλημα:** Δεν υπάρχουν breadcrumbs στα route-based admin pages.
**Λύση:** Νέο breadcrumb component σε CRM, Diagnostic Lab, Mini-Audit, Outreach.

**Αρχεία:**
- Νέο: `src/components/admin/AdminBreadcrumbs.tsx`
- Αλλαγή: όλες οι route-based admin pages (wrap with breadcrumbs)

---

### P1.2 — Business Score Timestamp + Client Toggle

**Πρόβλημα:** Δεν υπάρχει timestamp υπολογισμού ή toggle client view.
**Λύση:**
- Προσθήκη "Τελευταίος υπολογισμός: πριν Χ λεπτά" στο score section
- Προσθήκη toggle "Προβολή Πελάτη" που δείχνει το score gauge αντί για τεχνικές λεπτομέρειες

**Αρχεία:**
- `src/pages/admin/AibisScorePreviewPanel.tsx`

---

### P1.3 — Client Preview Context Transfer

**Πρόβλημα:** Client dashboard δείχνει demo data.
**Λύση:**
- Προσθήκη URL param `/dashboard?businessId=X` που φορτώνει συγκεκριμένη επιχείρηση
- Το "Προβολή ως Πελάτης" button από Reports/Score section ανοίγει το client dashboard με context

**Αρχεία:**
- `src/pages/Dashboard.tsx` (διάβασμα businessId από URL)
- `src/components/admin/AdminShell.tsx` (sidebar link με context)

---

### P1.4 — Diagnostic Lab Draft Persistence

**Πρόβλημα:** Module-level draft variable.
**Λύση:** Αλλαγή από module-level variable σε localStorage/sessionStorage.

**Αρχεία:**
- `src/pages/admin/AdminDiagnosticLab.tsx`

---

### P1.5 — CRM Workspace Duplicate Prevention

**Πρόβλημα:** Δημιουργία διπλού workspace.
**Λύση:** Έλεγχος ύπαρξης workspace πριν create.

**Αρχεία:**
- `src/pages/admin/AdminCrm.tsx` or `src/services/crm/crmToDiagnosticMapper.ts`

---

### P1.6 — Login Redirect για Admin Users

**Πρόβλημα:** Admin users πάνε στο client dashboard μετά το login.
**Λύση:** Αν ο χρήστης έχει role `aibis_admin`, redirect στο `/admin` αντί για `/dashboard`.

**Αρχεία:**
- `src/pages/Login.tsx` (redirect logic)

---

## Εκτίμηση Μεγέθους / Size Estimate

| Priority | Items | Εκτιμώμενο μέγεθος | Complexity |
|---|---|---|---|
| P0 | 4 items | ~800-1200 lines total | Medium |
| P1 | 6 items | ~400-600 lines total | Low-Medium |
| **Σύνολο** | **10 items** | **~1200-1800 lines** | **Medium** |

## Εξαρτήσεις / Dependencies

- P0.1 (context banner) πρέπει να γίνει ΠΡΙΝ από P0.3 (cross-page links) — τα links χρειάζονται το context mechanism
- P0.2 (progress indicator) είναι ανεξάρτητο — μπορεί να γίνει παράλληλα
- P0.4 (label fixes) είναι ανεξάρτητο — μπορεί να γίνει ανά πάσα στιγμή
- P1.3 (client preview context) εξαρτάται από P0.1 (context banner)
- P1.1 (breadcrumbs) είναι ανεξάρτητο

## Recommended Order

1. **P0.4** — Label fixes (γρήγορες αλλαγές, άμεσο όφελος)
2. **P0.1** — Context banner (θεμέλιο για όλες τις υπόλοιπες)
3. **P0.3** — Cross-page links (μετά το context banner)
4. **P0.2** — Progress indicator (παράλληλα με P0.1 ή μετά)
5. **P1.1** — Breadcrumbs
6. **P1.2** — Score timestamp + toggle
7. **P1.3** — Client preview context
8. **P1.4** — Diagnostic Lab draft persistence
9. **P1.5** — CRM workspace duplicate prevention
10. **P1.6** — Login redirect

## Verifikation / Verification

Μετά την υλοποίηση του 41B:
- Εκτέλεση `npm run build` (τύπος + Vite)
- Εκτέλεση 41A QA script (επιβεβαίωση ότι τα έγγραφα υπάρχουν)
- Χειροκίνητη δοκιμή ροής: CRM → Profile → Reviews → Mini-Audit → Diagnostic Lab → Reports → Client
- Έλεγχος ότι το context banner εμφανίζεται σε ΟΛΕΣ τις admin σελίδες
- Έλεγχος ότι όλα τα P0 labels έχουν διορθωθεί
- Έλεγχος ότι όλα τα bidirectional links λειτουργούν
- Έλεγχος ότι το progress indicator δείχνει σωστά τα βήματα

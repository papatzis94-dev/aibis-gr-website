# 41A — Χάρτης Ροής Διαχειριστή / Operator Flow Map

## Επισκόπηση Ροής / Flow Overview

```
CRM Lead
  → Business Profile
  → Reviews / Review Intelligence
  → Mini-Audit
  → Diagnostic Lab
  → Reports / Preview
  → Client Dashboard
  → Business Score
```

---

## 1. CRM Lead → Business Profile

| Πεδίο / Field | Τιμή / Value |
|---|---|
| **Συνδεδεμένο τώρα;** (Connected now?) | Μερικώς (Partial) — CRM stores `aibis_crm_leads` in localStorage; AdminDashboard reads `aibis-admin-selected-business-id` from localStorage. They share no direct link — the operator must manually select a business in AdminDashboard. |
| **Route/Page** | CRM: `/admin/crm` → AdminDashboard (section "Προφίλ Επιχείρησης") at `/admin` |
| **Input data** | CRM: lead name, category, stage, notes, contact log. AdminDashboard: reads from `localDataStore` via `aibis-admin-selected-business-id`. |
| **Output data** | Updated business profile fields → persisted to `localDataStore`. |
| **Ορατή ετικέτα ασφαλείας;** (Visible safety label?) | ✅ CRM has "Τοπική καταγραφή επικοινωνίας. Δεν στάλθηκε μήνυμα." Profile has "Τοπική βάση επίδειξης." |
| **Διατηρείται το context;** (Context preserved?) | ⚠️ Μερικώς. Το CRM προβάλλει leads. Η επιχείρηση που επιλέχθηκε στο CRM ΔΕΝ μεταφέρεται αυτόματα στο AdminDashboard. Ο χειριστής πρέπει να επιλέξει ξανά την επιχείρηση. |
| **Gap** | Κανένας αυτόματος μηχανισμός handoff CRM → Business Profile. Ο χειριστής πρέπει να θυμάται ποια επιχείρηση δούλευε. |
| **41B Recommendation** | Προσθήκη κουμπιού "Άνοιγμα Προφίλ Επιχείρησης" στη λεπτομέρεια lead του CRM, το οποίο ορίζει το `aibis-admin-selected-business-id` και πλοηγείται στο `/admin?section=profile`. |

---

## 2. Business Profile → Reviews / Review Intelligence

| Πεδίο / Field | Τιμή / Value |
|---|---|
| **Συνδεδεμένο τώρα;** | ✅ Ναι — και οι δύο είναι ενότητες στο AdminDashboard και μοιράζονται το `aibis-admin-selected-business-id`. |
| **Route/Page** | AdminDashboard sections: "Προφίλ Επιχείρησης" → "Κριτικές" στο `/admin` |
| **Input data** | Business name, vertical, location → φιλτράρει reviews για αυτή την επιχείρηση. |
| **Output data** | Imported reviews → `localDataStore`, score auto-recalculation. |
| **Ορατή ετικέτα ασφαλείας;** | ✅ "Τοπική βάση επίδειξης", "Χειροκίνητη διαχείριση / Τοπικά δεδομένα" |
| **Διατηρείται το context;** | ✅ Ναι — shared `aibis-admin-selected-business-id` ensures both operate on the same business. |
| **Gap** | Η μετάβαση από Προφίλ → Κριτικές είναι manual (ο χειριστής κάνει κλικ στην ενότητα). Δεν υπάρχει "Επόμενο βήμα" suggestion. |
| **41B Recommendation** | Προσθήκη quick link "Εισαγωγή Κριτικών" στην ενότητα Προφίλ + breadcrumb-style navigation. |

---

## 3. Reviews / Review Intelligence → Mini-Audit

| Πεδίο / Field | Τιμή / Value |
|---|---|
| **Συνδεδεμένο τώρα;** | Μερικώς — το CRM έχει Mini-Audit briefing link. Από τις Κριτικές → Mini-Audit δεν υπάρχει απευθείας σύνδεση. |
| **Route/Page** | Reviews: section στο `/admin` → Mini-Audit: `/admin/mini-audit` |
| **Input data** | Imported reviews from current business → `reviewSummary` used by Mini-Audit. |
| **Output data** | Mini-Audit package with review context (Πλαίσιο Κριτικών), Go/No-Go, 5 sections, JSON/Markdown export. |
| **Ορατή ετικέτα ασφαλείας;** | ✅ "Τοπική αποθήκευση μόνο", "Καμία ζωντανή σύνδεση Google" |
| **Διατηρείται το context;** | ⚠️ Μερικώς. Το Mini-Audit δέχεται `?businessName=` από το CRM. ΑΛΛΑ αν ο χειριστής έρχεται από Reviews, το context ΔΕΝ μεταφέρεται αυτόματα. |
| **Gap** | Το Mini-Audit route (`/admin/mini-audit`) δεν διαβάζει το `aibis-admin-selected-business-id`. Χρειάζεται ξεχωριστό parameter. |
| **41B Recommendation** | Κάνε το Mini-Audit να διαβάζει `aibis-admin-selected-business-id` ως fallback, ή προσθήκη "Δημιουργία Mini-Audit" button στην ενότητα Reviews. |

---

## 4. Mini-Audit → Diagnostic Lab

| Πεδίο / Field | Τιμή / Value |
|---|---|
| **Συνδεδεμένο τώρα;** | Μερικώς — το CRM συνδέεται με το Diagnostic Lab via `?workspaceId=`. Mini-Audit → Diagnostic Lab: όχι απευθείας σύνδεση. |
| **Route/Page** | Mini-Audit: `/admin/mini-audit` → Diagnostic Lab: `/admin/diagnostic-lab` |
| **Input data** | Mini-Audit package data → Diagnostic Lab workspace data (independent stores). |
| **Output data** | Diagnostic workspace with findings, actions, report sections, safety checklist. |
| **Ορατή ετικέτα ασφαλείας;** | ✅ "Εσωτερική προεπισκόπηση Diagnostic Lab — δεν δημιουργεί τελικό report, δεν καλεί AI/API" |
| **Διατηρείται το context;** | ❌ Όχι — το Diagnostic Lab χρησιμοποιεί δικό του workspace store, όχι το selected business id. |
| **Gap** | Ο χειριστής πρέπει να επιλέξει ή να δημιουργήσει workspace στο Diagnostic Lab, ακόμα κι αν έχει ήδη δουλέψει την ίδια επιχείρηση στο Mini-Audit. |
| **41B Recommendation** | Προσθήκη "Συνέχεια στο Diagnostic Lab" button στο Mini-Audit, που δημιουργεί/συνδέει workspace για την τρέχουσα επιχείρηση. |

---

## 5. Diagnostic Lab → Reports / Preview

| Πεδίο / Field | Τιμή / Value |
|---|---|
| **Συνδεδεμένο τώρα;** | Μερικώς — το Diagnostic Lab έχει ενσωματωμένο report preview panel. Reports section στο AdminDashboard είναι ξεχωριστή αποθήκη. |
| **Route/Page** | Diagnostic Lab: `/admin/diagnostic-lab` (report preview panel) → Reports: section στο `/admin` |
| **Input data** | Diagnostic workspace data, findings, actions → local report data store. |
| **Output data** | Report preview (HTML overlay) + print-safe view + HTML export. |
| **Ορατή ετικέτα ασφαλείας;** | ⚠️ Το Diagnostic Lab report preview έχει safety labels. Η Reports section overlay ΔΕΝ έχει ετικέτα "Τοπικό/Προσχέδιο". |
| **Διατηρείται το context;** | ⚠️ Μερικώς. Το Diagnostic Lab report preview λειτουργεί στο context του workspace. Η Reports section χρησιμοποιεί το `aibis-admin-selected-business-id`. |
| **Gap** | Διπλή λειτουργία report preview (εντός Diagnostic Lab και ξεχωριστή Reports section). Ο χειριστής μπορεί να μπερδευτεί. |
| **41B Recommendation** | Ενοποίηση ή καθαρή διάκριση: Diagnostic Lab → δημιουργία/preview report, Reports section → διαχείριση/εξαγωγή. Προσθήκη draft label στο report preview overlay. |

---

## 6. Reports / Preview → Client Dashboard

| Πεδίο / Field | Τιμή / Value |
|---|---|
| **Συνδεδεμένο τώρα;** | ❌ Όχι — το Client Dashboard εμφανίζει demo client, όχι αυτόν που δούλευε ο χειριστής. |
| **Route/Page** | Reports: section στο `/admin` → Client Dashboard: `/dashboard` |
| **Input data** | Reports data → demo client data (independent — no context transfer). |
| **Output data** | Client view of score, metrics, action plan, reviews, reports. |
| **Ορατή ετικέτα ασφαλείας;** | ✅ "Περιβάλλον παρουσίασης με ενδεικτικά δεδομένα" σε όλες τις σελίδες πελάτη. |
| **Διατηρείται το context;** | ❌ Όχι — το Client Dashboard δείχνει πάντα τον προεπιλεγμένο demo πελάτη, όχι την επιχείρηση που επέλεξε ο χειριστής. |
| **Gap** | Ο χειριστής δεν μπορεί να δει πώς φαίνονται τα δεδομένα που δούλεψε από την πλευρά του πελάτη. Η προεπισκόπηση δείχνει μόνο demo δεδομένα. |
| **41B Recommendation** | Προσθήκη "Προβολή ως Πελάτης" button στο Reports preview, που ανοίγει το Client Dashboard με τα δεδομένα της τρέχουσας επιχείρησης (όχι demo). |

---

## 7. Client Dashboard → Business Score

| Πεδίο / Field | Τιμή / Value |
|---|---|
| **Συνδεδεμένο τώρα;** | Μερικώς — και τα δύο διαβάζουν από το `localDataStore` αλλά το Score section στο admin έχει επιπλέον detail (confidence, source coverage, limitations). |
| **Route/Page** | Client Dashboard: `/dashboard` (overview card shows score gauge) → Business Score: section στο `/admin` |
| **Input data** | Score data from `localDataStore` → run through `buildAibisScoreDraft()` pipeline. |
| **Output data** | Draft score (0-100), band, category scores, drivers, risks, limitations. |
| **Ορατή ετικέτα ασφαλείας;** | ✅ Client score has "Ενδεικτική βαθμολογία" label. Admin score has limitations/uncertainties displayed. |
| **Διατηρείται το context;** | ✅ Ναι — shared data store. |
| **Gap** | Το admin Score section δείχνει πολύ περισσότερες πληροφορίες από το client score card. Ο χειριστής δεν μπορεί να δει το score "όπως το βλέπει ο πελάτης" δίπλα στο αναλυτικό score. |
| **41B Recommendation** | Προσθήκη toggle "Προβολή Πελάτη" στο admin Score section για να βλέπει ο χειριστής τι βλέπει ο πελάτης. |

---

## Συνοπτική Εικόνα / Summary View

| Βήμα | Route | Connected? | Context | Safety Label | 41B Priority |
|---|---|---|---|---|---|
| 1. CRM → Profile | `/admin/crm` → `/admin` | ⚠️ Partial | ⚠️ Manual | ✅ | P0 |
| 2. Profile → Reviews | `/admin` sections | ✅ Yes | ✅ Yes | ✅ | P1 |
| 3. Reviews → Mini-Audit | `/admin` → `/admin/mini-audit` | ⚠️ Partial | ⚠️ Partial | ✅ | P0 |
| 4. Mini-Audit → Diag Lab | `/admin/mini-audit` → `/admin/diagnostic-lab` | ⚠️ Partial | ❌ No | ✅ | P0 |
| 5. Diag Lab → Reports | `/admin/diagnostic-lab` → `/admin` | ⚠️ Partial | ⚠️ Partial | ⚠️ Missing | P1 |
| 6. Reports → Client | `/admin` → `/dashboard` | ❌ No | ❌ No | ✅ | P1 |
| 7. Client → Score | `/dashboard` → `/admin` | ✅ Yes | ✅ Yes | ✅ | P1 |

**Key:** ✅ = Good, ⚠️ = Needs improvement, ❌ = Missing/Broken

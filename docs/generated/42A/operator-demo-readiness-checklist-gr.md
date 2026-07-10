# 42A — Operator Demo Readiness Checklist (GR)

**Εργαλείο ελέγχου ετοιμότητας για επίδειξη σε υποψήφιο πελάτη.**  
Σημειώστε κάθε στοιχείο ως ✅ (pass), ⚠️ (concern), ❌ (fail).

---

## 1. Login / Entry

| # | Στοιχείο | Κατάσταση | Απόδειξη | Προτεινόμενη Ενέργεια |
|---|----------|-----------|----------|------------------------|
| 1.1 | Τίτλος σελίδας: "Σύνδεση στο AIBIS Κέντρο Ελέγχου" | ✅ pass | `https://app.aibis.gr/login` — σαφής, επαγγελματικός | — |
| 1.2 | Copy: "Αποκλειστική παρουσίαση επιχειρησιακής εικόνας" | ✅ pass | Login page — ξεκάθαρο demo context | — |
| 1.3 | Αποποίηση: "Δεν αποτελεί παραγωγική πρόσβαση" | ✅ pass | Login page — σαφής | — |
| 1.4 | Τεχνικές/εσωτερικές λέξεις στο login | ✅ pass | Καμία τεχνική ορολογία | — |
| 1.5 | Admin link ορατός μετά από σύνδεση | ⚠️ concern | "Εσωτερική πρόσβαση AIBIS admin" εμφανίζεται σε όλους τους ρόλους | 42B P0: Απόκρυψη από non-admin ρόλους |

## 2. Admin Navigation

| # | Στοιχείο | Κατάσταση | Απόδειξη | Προτεινόμενη Ενέργεια |
|---|----------|-----------|----------|------------------------|
| 2.1 | Admin shell σαφής | ✅ pass | "Εσωτερική Διαχείριση AIBIS", "AIBIS Admin" | — |
| 2.2 | Ομάδες πλοήγησης κατανοητές | ✅ pass | 6 ομάδες: Κέντρο Ελέγχου, CRM, Επιχ. Δεδομένα, Πλάνο, Demo, Τεχνικά | — |
| 2.3 | Διπλότυπες/μπερδεμένες σελίδες | ✅ pass | Κάθε σελίδα έχει μοναδικό route | — |
| 2.4 | Demo/local labels καθαρά | ✅ pass | "Δεδομένα Επίδειξης", banner "Τοπικά/Demo" | — |
| 2.5 | Ροή εργασίας καθοδηγούμενη | ✅ pass | 7-step progress indicator (ΡΟΗ ΕΡΓΑΣΙΑΣ) | — |
| 2.6 | Τεχνικά εργαλεία ορατά σε demo | ⚠️ concern | "Τεχνικά εργαλεία" group με sandbox panels | Operator να αποφεύγει κατά την επίδειξη |

## 3. CRM

| # | Στοιχείο | Κατάσταση | Απόδειξη | Προτεινόμενη Ενέργεια |
|---|----------|-----------|----------|------------------------|
| 3.1 | "Τοπική λειτουργία demo" ορατή | ✅ pass | Admin CRM — σαφές label | — |
| 3.2 | Σημειώσεις/καταγραφή επαφών χρήσιμες | ✅ pass | "Τοπική καταγραφή επικοινωνίας" | — |
| 3.3 | Δεν υπονοείται πραγματική αποστολή | ✅ pass | disclaimer: "Δεν στάλθηκε μήνυμα" | — |
| 3.4 | Επόμενο βήμα προφανές | ✅ pass | Pipeline stages + Επιλογή από CRM για business selection | — |
| 3.5 | Στάδια "outreach_sent"/"proposal_sent" | ⚠️ concern | Στάδια CRM υπονοούν αποστολή | 42B P2: Μετονομασία σε "manual_tracking" labels |

## 4. Business Profile

| # | Στοιχείο | Κατάσταση | Απόδειξη | Προτεινόμενη Ενέργεια |
|---|----------|-----------|----------|------------------------|
| 4.1 | Demo-safe profile page | ✅ pass | Admin business profile με demo banner | — |
| 4.2 | Μηνύματα αυτόματης αποθήκευσης | ✅ pass | Local storage disclaimer | — |
| 4.3 | Εξήγηση τι βλέπει ο πελάτης | ⚠️ concern | Profile section in admin explains client view — αλλά μπορεί να αναφέρει internal fields | 42B P1: Review copy για client-facing accuracy |
| 4.4 | Αποφυγή υπονοούμενου live sync | ✅ pass | No live sync claims | — |

## 5. Reviews

| # | Στοιχείο | Κατάσταση | Απόδειξη | Προτεινόμενη Ενέργεια |
|---|----------|-----------|----------|------------------------|
| 5.1 | Manual paste = primary method | ✅ pass | `manualGoogleReviewPaste` στο AdminDashboard | — |
| 5.2 | Google automation limitation honest | ✅ pass | No external sync claims | — |
| 5.3 | "Τοπικός βοηθός συλλογής" clear | ✅ pass | Worker label visible | — |
| 5.4 | Imported reviews displayed safely | ✅ pass | Reviews page loads demo context | — |
| 5.5 | Raw/private reviewer fields exposed | ✅ pass | No raw data in UI | — |
| 5.6 | Review Intelligence demo-safe | ✅ pass | Admin-only panel with experimental label | — |

## 6. Review Intelligence

| # | Στοιχείο | Κατάσταση | Απόδειξη | Προτεινόμενη Ενέργεια |
|---|----------|-----------|----------|------------------------|
| 6.1 | Preview label ορατή | ✅ pass | "Preview" mode pill στο panel | — |
| 6.2 | Όρια ανάλυσης εξηγημένα | ✅ pass | "ανάλυση κανόνων/λέξεων-κλειδιών" — όχι AI | — |
| 6.3 | Δεν υπονοείται τελικό score | ✅ pass | "Τα σήματα είναι ενδεικτικά" | — |
| 6.4 | Μη λειτουργικές δυνατότητες σημασμένες | ✅ pass | "Η μετάφραση δεν εκτελείται ακόμα" | — |

## 7. Mini-Audit

| # | Στοιχείο | Κατάσταση | Απόδειξη | Προτεινόμενη Ενέργεια |
|---|----------|-----------|----------|------------------------|
| 7.1 | Generated package presentable | ✅ pass | "Συνδυασμένη ανασκόπηση" με structured output | — |
| 7.2 | "Πλαίσιο Κριτικών" banner | ✅ pass | "Τοπικά — Demo" badge | — |
| 7.3 | Go/No-Go labels understandable | ✅ pass | Go/No-Go με Ελληνική εξήγηση | — |
| 7.4 | JSON/Markdown exports safe | ✅ pass | Demo data only, no real client info | — |
| 7.5 | Δεν μοιάζει με τελική αναφορά | ⚠️ concern | Το briefing μοιάζει ολοκληρωμένο | Το "Τοπικά — Demo" badge + footer disclaimer το καλύπτουν |

## 8. Diagnostic Lab

| # | Στοιχείο | Κατάσταση | Απόδειξη | Προτεινόμενη Ενέργεια |
|---|----------|-----------|----------|------------------------|
| 8.1 | Χρήσιμο ή πολύ τεχνικό; | ✅ pass | "Εργαστήριο Διάγνωσης" ισορροπημένο | — |
| 8.2 | Safety/local labels καθαρά | ✅ pass | "Δεδομένα Επίδειξης", "Τοπικά/Demo" | — |
| 8.3 | Presets/workspace κατανοητά | ✅ pass | Accommodation, Restaurant, Beauty presets | — |
| 8.4 | Internal engineering wording | ⚠️ concern | Technical panels (observations, workspace) ορατά | Operator να παραμένει στο κύριο diagnostic flow |

## 9. Reports / Preview

| # | Στοιχείο | Κατάσταση | Απόδειξη | Προτεινόμενη Ενέργεια |
|---|----------|-----------|----------|------------------------|
| 9.1 | "Προσχέδιο αναφοράς" ορατό | ✅ pass | Admin reports section | — |
| 9.2 | "Δεν έχει σταλεί ή δημοσιευθεί" ορατό | ✅ pass | Reports section | — |
| 9.3 | Report preview presentable | ✅ pass | Structured premium design | — |
| 9.4 | Exports safe (JSON/MD) | ✅ pass | No sending capability | — |
| 9.5 | Παραπλανητική γλώσσα τελικής αναφοράς | ✅ pass | "Προσχέδιο" + "δεν έχει σταλεί" consistent | — |

## 10. Client Dashboard

| # | Στοιχείο | Κατάσταση | Απόδειξη | Προτεινόμενη Ενέργεια |
|---|----------|-----------|----------|------------------------|
| 10.1 | Client-facing view good enough for demo | ✅ pass | "Κέντρο Επιχειρησιακής Εικόνας" — premium feel | — |
| 10.2 | Admin-only controls hidden | ✅ pass | Admin link gated by `isAibisAdmin` | — |
| 10.3 | Demo/internal data leakage | ⚠️ concern | `isProspectDemoMode` hardcoded single flag controls all | 42B P0: Config-driven approach |
| 10.4 | Score/report layout credible | ✅ pass | Professional gauge and card design | — |
| 10.5 | Business switcher shows 3 businesses | ⚠️ concern | Other business names visible | Acceptable for controlled demo |

## 11. Business Score

| # | Στοιχείο | Κατάσταση | Απόδειξη | Προτεινόμενη Ενέργεια |
|---|----------|-----------|----------|------------------------|
| 11.1 | Score explanation honest | ✅ pass | "Διαγνωστική ένδειξη επιχειρησιακής εικόνας" | — |
| 11.2 | Αποφυγή fake certainty | ✅ pass | Integer score, "Ενδεικτικό" prefix | — |
| 11.3 | Εξήγηση περιορισμών δεδομένων | ⚠️ concern | Score from 3 reviews — data volume not shown | 42B P0: Data-confidence indicator |
| 11.4 | Review contribution/recalculation | ✅ pass | Score updates when reviews added (local) | — |

## 12. Safety / Trust

| # | Στοιχείο | Κατάσταση | Απόδειξη | Προτεινόμενη Ενέργεια |
|---|----------|-----------|----------|------------------------|
| 12.1 | No Supabase writes | ✅ pass | 41D QA confirmed | — |
| 12.2 | No external sync | ✅ pass | No sync claims in client UI | — |
| 12.3 | No contact sent | ✅ pass | All outreach is manual logging | — |
| 12.4 | No scraper run | ✅ pass | Not executed during review | — |
| 12.5 | No API/backend calls | ✅ pass | Fully client-side localStorage | — |
| 12.6 | No raw payloads | ✅ pass | Not exposed | — |
| 12.7 | No secrets | ✅ pass | Not exposed | — |
| 12.8 | No misleading automation claims | ✅ pass | All claims properly disclaimered | — |

## 13. Final Demo Readiness

| # | Στοιχείο | Κατάσταση |
|---|----------|-----------|
| 13.1 | Ready for controlled internal demo | ✅ |
| 13.2 | Ready for founder-led prospect demo with caveats | ✅ |
| 13.3 | Not ready for prospect demo | ❌ |
| 13.4 | Needs polish before demo | ❌ |

**Συνολική κατάσταση:** Έτοιμο για επίδειξη από τον ιδρυτή/διαχειριστή, με 4 P0 βελτιώσεις πριν από αυτοεξυπηρετούμενες επιδείξεις.

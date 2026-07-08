# Review Schema Inventory

## Περιγραφή

Καταγραφή όλων των πεδίων κριτικών, την προέλευση, αποθήκευση και χρήση τους από downstream καταναλωτές.

## Inventory Table

| # | Field | Source | Stored? | Admin List | Review Intelligence | Mini-Audit | Diagnostic Lab | Reports / Preview | Safety / Privacy Note | 40E Recommendation |
|---|-------|--------|---------|------------|-------------------|------------|----------------|-------------------|----------------------|-------------------|
| 1 | **rating** | Manual paste / Worker / Demo | ✅ `Review.rating` (number 1-5) | ✅ Displayed as stars + number | ✅ Used for sentiment, distribution, avg | ❌ Not used | ❌ Not loaded | ✅ Used in score pipeline | Safe — numeric only | P0: Add to Mini-Audit & Diagnostic Lab context |
| 2 | **review text / body** | Manual paste / Worker / Demo | ✅ `Review.body` (string) | ✅ Displayed as text card | ✅ Used for theme classification, language detection | ❌ Not used | ❌ Not loaded | ✅ Used in score pipeline | Safe — no PII expected (anonymized import) | P0: Add to Mini-Audit context via theme summary |
| 3 | **date / reviewDateLabel** | Manual paste / Worker / Demo | ✅ `Review.reviewDateLabel` (string) | ✅ Displayed as date text | ✅ Optional input | ❌ Not used | ❌ Not loaded | ✅ Passed through | Safe — human readable string | P1: Standardize date format for consistency |
| 4 | **source label** | Set during import (`Google (manual...)`, `Google (auto-imported)`, demo sources) | ✅ `Review.source` (string) | ✅ Displayed as colored badge (Χειροκίνητη/Worker/Δείγμα) | ✅ Passed as `source` field | ❌ Not used | ❌ Not loaded | ✅ Passed through | Safe — provenance metadata | P0: Preserve in all downstream consumers |
| 5 | **imported timestamp** | Set during manual paste / worker apply | ✅ `manualImportResult.timestamp` (UI state only) | ✅ Displayed in import result box | ❌ Not stored per review | ❌ Not used | ❌ Not used | ❌ Not used | Safe — system metadata | P0: Store as `Review.importedAt` field |
| 6 | **business name** | Selected business in AdminDashboard | ✅ Linked via `Review.businessId` → `Business.id` | ✅ Shown in review card header | ✅ Passed as `businessName` | ✅ Used (from CRM lead, NOT from review) | ✅ Used (from workspace, NOT from review) | ✅ Used in report header | Safe — business identifier | P0: Connect review context to CRM lead via business name |
| 7 | **reviewer name** | Manual paste: "Google χρήστης" (hardcoded); Worker: "Google χρήστης" (mapped); Demo: real names (Eleni P., Marco R.) | ✅ `Review.authorName` (string) | ✅ Displayed as author label | ❌ Not used (mapped as `unstableIdentity: true`) | ❌ Not used | ❌ Not used | ✅ Used as `author` | ⚠️ Demo data has real names; imported reviews are anonymized | Keep current behavior — do NOT store real reviewer names from imports |
| 8 | **review id** | Generated during import (`google_manual_${now}_...`, `google_imported_${id}_...`); Demo: pre-assigned | ✅ `Review.id` (string) | ✅ Used as React key | ✅ Passed as `reviewId` | ❌ Not used | ❌ Not used | ❌ Not used | Safe — internal identifier | P1: Use for cross-path dedup |
| 9 | **profile URL / avatar** | NOT stored for imported or demo reviews | ❌ Not stored | ❌ Not displayed | ❌ Not used | ❌ Not used | ❌ Not used | ❌ Not used | ✅ SAFE — never stored | Forbidden: Do NOT add profile URL/avatar storage |
| 10 | **duplicate key / dedup basis** | Manual: body text hash; Pipeline: reviewId + content hash; Worker: reported as count | ❌ Not stored per review | ❌ Not displayed | ❌ Not used | ❌ Not used | ❌ Not used | ❌ Not used | Safe — internal | P1: Store dedup basis hash per review for cross-import dedup |
| 11 | **sentiment** | Set during import: "neutral" (default for manual/worker); Demo: "good"/"watch" per seed | ✅ `Review.sentiment` (StatusTone) | ✅ Displayed as sentiment chip | ✅ Used as input | ❌ Not used | ❌ Not used | ✅ Used as `sentiment` | Safe — computed classification | P0: Add to Diagnostic Lab findings |
| 12 | **status** | Default: "new" for imported reviews; Demo: "queued" | ✅ `Review.status` (optional) | ✅ Displayed with filter chips | ❌ Not used | ❌ Not used | ❌ Not used | ❌ Not used | Safe — workflow state | No change needed |
| 13 | **suggestedReply / ownerResponse** | Manual paste: empty string; Worker: `ownerReply` from import; Demo: default text | ✅ `Review.suggestedReply` (optional) | ✅ Displayed in review detail | ✅ Used for owner response coverage calculation | ❌ Not used | ❌ Not used | ❌ Not used | Safe — draft text | No change needed |
| 14 | **priorityFlag** | Default: "normal" for manual/worker; Demo: "high" for watch sentiment | ✅ `Review.priorityFlag` (optional) | ✅ Displayed as priority chip | ❌ Not used | ❌ Not used | ❌ Not used | ❌ Not used | Safe — workflow flag | No change needed |
| 15 | **replyStatus** | Manual paste: "queued"; Worker: based on ownerReply presence; Demo: "queued" | ✅ `Review.replyStatus` | ✅ Displayed in review actions | ❌ Not used | ❌ Not used | ❌ Not used | ❌ Not used | Safe — workflow state | No change needed |
| 16 | **publicReviewerLabel** | NOT set for imported reviews; Demo: undefined | ✅ `Review.publicReviewerLabel` (optional) | ❌ Not displayed in current UI | ❌ Not used | ❌ Not used | ❌ Not used | ✅ Passed through if set | Safe — optional label | No change needed |
| 17 | **language** | Worker: detected by import pipeline; Demo: NOT stored | ❌ NOT stored in domain Review | ❌ Not displayed | ✅ Detected by `reviewLanguageDetector` from text | ❌ Not used | ❌ Not used | ❌ Not used | Safe — metadata | P1: Store detected language in domain Review |
| 18 | **themes / complaintTags / praiseTags** | NOT stored in domain Review (computed by Review Intelligence on the fly) | ❌ NOT stored | ❌ Not displayed | ✅ Computed by `reviewThemeClassifier` from text | ❌ Not used | ❌ Not used | ❌ Not used | Safe — computed, not stored | P1: Cache themes in Review for faster downstream access |
| 19 | **evidenceUrl** | NOT stored for any review type | ❌ NOT stored | ❌ Not displayed | ❌ Not used | ❌ Not used | ❌ Not used | ❌ Not used | Safe — would be external URL | Forbidden: Do NOT add URL storage |
| 20 | **importId** | Pipeline import only (ReviewImportSanitizedReview) | ❌ NOT stored in domain Review | ❌ Not displayed | ❌ Not used | ❌ Not used | ❌ Not used | ❌ Not used | Safe — internal tracking | No change needed |

## Summary

| Category | Count |
|----------|-------|
| Total fields identified | 20 |
| Stored in domain Review | 16 |
| Displayed in admin list | 13 |
| Used by Review Intelligence | 8 |
| Used by Mini-Audit | 0 |
| Used by Diagnostic Lab | 0 |
| Used by Reports/Preview | 8 |
| Safety concerns found | 0 (all safe) |
| Fields recommended for P0 | 6 |
| Fields recommended for P1 | 4 |
| Fields forbidden for 40E | 2 |

## Legend

- ✅ = Connected / stored / used
- ❌ = Not connected / not stored / not used
- ⚠️ = Partial or caution needed
- P0 = Must implement in 40E
- P1 = Should implement in 40E

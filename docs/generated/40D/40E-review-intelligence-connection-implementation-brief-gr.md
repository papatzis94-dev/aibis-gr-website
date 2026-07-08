# 40E Implementation Brief — Review Intelligence / Mini-Audit Connection

## Overview

Minimal implementation scope to connect imported/manual reviews to downstream consumers. All changes are local-only, no API/Supabase/backend modifications.

## Recommended P0 (Must Have)

### 1. Connect Reviews to Mini-Audit Context

**Problem**: Mini-Audit generates outreach angles without any review context (ratings, themes, sentiment).

**Implementation**:
- Pass review summary (count, avg rating, top 3 negative themes, top 3 positive themes) to `miniAuditPackageBuilder`
- Add a "Review Context" section to `MiniAuditPackagePanel` showing:
  - Number of imported reviews
  - Average rating
  - Top positive/negative themes (from existing Review Intelligence)
  - Source label (Χειροκίνητη/Worker/Δείγμα)
- All data from existing `Review[]` in AdminDashboard state, computed client-side

**Files to touch**:
- `src/pages/admin/AdminDashboard.tsx` — pass review data to Mini-Audit section
- `src/services/clientOnboarding/miniAuditPackageBuilder.ts` — accept review context
- `src/components/admin/outreach/MiniAuditPackagePanel.tsx` — display review context

### 2. Connect Reviews to Diagnostic Lab

**Problem**: Diagnostic Lab has no awareness of existing review data — it starts from zero even when the admin has already imported and analyzed reviews.

**Implementation**:
- In `AdminDiagnosticLab.tsx`, load reviews from `localDataStore` for the selected business
- Call existing `buildReviewDiagnosticBridge` with review data
- Display review-based diagnostic signals in the findings board
- Add a "Review Analysis" section showing:
  - Number of reviews available
  - Source breakdown (manual/worker/demo)
  - Key themes found
  - Owner response coverage
- Add source badge per signal

**Files to touch**:
- `src/pages/admin/AdminDiagnosticLab.tsx` — import review data, call bridge
- `src/components/admin/diagnostic-lab/DiagnosticFindingsBoard.tsx` — show review signals
- `src/diagnostic-engine/reviewIntelligence/buildReviewDiagnosticBridge.ts` — ensure API is callable

### 3. Auto-Recalculate Business Score on Import

**Problem**: Business Score is static and not recalculated when new reviews are imported.

**Implementation**:
- After successful manual paste or worker import, trigger `buildAibisScoreDraft` from existing `mapAdminStateToScorePreviewInput.ts`
- Update `businessScores[]` in `EditableAibisData` with the new score
- Show a "Score Updated" indicator after import

**Files to touch**:
- `src/pages/admin/AdminDashboard.tsx` — call score builder after import
- `src/pages/admin/mapAdminStateToScorePreviewInput.ts` — ensure function is reusable

### 4. Preserve Source Labels in All Consumers

**Problem**: Source labels (Χειροκίνητη/Worker/Δείγμα) are only displayed in the admin review list.

**Implementation**:
- Ensure all downstream consumers receive `Review.source` and display it via `getSourceLabel` or equivalent
- Mini-Audit context: show source badge
- Diagnostic Lab: show source badge per review signal
- Report Preview: include source breakdown summary

**Files to touch**: Same as P0 items 1-3 — integrate source label display in each

### 5. Add Local-Only Safety Labels

**Problem**: Users may not realize all analysis is local-only.

**Implementation**:
- Add a small badge/label on all review-connected panels: "Τοπική ανάλυση — κανένα δεδομένο δεν αποστέλλεται"
- Mini-Audit context: "Τα δεδομένα κριτικών είναι τοπικά"
- Diagnostic Lab: "Οι κριτικές αναλύονται τοπικά"

**Files to touch**: All affected panels

## Recommended P1 (Should Have)

### 1. Review Completeness Summary in Report Preview

**Problem**: Report Preview doesn't show how many reviews were analyzed or their source.

**Implementation**:
- Add a summary section in the admin Report Preview showing:
  - Total review count
  - Breakdown by source (manual/worker/demo)
  - Date range of reviews
  - Sample quality note (e.g., "N κριτικές — επαρκές δείγμα" or "Λίγες κριτικές — τα αποτελέσματα ενδέχεται να μην είναι αντιπροσωπευτικά")

### 2. CRM Lead Review Context Indicator

**Problem**: CRM leads show no indication of whether reviews exist for that business.

**Implementation**:
- In `AdminCrm.tsx`, for each lead, try to find a matching business by `businessName`
- If `reviews` exist for that business, show a small chip: "📋 N κριτικές | ⭐ X.X"
- Make it clickable to navigate to AdminDashboard with that business selected

### 3. Cross-Path Dedup

**Problem**: Same review can be imported via manual paste AND worker, creating duplicates.

**Implementation**:
- Store a content hash (`body.toLowerCase().trim()`) on each review
- On manual paste or worker import, check against ALL existing reviews (not just same-source)
- Report cross-source duplicates in the import result

### 4. Client-Facing Reports Imported Review Awareness

**Problem**: Client-facing Reports.tsx may not show imported reviews.

**Implementation**:
- If the admin has imported reviews (localStorage), surface them in the client-facing reports view
- This requires the client Reports page to read from localStorage as fallback

## Forbidden Scope

- ❌ Supabase migration or API changes
- ❌ Backend / API changes
- ❌ External scraping API or Google sync
- ❌ Raw payload storage (profile URLs, avatars, reviewer PII)
- ❌ Contact / outreach functionality
- ❌ Public website changes
- ❌ Auth / role changes
- ❌ Package additions
- ❌ .env file changes
- ❌ Deployment
- ❌ Network calls

## Implementation Approach

All P0 items follow the same pattern:
1. **Read** reviews from existing `EditableAibisData.reviews[]` (already in localStorage)
2. **Compute** summary/insights using existing engine functions (already built)
3. **Pass** as props/context to downstream components
4. **Display** with source badge and safety labels

No new data stores. No new API calls. No new dependencies.

## Effort Estimate (relative)

| Item | Complexity | Files Touched |
|------|-----------|---------------|
| P0.1 Mini-Audit review context | Medium | 3 files |
| P0.2 Diagnostic Lab review signals | Medium | 3 files |
| P0.3 Auto-recalculate score | Small | 1-2 files |
| P0.4 Source labels in consumers | Small | Same as above |
| P0.5 Safety labels | Small | Same as above |
| P1.1 Report completeness summary | Medium | 2-3 files |
| P1.2 CRM review indicator | Medium | 2 files |
| P1.3 Cross-path dedup | Medium | 1-2 files |
| P1.4 Client Reports sync | Large | 3-4 files |

## Verdict

**40E scope is well-defined and feasible within the local-only constraint.**
All P0 items are safe, deterministic, and use existing infrastructure.
No architecture changes needed — purely data plumbing and UI display.

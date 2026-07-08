# Review Data Flow Map

## Overview

Χάρτης ροής δεδομένων κριτικών από την εισαγωγή έως τους καταναλωτές.

## Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        REVIEW INGESTION                          │
│                                                                  │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │ Manual Paste        │  │ Worker Import    │  │ Demo Seed  │ │
│  │ (AdminDashboard)    │  │ (Worker Server)  │  │ (mockDB)   │ │
│  │ → Parse text        │  │ → Puppeteer      │  │ → 9 reviews│ │
│  │ → Rating/Date/Body  │  │ → Google Maps    │  │ → 3 biz    │ │
│  │ → Source: manual    │  │ → Source: auto    │  │ → Source:  │ │
│  └──────────┬──────────┘  └────────┬─────────┘  │   varied   │ │
│             │                      │            └──────┬──────┘ │
│             └──────────────────────┴───────────────────┘        │
│                                        │                        │
│                                        ▼                        │
│                         ┌──────────────────────┐               │
│                         │  localStorage         │               │
│                         │  aibis.clientDashboard│               │
│                         │  .localData.v1        │               │
│                         │  → reviews: Review[]  │               │
│                         │  → filtered by bizId  │               │
│                         └──────────────────────┘               │
│                                        │                        │
│                                        ▼                        │
│                         ┌──────────────────────┐               │
│                         │  Admin Review List    │               │
│                         │  (AdminDashboard)     │               │
│                         │  → Card per review    │               │
│                         │  → Source badge       │               │
│                         │  → Rating, body, date │               │
│                         │  → Status/Reply mgmt  │               │
│                         └──────────────────────┘               │
└──────────────────────────────────────────────────────────────────┘

                              │
                              ▼
                    ┌─────────────────┐
                    │  REVIEW         │
                    │  INTELLIGENCE   │
                    │  ✦ CONNECTED ✓  │
                    │                 │
                    │  mapAdminReviews │
                    │  ToIntelligence  │
                    │  Input() →       │
                    │  buildReviewInte-│
                    │  lligence()      │
                    │                 │
                    │  → Themes       │
                    │  → Sentiment    │
                    │  → Score-ready  │
                    │    signals      │
                    │  → Diagnostic   │
                    │    bridge       │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  MINI-AUDIT  │  │ DIAGNOSTIC   │  │ REPORTS /    │
   │  ✦ NOT       │  │ LAB          │  │ PREVIEW      │
   │    CONNECTED │  │ ✦ NOT        │  │ ✦ CONNECTED  │
   │    ✗         │  │   CONNECTED  │  │   ✓ (admin)  │
   │              │  │   ✗          │  │              │
   │  CRM leads → │  │ Own pipeline │  │ scorePipeline│
   │  outreach    │  │ No review    │  │ → Intelligence│
   │  No reviews  │  │ awareness    │  │ → Score Draft │
   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
          │                 │                 │
          ▼                 ▼                 ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  CRM LEAD    │  │ (gap: no     │  │ Business     │
   │  CONTEXT     │  │ review-based │  │ Score        │
   │  ✦ NOT       │  │ diagnostic   │  │ ✦ INDIRECT   │
   │    CONNECTED │  │ signals)     │  │   ✓          │
   │    ✗         │  │              │  │              │
   │  No review   │  │ Manual Data  │  │ scoreDraft   │
   │  visibility  │  │ Intake only  │  │ can consume  │
   └──────────────┘  └──────────────┘  │ but not auto │
                                        │ recalculated │
                                        └──────────────┘
```

## Step-by-Step Analysis

### Step 1: Manual Paste / Worker Import → Admin Review List

**Connected now?** ✅ Yes

| Aspect | Details |
|--------|---------|
| Data source | AdminDashboard state → localStorage `aibis.clientDashboard.localData.v1` |
| Data fields | `id`, `businessId`, `authorName`, `rating`, `source`, `reviewDateLabel`, `body`, `sentiment`, `status`, `suggestedReply`, `priorityFlag`, `replyStatus` |
| Filtering | Filtered by `businessId === selectedBusiness?.id` |
| Display | Card with source badge (Χειροκίνητη/Worker/Δείγμα), rating stars, body text, date, status chips |
| Dedup | Within-import only (body Set for manual, worker reports count) |
| Risk | No cross-path dedup (manual vs worker could produce duplicate reviews) |
| **40E recommendation** | Add cross-path dedup check on import: compare body text hash against existing reviews from any source |

### Step 2: Admin Review List → Review Intelligence

**Connected now?** ✅ Yes

| Aspect | Details |
|--------|---------|
| Data source | Same `reviews: Review[]` from admin state |
| Data fields | `reviewId`, `rating`, `text` (from `body`), `date` (from `reviewDateLabel`), `ownerResponse` (from `suggestedReply`), `source` |
| Missing fields | None critical for analysis |
| Current behavior | Keyword-based theme classification, sentiment mapping, language detection, owner response coverage, score-ready signal building |
| Risk | `unstableIdentity: true` for all reviews — safe but means no reviewer identity tracking |
| **40E recommendation** | Already connected — no changes needed. Recommend adding a "sample reliability" indicator based on count of imported reviews vs demo. |

### Step 3: Review Intelligence → Mini-Audit

**Connected now?** ❌ No

| Aspect | Details |
|--------|---------|
| Data source (current) | CRM leads only (`businessName`, `category`, `vertical`) |
| Fields available | Review count, avg rating, theme clusters, sentiment distribution, owner response gaps |
| Missing fields | Everything review-related |
| Risk/confusion | Outreach angles are generated without any customer feedback context. A business with urgent negative reviews gets the same generic pitch as one with perfect reviews. |
| **40E recommendation** | **P0**: Pass review summary (count, avg rating, top 3 negative themes, top 3 positive themes) as context to `miniAuditPackageBuilder`. Add a "Review Context" badge to the Mini-Audit Package UI. |

### Step 4: Review Intelligence → Diagnostic Lab

**Connected now?** ❌ No

| Aspect | Details |
|--------|---------|
| Data source (current) | Manual input + CRM lead prefill |
| Fields available | `ReviewDiagnosticBridgeResult` (themes, signals, recommendations) |
| Missing fields | The `buildReviewDiagnosticBridge` function exists and produces diagnostic signals, but Diagnostic Lab never calls it |
| Risk/confusion | Diagnostic Lab findings may miss review-based signals (e.g., "multiple negative reviews about service speed" or "owner not responding to reviews") |
| **40E recommendation** | **P0**: In Diagnostic Lab's workspace pipeline, call `buildReviewDiagnosticBridge` if reviews exist for the selected business. Display review-based diagnostic signals in the findings board. Add source badge (Χειροκίνητη/Worker/Δείγμα) per signal. |

### Step 5: Diagnostic Lab → Reports / Preview

**Connected now?** ✅ Yes (admin-side) / ❌ Partial (client-side)

| Aspect | Details |
|--------|---------|
| Data source (admin) | `mapAdminStateToScorePreviewInput.ts` → score draft → report preview |
| Data source (client) | `useActiveProfile()` → mock/Supabase data |
| Fields used (admin) | All review fields via intelligence pipeline |
| Fields used (client) | `author`, `rating`, `source`, `date`, `text`, `sentiment` |
| Missing fields (client) | Imported reviews may not appear if profile data is from mock/Supabase rather than localStorage |
| Risk/confusion | Client-facing reports may show empty or outdated review data while admin has rich imported data |
| **40E recommendation** | **P1**: Surface a "review completeness" summary in the admin Report Preview showing count, source breakdown, and sample quality indicator |

### Step 6: Business Score

**Connected now?** ⚠️ Indirect

| Aspect | Details |
|--------|---------|
| Data source | `EditableAibisData.businessScores[]` — static stored score |
| Integration path | Score draft pipeline CAN consume review intelligence, but score is NOT automatically recalculated on import |
| Fields used | Score value, stage, trend, calculatedAt |
| Missing | Live recalculation trigger after import |
| Risk/confusion | User imports 10 negative reviews but the Business Score still shows the old optimistic value |
| **40E recommendation** | **P0**: After successful review import (manual paste or worker), trigger `buildAibisScoreDraft` and update the stored score. Show a "score updated with reviews" indicator. |

### Step 7: CRM Lead

**Connected now?** ❌ No

| Aspect | Details |
|--------|---------|
| Data source | `aibis_crm_leads` — no review data |
| Business name linking | Possible via `businessName` → `businessId` lookup, but not implemented |
| Fields available for connection | Review count, avg rating, worst/best review, negative themes |
| Risk/confusion | CRM user has no visibility into whether the business already has analyzed reviews |
| **40E recommendation** | **P1**: Show a small review summary chip on CRM lead cards: "📋 N κριτικές | ⭐ X.X μέσος όρος" if reviews exist for a matching business. |

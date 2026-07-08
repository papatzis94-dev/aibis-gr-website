# 40D — Review Intelligence / Mini-Audit Connection Review

## Purpose

Review how imported/manual Google reviews currently flow through the app and identify gaps between review ingestion and downstream consumers (Review Intelligence, Mini-Audit, Diagnostic Lab, Reports/Preview, Business Score, CRM).

## Founder Problem Statement

Manual paste review ingestion now works and is the reliable workflow (40C). But imported reviews currently appear mainly in the admin review list and are not clearly connected to:

- Review Intelligence
- Mini-Audit Package
- Diagnostic Lab
- Reports / Preview
- AIBIS Business Score
- CRM lead context

This milestone is REVIEW ONLY. No source files modified.

## Current Review Ingestion Store Map

```
┌─────────────────────────────────────────────────────────────────────┐
│ localStorage: "aibis.clientDashboard.localData.v1"                  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ EditableAibisData {                                           │  │
│  │   businesses: Business[]                                      │  │
│  │   locations: BusinessLocation[]                               │  │
│  │   reviews: Review[]                    ← ALL REVIEWS HERE    │  │
│  │   businessScores: BusinessScore[]                             │  │
│  │   insights: BusinessInsight[]                                 │  │
│  │   servicesOffered: BusinessService[]                          │  │
│  │   teamMembers: TeamMember[]                                   │  │
│  │ }                                                             │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  All data persisted as one JSON blob under a single key.            │
│  No separate review-specific localStorage key exists.              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Admin UI State (localStorage keys):                                 │
│   "aibis-admin-active-section"         → active tab                │
│   "aibis-admin-selected-business-id"   → selected business ID      │
│                                                                     │
│ Other app state keys (unrelated to reviews):                        │
│   "aibis_demo_role"                     → demo auth role           │
│   "aibis_demo_email"                    → demo email               │
│   "aibis:onboarding:v1:*"              → onboarding drafts         │
│   "aibis_mini_audit_packages"           → mini-audit packages      │
│   "aibis_crm_leads"                     → CRM leads                │
│   "aibis_diagnostic_workspaces"         → diagnostic workspaces    │
│   (and many other onboarding/sandbox keys)                         │
└─────────────────────────────────────────────────────────────────────┘
```

## Imported Review Schema (domain `Review`)

```typescript
interface Review {
  id: string;                  // e.g. "google_manual_1749300000_0_abc12"
  businessId: string;          // FK to business
  authorName: string;          // "Google χρήστης" for imported, "Eleni P." for demo
  rating: number;              // 1-5
  source: string;              // source provenance label
  reviewDateLabel: string;     // human-readable date string
  body: string;                // review text content
  sentiment: StatusTone;       // "good" | "watch" | "risk" | "neutral"
  status?: "new" | "queued" | "replied" | "archived";
  suggestedReply?: string;     // owner reply draft
  priorityFlag?: "low" | "normal" | "high";
  replyStatus: "queued" | "drafted" | "not_needed";
  publicReviewerLabel?: string;
}
```

## localStorage Keys

| Key | Scope | Contains |
|-----|-------|----------|
| `aibis.clientDashboard.localData.v1` | All app data | `reviews: Review[]` + businesses, scores, etc. |
| `aibis-admin-active-section` | Admin UI | Active tab name |
| `aibis-admin-selected-business-id` | Admin UI | Currently selected business ID |
| `aibis_crm_leads` | CRM | `CrmLead[]` — no review data |
| `aibis_mini_audit_packages` | Mini-Audit | `MiniAuditPackage[]` — no review data |
| `aibis_diagnostic_workspaces` | Diagnostic Lab | Workspace snapshots — no review data |

## Source Labels

Source labels are stored in `Review.source` as a free-text string. The UI categorizes them via `getSourceLabel()` keyword matching:

| Source String Value | Badge Label | Badge Color | Origin |
|---------------------|-------------|-------------|--------|
| `Google (manual sanitized import)` | Χειροκίνητη | #f0ad4e (yellow) | Manual paste in AdminDashboard |
| `Google (auto-imported)` | Worker | #5cb85c (green) | Worker auto-import |
| `Google` | Δείγμα | #5bc0de (blue) | Demo seed data |
| `Trip προφίλ` | Trip προφίλ | #888 (gray) | Demo seed data |
| `Instagram μήνυμα` | Instagram μήνυμα | #888 (gray) | Demo seed data |
| `Booking προφίλ` | Booking προφίλ | #888 (gray) | Demo seed data |
| `manual_import` | Worker | #5cb85c (green) | Import pipeline default |
| `plain_paste_import` | Worker | #5cb85c (green) | Plain text import |

All imported reviews (manual paste + worker) are tagged with `authorName: "Google χρήστης"` to anonymize. Demo reviews retain original author names.

## Dedup Behavior

| Ingestion Path | Dedup Method | Dedup Basis | Reports Duplicates? |
|----------------|-------------|-------------|---------------------|
| Manual paste | `Set` of existing review bodies | `body.trim().toLowerCase()` | Yes: `manualImportResult.duplicates` |
| Worker auto-import | Worker-side (frontend trusts result) | Worker reports `duplicateCount` | Yes: `reviewGenResult.duplicateCount` |
| Import pipeline (ReviewImportPackagePanel) | 2-layer: reviewId + content hash | `reviewId` OR `sanitizedText + rating + dateLabel` | Yes: `parsedData.duplicateCount` |
| Across ingestion paths | **NONE** — no cross-path dedup | — | — |

**Gap**: Manual paste and worker imports are not deduplicated against each other. The same review could be pasted manually and then imported via worker, resulting in duplicates with different IDs.

## Review Intelligence Connection Status

**Status: CONNECTED (local, deterministic, keyword-based)**

The connection is already live in AdminDashboard.tsx ~line 1950:
```tsx
<ReviewIntelligencePreviewPanel reviews={reviews} businessName={selectedBusiness?.name || ""} />
```

Data flow:
```
AdminDashboard.reviews (from localStorage)
  → mapAdminReviewsToIntelligenceInput(reviews)
    → SanitizedReviewInput[]
  → buildReviewIntelligence({ reviews, businessName, sourceLabel })
    → ReviewIntelligenceResult (themes, patterns, score-ready signals)
  → buildReviewDiagnosticBridge(intelligence, { businessName })
    → ReviewDiagnosticBridgeResult (preview signals, recommendations)
  → Displayed in ReviewIntelligencePreviewPanel
```

Fields used by Review Intelligence:
- `reviewId` — tracking
- `rating` — sentiment analysis, distribution
- `body` (mapped to `text`) — theme classification, language detection
- `reviewDateLabel` (mapped to `date`) — optional
- `suggestedReply` (mapped to `ownerResponse`) — owner response coverage
- `source` — source tracking

**Risk**: `identitySource` and `unstableIdentity` are mapped as `undefined` / `true` respectively, meaning all imported reviews are treated as "unstable identity" (privacy-safe default). This is correct for imported reviews where reviewer identity is stripped.

**All analysis is deterministic keyword/rule-based** — no AI, no external API calls.

## Mini-Audit Connection Status

**Status: NOT CONNECTED**

The Mini-Audit Package (`MiniAuditPackagePanel.tsx`) generates outreach briefing packages from CRM leads (`businessName`, `category`, `vertical`). It does NOT consume review data at all.

Current data flow:
```
CRM Leads (localStorage: "aibis_crm_leads")
  → MiniAuditPackagePanel
  → miniAuditPackageBuilder.build(businessName, vertical)
    → Generates: Target section, Contact section, Angle section,
                 Outreach Package section, Go/No-Go summary
  → Stored in: localStorage "aibis_mini_audit_packages"
```

**Gap**: Mini-Audit has no awareness of:
- How many reviews the business has
- Review ratings distribution
- Review themes or sentiment
- Whether reviews indicate urgency (negative themes, response gaps)

**This means the outreach angle is generated without any actual customer feedback context.**

## Diagnostic Lab Connection Status

**Status: NOT DIRECTLY CONNECTED**

Diagnostic Lab (`AdminDiagnosticLab.tsx`) creates its own diagnostic workspace pipeline. It does NOT load reviews from the main data store. It can prefill from CRM leads via URL param (`?crmLeadId=`) but does not access reviews.

Current data flow:
```
Manual Input / CRM Lead
  → Diagnostic Lab workspace (localStorage: "aibis_diagnostic_workspaces")
  → ManualDataIntake, diagnostic pipeline
  → Findings, actions, report sections
  → Report preview
```

**Gap**: Diagnostic Lab cannot display:
- How many imported reviews exist for the business
- Review intelligence summary (themes, sentiment)
- Whether review data is available to inform diagnosis
- Review-based diagnostic signals

**Note**: The `buildReviewDiagnosticBridge` function exists and is used by Review Intelligence. It is designed to produce diagnostic signals from reviews, but Diagnostic Lab does not call it.

## Reports / Preview Connection Status

**Status: CONNECTED (via score preview pipeline)**

AdminDashboard's score preview pipeline (`mapAdminStateToScorePreviewInput.ts`) connects reviews to reports:

```
AdminDashboard.reviews
  → mapAdminReviewsToIntelligenceInput
  → buildReviewIntelligence
  → buildReviewDiagnosticBridge
  → buildMultiSourceDiagnosticBridge
  → buildAibisScoreDraft
  → Score preview + Report preview
```

The client-facing `Reports.tsx` page also displays reviews via `getBusinessReviewsForPreview()`, which reads from the same data store.

**Gap**: The client-facing Reports page only shows reviews from `useActiveProfile()`, which reads from the mock/supabase data layer — NOT from the admin's localStorage reviews. The admin-side preview pipeline works, but client-facing reports may not show imported reviews unless they are also synced to the profile.

**Gap**: Report preview does NOT display a "review completeness" summary — it doesn't tell the user how many reviews were analyzed, what their source is, or whether the sample is statistically meaningful.

## AIBIS Business Score Connection Status

**Status: INDIRECTLY CONNECTED**

The Business Score engine can consume `ReviewIntelligenceResult` via the score draft pipeline (see Reports above). The score is stored in `EditableAibisData.businessScores[]`.

However:
- The `BusinessScoreCard.tsx` component reads the stored score from the data store
- It does NOT dynamically recalculate from reviews
- The score is set via `updateScore()` in AdminDashboard, or created via `createScore()` on business creation
- The score→review connection is **present in the engine architecture** but **not surfaced in the UI**

**Risk**: Users may see a static Business Score that does not reflect the actual imported reviews, because the score is not automatically recalculated when new reviews are imported.

## CRM / Business Context Connection Status

**Status: NOT CONNECTED**

CRM (`AdminCrm.tsx`, `localCrmStore.ts`) manages leads independently from reviews:

| Feature | Has Review Context? |
|---------|---------------------|
| CRM Lead list | No |
| CRM Lead detail | No |
| CRM → Diagnostic Lab handoff | No review data passed |
| CRM → Mini-Audit handoff | No review data passed |
| Business name linking | Yes (`businessName` field) — but purely textual |

**Gap**: When viewing a CRM lead, there is no indication of:
- Whether reviews have been imported for this business
- Review volume or rating
- Whether review intelligence analysis is available
- Whether the lead should be prioritized based on review sentiment

The business name in CRM leads could be used to correlate with `reviews[].businessId`, but this lookup is not implemented anywhere.

## Workflow Gaps Summary

| # | Gap | Severity | Affected Component |
|---|-----|----------|-------------------|
| 1 | Mini-Audit generates angles without review context | **High** | MiniAuditPackagePanel |
| 2 | Diagnostic Lab has no review data awareness | **High** | AdminDiagnosticLab |
| 3 | Client-facing Reports may not show imported reviews | **Medium** | Reports.tsx |
| 4 | Static Business Score not auto-updated on import | **Medium** | BusinessScoreCard |
| 5 | CRM leads invisible to review context | **Low** | AdminCrm |
| 6 | Cross-path dedup missing (manual vs worker) | **Low** | AdminDashboard |
| 7 | No review completeness/sample summary for downstream | **Medium** | All consumers |
| 8 | Review Intelligence already connected ✓ | None | Already works |
| 9 | Admin report preview pipeline works ✓ | None | Already works |

## Safety Findings

| Finding | Safe? | Notes |
|---------|-------|-------|
| Imported reviews anonymize `authorName` to "Google χρήστης" | ✅ | Privacy-safe by default |
| Review Intelligence sets `unstableIdentity: true` for all reviews | ✅ | Prevents identity-based assumptions |
| No raw Google payloads stored in localStorage | ✅ | Only parsed fields |
| No profile URLs, avatars, or reviewer IDs stored for imported reviews | ✅ | Stripped during import |
| `identitySource` is `undefined` (not set) | ✅ | Safe default |
| Manual paste parses only rating/date/body | ✅ | No PII exposure |
| All analysis is deterministic, local, no API calls | ✅ | No data leakage |
| Source labels preserved in Review Intelligence input | ✅ | Traceable |
| Dedup prevents duplicate storage (within same import) | ✅ | Reduces confusion |

**No safety blockers found.** All current handling is privacy-safe and local-only.

## Recommended 40E Implementation Scope

### P0 (Must have for connection)
1. **Connect reviews to Mini-Audit context**: Add review summary (count, avg rating, top themes) to the Mini-Audit Package builder input, so outreach angles reflect actual customer feedback.
2. **Connect reviews to Diagnostic Lab**: Import the existing `buildReviewDiagnosticBridge` into Diagnostic Lab's workspace pipeline, so review-based diagnostic signals appear in findings.
3. **Auto-recalculate Business Score on import**: After successful review import, trigger score recalculation so the score reflects the latest review data.
4. **Preserve source labels throughout all consumers**: Ensure every downstream display shows whether reviews are manual/worker/demo.
5. **Add local-only safety labels**: Mark all connections as "local analysis — no data sent externally" in the UI.

### P1 (Should have)
1. **Review completeness summary in Report Preview**: Show count, source breakdown, and sample quality indicator before the user generates a report.
2. **CRM lead review context indicator**: In CRM lead list/detail, show whether reviews have been imported and basic stats (count, avg rating).
3. **Client-facing Reports imported review awareness**: If reviews are imported for the business, surface them in the client-facing reports view.

### Excluded / Forbidden
- Supabase migration or API
- Backend/API changes
- External scraping or sync
- Raw payload storage (profile URLs, avatars, reviewer PII)
- Contact/outreach
- Public website changes
- Auth/role changes
- Package additions

## Explicit Non-Goals

- Do NOT implement the connection (this is review only)
- Do NOT modify source files
- Do NOT change stores
- Do NOT change Review Intelligence logic (already connected)
- Do NOT change Mini-Audit builder logic
- Do NOT change Diagnostic Lab logic
- Do NOT change CRM logic
- Do NOT change Supabase/RLS/SQL/backend/API
- Do NOT add network calls
- Do NOT run scraper
- Do NOT contact any business
- Do NOT deploy
- Do NOT add packages
- Do NOT touch .env files

## No Source Changes Confirmation

**Confirmed**: No source files (.ts, .tsx, .js, .mjs, .json, .css) have been modified during this review. Only documentation files in `docs/` and a QA script in `scripts/` have been created.

---

*40D — Review Intelligence / Mini-Audit Connection Review — complete.*
*Next: 40E — Review Intelligence / Mini-Audit Connection Implementation*

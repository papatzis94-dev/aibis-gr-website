# AIBIS.gr Premium Evolution Audit

## Executive Summary

| Item | Verdict |
|---|---|
| **aibis.gr current state** | Premium static marketing site — mature visual identity, strong diagnosis-first positioning |
| **app.aibis.gr current state** | Mature local-first dashboard MVP — production-ready UI, 10+ routes, premium design system |
| **Gap** | Public site still presents the dashboard as a "future roadmap" — undermines actual readiness |
| **Recommendation** | Evolution, not redesign. Reposition from "audit service" to "audit + Command Center subscription" |
| **Action** | Analysis only (this document). No files changed, no commits, no deployments. |

---

## 1. Current Strengths of aibis.gr

### 1.1 Positioning & Messaging
- **Diagnosis-first approach** is clear: hero text says "Βρίσκουμε πού χάνει ευκαιρίες η επιχείρησή σας online — και το διορθώνουμε πρακτικά."
- **"Δεν είμαστε άλλη μία web agency"** section is one of the strongest differentiators — the comparison table between "κλασική προσέγγιση" vs "AI Business Intelligence approach" is effective.
- Professional, cautious language throughout — no fake promises about revenue or rankings.
- Clear disclaimer on pricing (no guarantees).

### 1.2 Visual Identity
- Dark navy/black cinematic background with cyan/electric blue glow accents — consistent with AIBIS brand.
- Glassmorphism cards throughout.
- The interactive **"Diagnostic Engine" scanner** in the hero section is a signature visual — animated score ring, opportunity feed, scan modules, orbital UI.
- GSAP-powered word-level headline animation, parralax, card hover light tracking — premium quality.
- Full `prefers-reduced-motion` support.

### 1.3 Content Architecture
- Hero → Problem → Positioning → What we analyze → Pricing → Demo audit → Process → Roadmap → Contact
- Logical flow from awareness to diagnosis to solution.
- Demo Audit (Marina Yacht Club) provides concrete example of output.
- 6 "leak" cards clearly articulate the problems AIBIS solves.

### 1.4 Technical
- No CDN dependencies — all vendor files local.
- Semantic HTML with ARIA labels.
- Clean CSS custom properties design system.
- Responsive at 1080px and 720px breakpoints.
- Mobile-friendly design.

---

## 2. Weaknesses / Outdated Sections

### 2.1 Critical: The Roadmap Section
**File:** `aibis_custom_site_v8_2_motion_polish/index.html` lines 339-361

```html
<p class="eyebrow">Roadmap / vision</p>
<h2>Το μελλοντικό AIBIS Business Command Center</h2>
<p>Μελλοντικά, η AIBIS μπορεί να εξελιχθεί σε dashboard... Αυτό αποτελεί roadmap / vision και όχι διαθέσιμο προϊόν σήμερα.</p>
```

**Problem:** The app.aibis.gr dashboard is nearly complete (10+ routes, premium UI, 3 demo profiles), but the public site says "μελλοντικά" and "όχι διαθέσιμο προϊόν σήμερα". This actively devalues the company.

**Fix:** Replace "Roadmap / vision" with "AI Business Command Center" or "Client Dashboard Preview". Remove "not available today" language. Replace tile mockup with actual screenshots from app.aibis.gr.

### 2.2 Pricing Presentation
**File:** lines 239-282

The three-tier pricing (150€–250€, 300€–500€, 800€+) is shown as raw ranges on the homepage. For a premium positioning:

- The price ranges actually **lower perceived value** — they look like agency service packages, not a premium intelligence system.
- There is no mention of the subscription model (Command Center monthly).
- The services listed under each tier are one-time fixes, not continuous improvement.

**Recommendation:** Move detailed pricing to `/pricing` page. Only show package names on homepage with "από Χ€" or "κατόπιν επικοινωνίας". Add a "Command Center Monthly" tier.

### 2.3 No App Screenshots / Mockups
- The site has zero real screenshots from app.aibis.gr.
- The hero scanner is illustrative but not actual app footage.
- Service cards are text-only with no visual preview of the dashboard.

**Fix:** Add screenshots of:
  - Business Score gauge (from app dashboard)
  - AI Action Plan page
  - Reports page
  - Overview dashboard

### 2.4 Contact is Mailto-Only
- The CTA opens default email client (`mailto:aibis.greece@gmail.com`).
- No form, no lead capture, no Calendly integration.
- No way to trigger an automated onboarding flow.

**Fix:** Add a lead intake form (can be simple, Supabase-based, or a third-party embed).

### 2.5 No CTA for Dashboard Demo
- The only CTAs are "Ζητήστε Σύντομο Audit" and "Δείτε Demo Audit" (static PDF-style page).
- There is no "Δείτε το Command Center" or "Ζητήστε Demo Dashboard" CTA.

### 2.6 Missing SEO / Metadata
- No Open Graph tags, Twitter cards, JSON-LD structured data, favicon set.
- No analytics.

---

## 3. Visual Redesign vs Evolution Verdict

**No redesign from zero is needed.**

The current site's visual language (dark navy, cyan glow, glassmorphism, premium typography) is already aligned with the app dashboard's design system (`global.css` in the app uses the same `#030711`, `#55e6ff`, glassmorphism patterns).

What is needed is a **repositioning + premium upgrade**:

| Keep | Change | Add |
|---|---|---|
| Color palette (navy/cyan/gold) | Hero copy to reflect "system" | Screenshots from app.aibis.gr |
| Glassmorphism cards | Roadmap → Command Center preview | Dashboard demo / video |
| Scanner UI (it's a signature) | Pricing structure / placement | New "Command Center" section |
| Diagnosis-first messaging | Section ordering | Lead capture form |
| Problem/solution sections | CTA buttons to include dashboard | `/pricing` page |

---

## 4. Recommended New Homepage Structure

```
1. LOADER (keep current)
2. TOPBAR (keep, add "Command Center" link)
3. HERO (refined copy — see Section 5)
   - Brand strip
   - New headline: "Δείτε πού χάνει πελάτες η επιχείρησή σας — και παρακολουθήστε τη βελτίωση στο AI Dashboard."
   - Scanner UI (keep, anchor it to real app screenshot)
   - Dual CTAs: "Ζητήστε AI Audit" / "Δείτε το Command Center"
4. PROBLEM / LEAK CARDS (keep as-is)
5. AIBIS POSITIONING (keep, minor word updates)
6. WHAT AIBIS ANALYZES (keep, add "Dashboard" to the bento grid)
7. AIBIS COMMAND CENTER (NEW — replace current Roadmap)
   - Screenshots from app.aibis.gr (Business Score, Action Plan, Reports)
   - Feature strip: Business Score, AI Action Plan, Reports, Reviews/Leads tracking
   - "Διαθέσιμο τώρα" badge
8. SERVICES (renamed/restructured — see Section 6)
9. DEMO AUDIT (keep, move after Services)
10. PROCESS (keep, add "Subscription" as step 5 → "Μηνιαία παρακολούθηση")
11. PRICING (simplified on homepage, full table on /pricing)
12. CONTACT (keep, add form)
13. FOOTER (keep, add links)
```

---

## 5. Recommended Hero Copy (Greek)

**Eyebrow:**
> AI Business Intelligence System · AI Business Command Center

**Headline:**
> Δείτε πού χάνει πελάτες η επιχείρησή σας online — και παρακολουθήστε τη βελτίωση σε ένα AI Business Dashboard.

**Subtitle:**
> Η AIBIS αναλύει Google εικόνα, κριτικές, website, social, leads και επικοινωνία, και μετατρέπει τα αποτελέσματα σε πρακτικό action plan μέσα από το app.aibis.gr.

**CTAs:**
- Πρωτεύον: "Ζητήστε AI Business Audit"
- Δευτερεύον: "Δείτε το Command Center" (links to app.aibis.gr demo or /dashboard-preview)

---

## 6. Recommended Service / Package Architecture

### Level 1: Audit / Setup (one-time)

| Package | Target | Key Deliverables |
|---|---|---|
| **AIBIS Starter Audit** | Μικρές επιχειρήσεις | Γρήγορη διάγνωση Google, reviews, website, social — report με ευκαιρίες |
| **AIBIS Growth Setup** | Επιχειρήσεις με ανάγκη συστηματικής παρουσίας | Πλήρες audit + δημιουργία / βελτίωση Google Profile, website, social, leads ροή |

### Level 2: Command Center Subscription (recurring)

| Package | Target | Key Deliverables |
|---|---|---|
| **AIBIS Command Center Monthly** | Επιχειρήσεις που θέλουν συνεχή παρακολούθηση | Dashboard, Business Score, AI Action Plan, Reports, Reviews/Leads tracking, μηνιαία βελτίωση |

### Level 3: Custom

| Package | Target | Key Deliverables |
|---|---|---|
| **Custom Business Intelligence System** | Επιχειρήσεις με σύνθετες ανάγκες | Custom dashboard, integrations, automations |

**Pricing on homepage:** Show package names + "από Χ€" or "κατόπιν επικοινωνίας". Full pricing table on `/pricing`.

---

## 7. Recommended Way to Introduce app.aibis.gr

### Replace the Roadmap section with a "Command Center" section:

**New section structure:**

```
Section: "AIBIS Business Command Center"
Eyebrow: "Ζωντανό AI Dashboard"
Headline: "Η online εικόνα της επιχείρησής σας, σε ένα σημείο."

Content:
- Business Score — ζωντανή βαθμολογία online παρουσίας
- AI Action Plan — προτεραιότητες βελτίωσης
- Αναφορές & Reports — μηνιαία παρακολούθηση
- Reviews & Leads — отслеживание σε πραγματικό χρόνο

Visual:
[Screenshot of app dashboard overview]
[Screenshot of Business Score gauge]
[Screenshot of AI Action Plan page]

CTA: "Δείτε Live Demo" → links to app.aibis.gr (demo mode)
```

**Where to get screenshots:** Run the app locally (`npm run dev` in `06_APP/aibis_client_dashboard_mvp/`) and capture:
- `/dashboard` — overview with MetricCards + BusinessScoreCard + summaries
- `/action-plan` — AI Action Plan with implementation lanes
- `/reports` — report preview cards
- `/login` — the login page with the premium orbital visual

---

## 8. Recommended CTA Flow

### Phase 1 (Current — Immediate)

```
aibis.gr hero CTA: "Ζητήστε AI Business Audit"
  → Email / Calendly / Contact form
  → Manual outreach
  → Onboarding call
  → Manual account creation at app.aibis.gr

aibis.gr secondary CTA: "Δείτε το Command Center"
  → Link to app.aibis.gr (demo mode — no auth required)
  → User sees dashboard preview with demo data
  → CTA inside demo: "Ζητήστε το δικό σας Audit"
```

### Phase 2 (Near term — Stripe Payment Link)

```
aibis.gr → /pricing page
  → Stripe Payment Link or Stripe Pricing Table (embedded)
  → Client selects plan
  → Stripe Checkout (hosted page)
  → Payment confirmed
  → Stripe sends notification email
  → AIBIS manually provisions app.aibis.gr access
```

### Phase 3 (Future — Full SaaS Flow)

```
aibis.gr → /pricing page
  → "Ξεκινήστε συνδρομή"
  → Sign up (Supabase Auth)
  → Stripe Checkout (embedded)
  → Webhook: Stripe → Supabase → create organization + subscription
  → Client redirected to app.aibis.gr dashboard
  → Customer portal for plan changes / cancellation
```

---

## 9. Recommended Subscription / Payment Architecture

### Phase 1: Manual Onboarding (Do this first)

| Component | Implementation |
|---|---|
| Lead capture | Simple form on aibis.gr (name, email, phone, business name) → Supabase or email |
| Calendly | Link for audit call booking |
| Account creation | AIBIS team manually creates account in app.aibis.gr admin panel |
| Dashboard access | Share app.aibis.gr link + temporary credentials |
| Payment | Bank transfer / manual invoice (offline) |

**Risk:** Low. No code changes needed. Tests the sales process before automation.

### Phase 2: Stripe Payment Link / Pricing Table

| Component | Implementation |
|---|---|
| Pricing display | Embedded Stripe Pricing Table on `/pricing` page |
| Checkout | Stripe-hosted Checkout page |
| Webhook | Optional — Stripe can send email notifications |
| Provisioning | Manual (receive notification → create account) |

**Stripe Pricing Table:** Embeddable component that shows subscription plans and redirects to Stripe Checkout. No custom checkout code needed. ([docs.stripe.com](https://docs.stripe.com/payments/checkout/pricing-table))

**Stripe Payment Link:** Even simpler — a single URL that leads to a hosted payment page. Can be used for individual plans. ([stripe.com](https://stripe.com/payments/payment-links))

**Risk:** Low-Medium. Stripe handles PCI compliance. Some manual work remains (provisioning).

### Phase 3: Full Stripe Checkout + Supabase Auth + Webhook Automation

| Component | Implementation |
|---|---|
| Auth | Supabase Auth (email/password or magic link) |
| Subscription | Stripe Checkout with recurring price IDs |
| Webhook | Stripe → Supabase Edge Function → create organization + subscription record |
| Customer Portal | Stripe Customer Portal for plan management |
| Feature gating | Subscription status controls access to app.aibis.gr |

**Risk:** High. This requires:
- Supabase in production (currently disabled)
- Stripe webhook endpoint
- Subscription → feature mapping
- Customer portal configuration
- Testing the full auth → payment → provisioning flow

**Do not rush to Phase 3.** AIBIS's service model (audit first → subscription after) makes Phase 1 or Phase 2 the right starting point.

---

## 10. Specific Sections to Change

| Section | Current State | Recommended Change | Priority |
|---|---|---|---|
| **Roadmap (#roadmap)** | "Μελλοντικό... όχι διαθέσιμο προϊόν" | Replace with "AI Business Command Center" — real screenshots, remove future language | **HIGH** |
| **Hero headline** | "Βρίσκουμε πού χάνει ευκαιρίες... και το διορθώνουμε" | Add system/dashboard angle: "και παρακολουθήστε τη βελτίωση στο AI Dashboard" | **HIGH** |
| **Pricing table** | 150€–250€, 300€–500€, 800€+ raw ranges | Rename packages, remove raw price ranges from homepage, move to /pricing | **HIGH** |
| **CTA buttons** | Only "Ζητήστε Audit" | Add "Δείτε το Command Center" secondary CTA | **HIGH** |
| **Contact section** | Mailto-only | Add lead capture form + optional Calendly | **MEDIUM** |
| **Process (#process)** | 5 steps ending at "Υλοποίηση / βελτίωση" | Add step 6: "Μηνιαία παρακολούθηση μέσω Command Center" | **MEDIUM** |
| **Services section** | "Starting offers" — one-time fix packages | Add "Command Center Subscription" as a service tier | **HIGH** |
| **Footer** | Links to "Command Center Roadmap" | Update link to actual app.aibis.gr | **MEDIUM** |
| **What AIBIS analyzes** | 6 cards (Google, Reviews, Website, Social, Leads, Automation) | Add 7th card: "Dashboard" or integrate dashboard mention | **LOW** |
| **Meta tags** | Basic description + title | Add OG tags, Twitter cards, favicon | **LOW** |
| **Demo audit** | Marina Yacht Club (static) | Keep but add "δείτε το live dashboard" link | **LOW** |

---

## 11. Risks If We Launch Subscription Too Early

| Risk | Impact | Mitigation |
|---|---|---|
| **App not production-ready** | If app.aibis.gr has bugs, crashes, or missing features, charging for it damages trust | Phase 1 (manual) until app passes QA |
| **No real data pipeline** | Currently mock data only. Live client data needs Supabase reads/writes enabled | Phase 1 manual data entry via admin panel |
| **Support burden** | Paying clients expect SLAs, support, uptime | Only onboard 1-2 paid clients manually at first |
| **Stripe refunds / disputes** | If service doesn't deliver, refunds hurt reputation | Start with manual invoicing (Phase 1) |
| **Supabase Auth not tested** | Auth foundation exists but is disabled by default | Test with a single sandbox client first |
| **Over-promising dashboard capabilities** | Dashboard shows demo data — real integrations (Google Maps, booking systems, review APIs) are not built | Be explicit about what's manual vs automated |

### Recommendation

**Do NOT open public subscription yet.** Instead:

1. Update aibis.gr to present the Command Center as **available now** (remove "future" language)
2. Show screenshots from the actual app
3. Keep the sales flow as: **contact → audit → proposal → manual onboarding**
4. Use the first 2-3 paying clients to validate the process
5. After validation, implement Phase 2 (Stripe Payment Link)
6. After 5+ paid clients, build Phase 3 (full automated checkout)

---

## 12. Implementation Plan (For a Later Coding Task)

### Batch 1: Copy & Messaging Changes (1-2 hours)

| File | Change |
|---|---|
| `index.html` lines 339-361 | Replace roadmap section with "AI Business Command Center" preview |
| `index.html` lines 51-56 | Update hero copy — add dashboard angle |
| `index.html` lines 239-282 | Rename pricing packages, add Command Center tier |
| `index.html` lines 323-336 | Add step 6 to process |
| `index.html` lines 55, 375 | Update CTA text |
| `index.html` line 388 | Update footer link |

### Batch 2: Add App Screenshots (1-2 hours)

| Action | Details |
|---|---|
| Run `npm run dev` in app dashboard | Start local dev server |
| Capture screenshots | `/dashboard`, `/action-plan`, `/reports`, Business Score gauge |
| Save to aibis.gr `/assets/images/` | Optimize for web |
| Reference in new Command Center section | Replace tile mockup with actual images |

### Batch 3: Add Lead Capture Form (2-3 hours)

| Action | Details |
|---|---|
| Create simple form | Name, email, phone, business name, message |
| Backend | Supabase insert (if ready) or email via formspree / similar |
| Replace mailto link | Form + optional Calendly embed |

### Batch 4: Pricing Page (2-3 hours)

| Action | Details |
|---|---|
| Create `/pricing` page | Full pricing table with package details |
| Update homepage pricing section | Simplified — names only + "δείτε τιμές" link |
| Add Stripe Payment Link (Phase 2) | When ready |

### Batch 5: QAS & Production Readiness (1 hour)

| Action | Details |
|---|---|
| Run `npm run build` | Verify no errors |
| Check all links | Anchor links, app.aibis.gr links |
| Review Greek copy | No typos, consistent terminology |
| Test all CTAs | Form submission, email links |
| Mobile responsive check | All new sections on mobile |
| Accessibility check | New ARIA labels if needed |

---

## 13. Comparison: aibis.gr vs app.aibis.gr Brand Alignment

| Dimension | aibis.gr (current) | app.aibis.gr (dashboard) | Match? |
|---|---|---|---|
| **Background** | `--black: #020611`, navy gradient | `#030711` (near-black) | ✅ Close match |
| **Accent color** | `--cyan: #36d8ff` | `#55e6ff` | ✅ Both electric cyan (slight shade diff) |
| **Gold accent** | `--gold: #ddb85c` | `#e4c875` | ✅ Close match |
| **Card style** | Glassmorphism, `backdrop-filter: blur(20px)` | Glassmorphism, `backdrop-filter: blur(18px)` | ✅ Same pattern |
| **Typography** | Inter + SF Pro Display | Inter + Noto Sans Greek | ✅ Same font family |
| **Logo** | `aibis_logo_wide.png`, `aibis_logo_mark.png` | `aibis-logo-full.png`, `aibis-logo-mark.png` | ✅ Same logo assets |
| **Tone** | Premium, diagnosis-first, cautious | Premium, client-facing, data-driven | ✅ Aligned |
| **Language** | Greek | Greek (client UI) | ✅ Aligned |

**Verdict:** The two properties are already visually aligned. The main gap is content and messaging, not visual identity.

---

## 14. Final Recommendation

**Do not redesign aibis.gr from scratch.** The visual identity, color palette, card system, and overall premium feel are already consistent with the app dashboard.

The critical change is **repositioning**:

> From: "We do audits and recommend solutions"
> To: "We start with an audit and give your business an AI Business Command Center for continuous improvement"

### Immediate Actions (Priority Order)

1. **Rewrite the Roadmap section** — it's actively harmful to show the app as "future" when it exists
2. **Update hero copy** — add the dashboard/system angle
3. **Add app screenshots** — show real product, not placeholder mockups
4. **Add "Δείτε το Command Center" CTA** — link to app.aibis.gr demo
5. **Restructure pricing** — rename packages, add subscription tier, move detail to /pricing
6. **Update process** — add subscription/continuous improvement step
7. **Add lead capture form** — replace mailto-only contact
8. **SEO / metadata improvements**

### Monetization Timing

| Phase | When | What |
|---|---|---|
| Phase 1 | **Now** | Manual onboarding (contact → audit → manual account) |
| Phase 2 | After 2-3 paying clients | Stripe Payment Link / Pricing Table |
| Phase 3 | After 5+ paying clients | Full Stripe Checkout + Supabase Auth + Webhook automation |

### Key Risk

The biggest risk is not technical — it's **presenting the dashboard as "available" when it's still a demo/MVP**. Before updating the site to promote the Command Center as a live product, ensure:

- [ ] app.aibis.gr is deployed and accessible
- [ ] Demo profiles work without errors
- [ ] Navigation is complete (no broken links)
- [ ] Mobile responsive is acceptable
- [ ] At least one real client has been manually onboarded and validated

---

*This document is an analysis and proposal only. No production files were modified, no commits were made, no deployments were triggered, no environment variables were changed, no Supabase connections were altered, and no payment secrets were added or exposed.*

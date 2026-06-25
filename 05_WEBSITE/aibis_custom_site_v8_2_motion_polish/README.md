# AIBIS Custom Site v8.2 - Motion Polish

## Purpose

This is the motion-polished custom static website for:

**AIBIS - AI Business Intelligence System**

The page keeps the v8 premium dark AI/SaaS diagnostic direction and adds more product-like motion, smoother scroll behavior, stronger hero sequencing, richer hover states, and production QA.

Core positioning:

> AIBIS is not a generic web agency. It is an AI Business Intelligence / Local Growth Intelligence system that helps a business find where online opportunities are being lost and turns the diagnosis into practical digital improvements.

## Files

```text
aibis_custom_site_v8_2_motion_polish/
├─ index.html
├─ styles.css
├─ script.js
├─ README.md
├─ assets/
│  ├─ logos/
│  │  ├─ aibis_logo_wide.png
│  │  ├─ aibis_logo_mark.png
│  │  └─ aibis_logo_clean.png
│  ├─ screenshots/
│  │  ├─ dashboard.png
│  │  ├─ action-plan.png
│  │  ├─ reviews.png
│  │  └─ reports.png
│  └─ vendor/
│     ├─ gsap.min.js
│     ├─ ScrollTrigger.min.js
│     └─ lenis.min.js
```

## How to open locally

Direct open:

```text
D:\AIBIS\05_WEBSITE\aibis_custom_site_v8_2_motion_polish\index.html
```

Recommended local server:

```powershell
cd D:\AIBIS\05_WEBSITE\aibis_custom_site_v8_2_motion_polish
python -m http.server 8872 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8872/
```

## Motion stack

All runtime animation libraries are local files. No CDN is required.

- `assets/vendor/gsap.min.js`
- `assets/vendor/ScrollTrigger.min.js`
- `assets/vendor/lenis.min.js`

Motion polish added in v8.2:

- premium loader and hero intro sequence
- word-level hero headline reveal
- Diagnostic Engine frame reveal
- Business Score count-up
- score ring animation
- report progress fill animation
- scanner beam and scan-line loops
- module activation pulses
- detected opportunities stagger reveal
- ScrollTrigger section reveals with y/blur/scale polish
- gentle scroll parallax on selected cards
- Lenis smooth scroll on desktop/tablet
- card radial hover light tracking
- stronger service and dashboard hover states

## Accessibility and performance notes

- `prefers-reduced-motion: reduce` disables long animation behavior and smooth scrolling.
- Lenis is enabled only when motion is allowed and the viewport is not mobile-sized.
- Mobile keeps the scanner more compact and uses fewer ambient canvas particles.
- The page avoids heavy WebGL and uses CSS/GSAP transforms and opacity for most motion.

## Content safety

The page does not claim guaranteed bookings, revenue, Google ranking, or client results.

The Marina Yacht Club section remains clearly framed as an indicative demo audit, not an official collaboration.

The Business Command Center section includes real app dashboard screenshots inside premium browser mockup frames with demo data. Wording is kept cautious: "demo / onboarding μορφή μέσω AIBIS Audit."

## Contact behavior

There is no fake working form.

The contact CTA uses a mail link to:

```text
aibis.greece@gmail.com
```

Later this can be replaced with a real lead intake flow, WordPress/Elementor form, Supabase backend, or CRM integration.

## Deploy notes

This is a static site. Deploy the folder contents as the site root to:

- Vercel
- Netlify
- Cloudflare Pages
- any static hosting provider

No backend is required for this version.

## QA checklist

Checked for this polish pass:

- local JS syntax
- local vendor assets
- missing local asset paths
- missing anchor targets
- UTF-8 replacement characters
- no CDN references
- no filler copy or developer-marker text
- desktop hero screenshot
- mobile hero screenshot
- services anchor / sticky header offset
- browser console logs during QA

## Known limitations

- Contact is mail-based for now.
- The site is still a static marketing page, not the future app/dashboard.
- Final production deployment should include real metadata, analytics policy, favicon set, and contact workflow decision.

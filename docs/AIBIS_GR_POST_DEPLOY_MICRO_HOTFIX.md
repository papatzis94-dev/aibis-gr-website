# AIBIS GR Post-Deploy Micro Hotfix

## Anchor Offset + Pricing Typo Fix

---

### Files Changed

| File | Change |
|------|--------|
| `05_WEBSITE/aibis_custom_site_v8_2_motion_polish/styles.css` | `scroll-padding-top: 116px → 130px`; `scroll-margin-top: 122px → 130px` |
| `05_WEBSITE/aibis_custom_site_v8_2_motion_polish/script.js` | Lenis scroll offset: `-112 → -128` (desktop), `-86 → -96` (mobile) |
| `05_WEBSITE/aibis_custom_site_v8_2_motion_polish/index.html` | `"Starter AI Audit"` → `"STARTER AI AUDIT"` (2 occurrences: pricing card + footer) |

### Exact Fixes

1. **Anchor offset** — Increased all three offset values to prevent sticky navbar overlap:
   - `html { scroll-padding-top: 130px }` (was 116px)
   - `.section, .section-shell { scroll-margin-top: 130px }` (was 122px)
   - JS `lenis.scrollTo` offset for anchor links: `-128` desktop / `-96` mobile (was `-112` / `-86`)

2. **Pricing naming** — HTML text changed to `"STARTER AI AUDIT"` to match the CSS `text-transform: uppercase` render and ensure screen readers + fallback states show the correct casing.

### QA Result

| Check | Result |
|-------|--------|
| Desktop nav links clickable (5 links) | ✓ All worked |
| Tablet nav links clickable | ✓ All worked |
| Mobile (no nav-links visible, scroll-triggered) | ✓ 0 errors |
| Pricing label text: "STARTER AI AUDIT" | ✓ Confirmed |
| Footer pricing text: "STARTER AI AUDIT" | ✓ Confirmed |
| Console errors | **0** |
| Broken images | **0** |

### Live URL Checked

- `https://www.aibis.gr/` — Hotfix deployed and verified

### Final Verdict

**DEPLOYED** — Hotfix applied successfully with no regressions. All anchor navigation works, pricing label is correct.

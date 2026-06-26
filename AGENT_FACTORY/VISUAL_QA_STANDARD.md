# AIBIS Visual QA Standard

## Core Values

- Premium
- Serious
- Cinematic
- B2B / enterprise-grade
- Greek-market professional
- Trustworthy
- Expensive-looking

## Strictly Forbidden

- ❌ Childish visuals, emoji-heavy UI, cartoon illustrations
- ❌ Generic SaaS template feeling (flat Bootstrap/Tailwind default look)
- ❌ Text collisions, overlapping elements, clipped text
- ❌ Visible technical/internal wording in client-facing views
- ❌ Raw `demo_ready`, `mock`, `localStorage` labels visible to client
- ❌ No demo signal in client cards (no "Demo", "Sample", "Test" badges)
- ❌ Excessive cyan glow or overuse of accent color
- ❌ Harsh default green/yellow/red status colors
- ❌ Horizontal overflow at any viewport

## Required Premium Elements

- Dark navy cinematic background (`#0a0e17` or equivalent)
- Glassmorphism cards with subtle borders
- Cyan/electric blue glow accents (restrained, not covering every surface)
- Gold accents for opportunities/warnings
- Consistent card radius, padding, typography
- Official AIBIS logo assets (never CSS/SVG/text recreations)
- Premium shadows and spacing
- Consistent 4px or 8px grid rhythm
- Clean Greek typography (Inter or equivalent)

## QA Process for UI Milestones

1. Screenshot at 1920x1080 (desktop)
2. Screenshot at 1366x768 (small desktop)
3. Screenshot at narrow viewport (~400px) if layout changes
4. Check console errors — zero tolerance
5. Check horizontal overflow — zero tolerance
6. Check text clipping — zero tolerance
7. Check AIBIS logo renders correctly
8. Verify no demo/internal wording in client views
9. Verify no guaranteed claims visible
10. Verify Greek-first language in client views
11. Compare against locked visual contract if applicable

## Screenshot Storage

- Save to `docs/visual-qa/<milestone>/`
- Filename format: `<viewport>-<page>.png`
- Example: `1920x1080-dashboard.png`, `1366x768-reports.png`

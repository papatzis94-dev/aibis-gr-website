# CRM Mobile Overflow Fix QA — 12A.5A

## Issue

The CRM lead list used a CSS grid with fixed columns (1fr 90px 100px 40px) that overflowed horizontally at viewport widths below ~600px.

**Severity before fix:** P2 — minor/narrow-only. Did not block desktop or tablet use.

## Files Changed

- `src/pages/admin/AdminCrm.tsx` — added viewport detection (`useViewport` hook), mobile card layout, responsive detail panel, filter scroll, summary card stacking

## Fix Summary

| Breakpoint | Before | After |
|---|---|---|
| Desktop 1920px | Table grid, side-by-side detail panel | Same (preserved) |
| Tablet 768px | Table grid, side-by-side | Same (preserved) |
| Mobile <600px | Horizontal overflow, clipped text | Stacked cards, full-width detail panel |
| Filters on mobile | Overflow hidden | Horizontal scroll enabled |
| Summary cards on mobile | 4-column flex row (too narrow) | Vertical stacked column |

## Results

| Viewport | Overflow | Visual Quality |
|---|---|---|
| 1920×1080 | NONE | Premium |
| 768×900 | NONE | Clean |
| 375×812 | NONE | Acceptable for admin use |

## Screenshots

`docs/visual-qa/12A5A-crm-mobile-overflow-fix/`
- `desktop-1920.png` — exists
- `tablet-768.png` — exists
- `mobile-375.png` — exists

## Remaining Notes

- Desktop table appearance preserved exactly
- No new dependencies added
- No CSS framework changes
- No mock data modifications
- No route/auth changes

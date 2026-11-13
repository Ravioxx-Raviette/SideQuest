# Catalog Controls Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans in this session and request a final read-only review.

**Goal:** Make active constraints visible and product order controllable.
**Architecture:** catalog.js exposes sortCatalog(products, order) and renderActiveFilters(), and manages chip actions. Existing renderProducts filters first, sorts second, and refreshes chip state. Existing filter reset and guide behavior retain sorting.
**Tech Stack:** Existing HTML/CSS/JavaScript and Playwright.
**Spec:** docs/superpowers/specs/2026-11-13-catalog-controls-design.md.

## Global Constraints
- Five native sort choices; featured order preserves PRODUCTS order.
- Chips remove exactly one filter; Clear all retains sort.
- User-entered text must be escaped and fit narrow screens.
- Preserve all prior feature state; no new dependencies.

## Review Focus
- Sorting must not mutate the source catalog or corrupt Featured order.
- Removing a chip must preserve other constraints and keyboard focus.
- Empty results and long/malicious-looking search strings remain recoverable.
- Shared saved/compare state must survive all catalog rerenders.
- Guide browse resets filters while retaining sort and updating chips.

### Task 1: Sorting and filter visibility
**Files:** Create dist/catalog.js and tests/catalog.spec.cjs; modify index.html, app.js, styles.css, README, roadmap.
**Interfaces:** sortCatalog(products, order) -> ordered copy; renderActiveFilters() derives chips from current form controls; existing resetFilters()/renderProducts() remain entry points.
- [x] Write browser tests for all five orders, combined/individual chip removal, reset semantics, guide integration, saved-state preservation, keyboard focus, and narrow/escaped search text.
- [x] Observe missing sort test fail before implementation.
- [x] Implement native selector, chips, safe sorting, and responsive controls.
- [x] Run full suite, inspect screenshots, obtain review and address important findings.
- [x] Update documentation and record final evidence.

## Verification record
- Missing Sort by control test failed before implementation.
- New catalog checks: 8/8 passed across desktop/mobile, including every sort order, original Featured restoration, four combined chips, individual resets, empty-results recovery, guide browsing, saved choices, keyboard removal, escaped markup, and 320px viewport fit.
- Independent read-only review found no important issues. Included accessible descriptions so each chip announces its selected value as well as its removal action.
- Final npm test: 5/5 matching tests and 62/62 browser checks passed in 47.1 seconds. Existing quiz, comparison, guide, wishlist, bag, and checkout remain covered.
- Toolbar/chip screenshots inspected for desktop/mobile. node --check catalog.js/app.js and git diff --check passed. No dependencies or deferred findings. Local checkout and Site identity preserved; no remote publication.

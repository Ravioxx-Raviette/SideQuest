# Product Comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Execute in this session; request a final read-only code review.

**Goal:** Add up-to-three product comparison, the user's requested next roadmap feature.
**Architecture:** A focused compare.js script defines shared selection and control rendering before app.js, then initializes dialog/tray interaction at DOMContentLoaded. Existing app.js/finder.js render comparison controls alongside product actions. Reuse existing notifications, dialog focus handling, and add-to-cart actions.
**Tech Stack:** HTML/CSS/vanilla JavaScript and existing Playwright.
**Spec:** docs/superpowers/specs/2026-11-13-product-comparison-design.md.

## Global Constraints
- At most three unique known products; compare action needs at least two.
- Compare actual product fields; no fabricated ratings, stock, or claims.
- Session-memory selection, shared across all entry points.
- Native dialog, keyboard focus handling, responsive local table scrolling.
- Preserve the completed finder and all existing shopping functions.

## Review Focus
- Removing columns must not strand keyboard focus.
- Clear/close with a disabled former opener needs a focus fallback.
- Filtering/rerendering must not lose selection or show stale toggle state.
- Mobile table and bottom bar must stay within the viewport.
- Details, comparison, and confirmation dialogs must not become nested.

### Task 1: Selection and comparison experience
**Files:** Create dist/compare.js, tests/compare.spec.cjs; modify dist/index.html, dist/styles.css, dist/app.js, dist/finder.js.
**Interfaces:** comparisonControl(product) returns an aria-pressed toggle for product.id; selection controller reads known PRODUCTS after DOMContentLoaded. Existing data-add actions handle bag additions.
- [x] Write real browser tests covering 2–3 selections, fourth-product rejection, filtering persistence, differences toggle, removal below two, clearing, result/details entry points, keyboard close, and mobile scrolling.
- [x] Observe the new tests fail before implementation.
- [x] Implement shared controls, selection bar, semantic table/dialog, diff filtering, selection limits, and focus fallback.
- [x] Run complete npm test and inspect desktop/mobile comparison screenshots.
- [x] Obtain code review, resolve important findings, update README/roadmap, and record final evidence.

## Execution decision
The user already requested all roadmap features and explicitly said to proceed to the next one. Use the established product-comparison scope and existing modal design without another approval question. Keep the previous phase's uncommitted files intact. Hosting was unavailable in the previous phase; preserve the existing project identity and do not create a replacement.

## Verification and decisions
- Initial new comparison test failed at the missing Compare control before implementation.
- First full run at six workers: 22 browser tests passed, six desktop tests timed out, primarily in page.goto. Repeating the unchanged code at two workers passed all 28 then-existing browser tests in 16.1 seconds. Set the local default to two workers rather than relaxing timeouts.
- A targeted feedback regression failed on both desktop/mobile: toast overlapped the selection bar. Measure tray height, reserve space beneath the shop, and place notifications above it. Confirm bag changes inside the modal's accessible tree using the existing addToCart rules.
- Targeted feedback checks passed on both viewports after the fix.
- Independent review found two important edge cases: no-results filtering left no focus fallback after removing/clearing selections, and shop-only padding left the footer covered by the fixed tray. Added desktop/mobile regressions and observed all four fail. Added search as a focus fallback and moved reserved space to the end of the document while the shop is visible.
- Final npm test after review fixes: 5/5 matching tests and 34/34 browser tests passed in 17.5 seconds. node --check dist/compare.js and git diff --check passed. No deferred review findings.
- Inspected desktop/mobile comparison screenshots, including local table scrolling and sticky specification labels. No document-level horizontal overflow.
- No runtime dependencies added. Existing finder/cart/checkout tests remain green. Work stays in the same local checkout and branch; no merge, GitHub push, or replacement Site.

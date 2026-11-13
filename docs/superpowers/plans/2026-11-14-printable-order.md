# Printable Order Summary Implementation Plan

> **For agentic workers:** Execute in this session and obtain a final read-only code review.

**Goal:** Preview and print a clean historical order summary from checkout or history.
**Architecture:** receipt.js validates/copies the selected order and renders a dedicated receipt view; Print delegates to window.print. Integrate receipt routing and entry actions in app.js/orders.js. Dedicated print CSS isolates the selected document and defines paper layout.
**Tech Stack:** Existing HTML/CSS/JavaScript, Playwright print emulation/PDF export.
**Spec:** docs/superpowers/specs/2026-11-14-printable-order-design.md.

## Global Constraints
- Original snapshot prices, not current catalog prices; no personal fields or demo labels.
- No payment/shipping/tax status claims; summary only.
- Print only the selected record; preserve cart/history.
- Native printing, responsive preview, multipage tables; no dependencies.

## Review Focus
- Direct/deleted receipt routes must not show an unrelated order.
- Print media must exclude every other application surface.
- Long names and multiple pages must remain readable.
- Browser-session orders print even when storage writes failed.
- Print cancellation and history deletion must not corrupt order/cart state.

### Task 1: Historical summary and print layout
**Files:** Create dist/receipt.js/tests/receipt.spec.cjs; modify app.js, orders.js, index.html, styles.css, README, roadmap.
**Interfaces:** renderOrderReceipt(number) -> boolean using normalized snapshot; openOrderReceipt(number) routes to preview; data-order-summary entries; print button delegates to native window.print.
- [x] Write behavior checks for snapshot content/escaping, navigation/refresh, print isolation/delegation, checkout entry, failed storage, and multipage/long data.
- [x] Observe missing summary action fail before implementation.
- [x] Implement preview, route validation, native printing, and isolated paper styles.
- [x] Run full checks, inspect preview/printed PDFs, obtain review and fix important findings.
- [x] Update documentation and record final evidence.

## Verification record
- Missing summary action failed before implementation. Initial ten desktop/mobile summary checks passed; initial full suite (5 unit + 98 browser checks) passed.
- Actual PDF visual review found root-page background showing behind a short receipt. Added white-paper regression, observed the old paper color fail, and corrected the print root background.
- Independent review found an active summary could remain after deletion in another tab. Added a two-tab regression and observed stale receipt routing fail. Revalidate on order storage events and before the print action; clear stale summary DOM and return to history with focus/feedback.
- Browser PDF fixtures: standard historical order prints on one A4 page; 65 long-name historical lines span seven A4 pages. Initial visual review confirmed repeated headings, intact rows, peso glyphs, historical decimals, and totals/footer placement.
- No dependencies or remote changes. Browser print/Save as PDF remain native user actions. PDF fixtures and screenshots are ignored development artifacts, not deliverables or tracked source files.
- Final npm test after fixes: 5/5 matching tests and 100/100 browser checks passed in 46.1 seconds. Both new regressions passed on desktop/mobile. node --check receipt.js/app.js and git diff --check passed.
- Re-rendered the final one-page summary and the mobile seven-page summary's final page: clean white background, correct peso values, intact totals/footer. Earlier first/middle/last long-order page inspection confirmed repeated table headings and unsplit rows. PDF text extraction utility was unavailable; visual PDF renders, PDF page counts, and browser row/total assertions supplied verification.
- No deferred review findings. Changes remain local on new-features-1; no commit/push or Site publication requested in this phase.

# Order History Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans here and obtain final read-only review.

**Goal:** Save private browser-local order snapshots and safely reorder at current catalog prices.
**Architecture:** orders.js validates/loads snapshots, records completed orders, renders the #orders view and reorder review, and handles deletion/storage synchronization. Integrate finishOrder and routing; retain all existing bag/checkout rules.
**Tech Stack:** Existing HTML/CSS/JavaScript, localStorage, and Playwright.
**Spec:** docs/superpowers/specs/2026-11-13-order-history-design.md.

## Global Constraints
- No demo labels/indicators in customer-facing history/checkout copy.
- Do not save delivery/personal fields or imply remote processing.
- Historical values remain snapshots; reorders use current prices.
- Validate storage; handle missing products, cap99, failed writes, cross-tab state, and focus.
- No dependencies or remote publication.

## Review Focus
- Reorder must not overwrite existing bag items or partially apply cap conflicts.
- Stored names/record fields are untrusted; do not render raw HTML or retain extra personal data.
- Missing products/changed prices must be clear before bag mutation.
- Confirmed checkout records once, cancellation records nothing.
- Deletion/storage errors and cross-tab changes must keep modal state/focus consistent.

### Task 1: History and reorder
**Files:** Create dist/orders.js and tests/orders.spec.cjs; modify app.js, index.html, styles.css, existing checkout test wording, README, roadmap.
**Interfaces:** recordCompletedOrder(number, items) returns persistence boolean; renderOrders() renders #orders view; order storage whitelist; reorder planner recomputed before one bag mutation.
- [x] Write behavior tests for checkout/save/privacy/refresh, reorder merging/current prices, unavailable/cap conflicts, deletion, malformed/blocked storage, cross-tab changes, keyboard/mobile, and copy.
- [x] Observe missing history test fail before implementation.
- [x] Implement snapshots, history view, guarded reorder, deletion, routing, and neutral copy.
- [x] Run all checks, inspect screenshots, obtain review, and resolve important findings.
- [x] Update docs/roadmap and record verification.

## Verification record
- Initial history test failed before implementation. Initial checkout test exposed decorative arrows in button accessible names; mark them aria-hidden while retaining the visual arrows.
- Cross-tab cart test exposed the timing of storage listeners: an early queued microtask could run before the bag's listener had read new quantities. Schedule the review refresh in a new task, and recompute the plan at confirmation. Regression passed on both viewports.
- Independent review found two important issues: failed writes could lose page-session history changes during external updates, and history updates could remove focused dialog controls. Recorded pending additions/deletions are now reconciled with incoming records; refreshed reviews focus their heading. New regressions reproduced both failures before the fixes and then passed, including local deletion plus unsaved confirmed checkout.
- Final npm test: 5/5 matching tests and 88/88 desktop/mobile browser checks passed (1.1 minutes). Current functionality and all earlier features remain covered.
- Inspected desktop/mobile history and reorder screenshots; narrow 320px dialog/document overflow checks passed. node --check orders.js/app.js and git diff --check passed. No new dependencies or deferred review findings.
- Changes remain local on new-features-1 after the previously pushed 2fa8a8e commit. No new commit, push, or publication requested in this phase. Existing Site identity preserved.

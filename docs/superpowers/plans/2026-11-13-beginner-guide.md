# Beginner Guide Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans in this session, with a final read-only review.

**Goal:** Make dice types and materials understandable at the point of choosing.
**Architecture:** Native HTML guide disclosure and a focused guide.js for contextual help and browsing actions. Integrate help in existing product and finder rendering. Extend shop section routing for the guide/finder anchors.
**Tech Stack:** Existing HTML/CSS/JavaScript and Playwright.
**Spec:** docs/superpowers/specs/2026-11-13-beginner-guide-design.md.

## Global Constraints
- No dependencies or nested dialogs.
- Browse actions explicitly reset search/filters and preserve cart/comparison.
- Source dice terminology from the official basic rules; material descriptions are sample-catalog information.
- Native disclosures, keyboard focus, responsive layout, and direct links.

## Review Focus
- Repeated guide links must work when the hash is already #dice-guide.
- Product help must describe single dice versus sets accurately.
- Navigation from bag/checkout back to a guide anchor must show the shop.
- Browse actions must clear conflicting filters without discarding saved shopping choices.
- Expanded help must not overflow mobile screens or break modal focus.

### Task 1: Guide and contextual education
**Files:** Create dist/guide.js, tests/guide.spec.cjs; modify index.html, styles.css, app.js, finder.js, README, roadmap.
**Interfaces:** diceGuideHelp(product) -> native disclosure HTML; finderGuideHelp(key) -> help HTML for type/material steps; data-guide-type/data-guide-material actions reuse resetFilters/renderProducts; data-guide-link opens #dice-guide.
- [x] Write browser tests for disclosure keyboard behavior, anchor navigation, browse filtering/state preservation, and quiz/product context help.
- [x] Observe a missing-guide test fail before implementation.
- [x] Implement guide, disclosures, browse actions, and robust section routing.
- [x] Run the complete suite, inspect screenshots, and obtain independent review.
- [x] Resolve important findings, update docs, and record verification.

## Execution decision
The user approved continuing the established roadmap. Implement the bounded guide directly without another approval round. Preserve all prior changes and Site identity; the hosting connector was unavailable in previous phases.

## Verification record
- Missing guide test failed before implementation.
- First guide-only browser run: 6 passed, 2 failed. Existing modal focus containment only considered form controls and links, so it wrapped before the new native summary. Included summaries and keyboard-focusable regions in the dialog control list; the same keyboard regression then passed on both viewports.
- Full npm test: 5/5 matching tests and 42/42 desktop/mobile browser tests passed in 19.6 seconds. Existing finder, comparison, bag, and checkout remain covered.
- Inspected desktop and mobile guide screenshots: disclosure layout, seven dice labels, material blocks, browse actions, source link, and no horizontal overflow.
- node --check dist/guide.js and git diff --check passed. No new dependencies or external assets.
- Independent read-only review found no important issues in routing, native disclosures/focus, browsing actions, product accuracy, or comparison-tray integration. No deferred findings. Changes remain in the local checkout; Site identity preserved and no publication attempted through the unavailable connector.

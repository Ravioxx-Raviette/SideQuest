# Dice Roller Implementation Plan

> **For agentic workers:** Execute inline and obtain a final read-only review.

**Goal:** Let shoppers roll virtual D6/D20 dice from the collection and product details.
**Architecture:** roller.js provides a pure bounded RNG plus reusable widget markup and delegated state/events. Mount the main widget at DOMContentLoaded and compact widgets while rendering product details. Cancel detail timers on close; keep contexts independent.
**Tech Stack:** Existing HTML/CSS/JavaScript, Node test runner, Playwright.
**Spec:** docs/superpowers/specs/2026-11-14-dice-roller-design.md.

## Global Constraints
- Only D6/D20, whole results in valid ranges; unbiased rejection sampling.
- One result per activation while rolling; no background/storage side effects.
- Eight labelled history entries, clear history, accessible final feedback.
- Reduced-motion skips animation and delay; modal close cancels pending result.
- Preserve shopping features and current neutral UI wording.

## Review Focus
- RNG boundaries and rejected words must not yield out-of-range or biased results.
- Double activation and closing/reopening details must not create extra/stale rolls.
- Widget contexts must not share radio names, results, or history.
- Focus/announcements and reduced-motion must be usable on keyboard/mobile.
- Direct section links and existing print isolation must keep working.

### Task 1: Virtual dice interaction
**Files:** Create dist/roller.js, tests/roller.unit.cjs, tests/roller.spec.cjs; modify app.js/index.html/styles.css, package.json, README, roadmap.
**Interfaces:** rollDiceValue(sides, draw?) returns integer; diceRollerMarkup(context, initialSides) returns widget HTML and initializes state; productDiceRoller(product) returns compact disclosure; delegated events roll/select/clear.
- [x] Write RNG boundary/rejection tests and browser tests for result/history, activation guard, contextual defaults/cancel, reduced motion, keyboard, and 320px layout.
- [x] Observe missing RNG/widget tests fail before implementation.
- [x] Implement RNG, independent widget state, animation/feedback, product integration, and routing.
- [x] Run full suite, inspect screenshots, obtain review, fix important findings.
- [x] Update docs and record final evidence.

## Verification record
- Missing RNG module and main widget tests failed before implementation. Four RNG tests then passed, including accepted endpoint values, rejection sampling, unsupported sides, and invalid random input.
- Initial eight targeted desktop/mobile interaction checks passed. Full regression identified ambiguous pre-existing global D20 radio locators after adding a second D20 control; scope catalog filter tests to .filters.
- Full regression also exposed hidden controls inside a closed product disclosure being included in the modal keyboard cycle. A targeted summary-to-close-button test reproduced this on both viewports. Explicitly exclude contents of closed details from the cycle, while retaining their visible summaries.
- Independent review found identical consecutive results reused the same live-region text. A deterministic repeat-result regression failed on both viewports. Each completed result now includes a monotonically increasing per-widget roll number; clearing history keeps the counter and displayed result.
- Desktop/mobile widget screenshots inspected: prominent result, clear D6/D20 choices, labelled history, and no clipping. Reduced-motion checks verify no running animation; storage-blocked checks verify zero writes and an unchanged empty bag.
- Final full regression passed: 9 unit tests and 108 desktop/mobile browser checks. Playwright's final run record reports passed with no failed tests. JavaScript syntax and whitespace checks pass. Review findings are resolved; changes remain local on new-features-1.

# Find My Dice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver the approved inline dice finder, priority 1 of the presentation roadmap.

**Architecture:** A self-contained finder section in index.html, matching styles in styles.css, and a focused finder.js script using existing PRODUCTS, productImage, money, details, and cart actions. A pure matchDice(products, answers) function is shared with Node tests through a conditional CommonJS export.

**Tech Stack:** Existing HTML, CSS, vanilla JavaScript, Node test runner, and Playwright.

**Spec:** docs/superpowers/specs/2026-11-13-dice-finder-design.md (approved in chat).

## Global Constraints
- No new runtime dependencies or external services.
- Type and maximum budget are strict; material is an explicitly explained preference.
- Answers live in page memory only; preserve existing shopping behavior.
- Guided section above the collection, responsive and accessible.

## Review Focus
- Tight budgets must not produce false full-set recommendations.
- No preference must not be treated as a material match.
- Returning to previous steps preserves selections and editing updates results.
- Product actions must work from results without nested dialogs.
- Progress, focus, and error feedback remain usable on small screens and keyboard.

### Task 1: Matching engine
**Files:** Create dist/finder.js and tests/finder-matching.test.cjs.
**Interfaces:** matchDice(products, {type, budget, material}) returns up to three {product, materialMatch} entries; budget is a number or Infinity.
- [x] Write tests for strict type/budget, preferred-material ranking, explained alternatives, no matches, no preference, and price boundaries.
- [x] Run node --test tests/finder-matching.test.cjs and observe missing-module failure.
- [x] Implement pure deterministic matching and verify those tests pass.

### Task 2: Guided user experience
**Files:** Modify dist/index.html and dist/styles.css; extend dist/finder.js; create tests/finder.spec.cjs.
**Interfaces:** Mount #dice-finder, use #finder-content for changing steps, reuse existing data-detail/data-add actions.
- [x] Write browser tests for first campaign within ₱700, no matches within ₱250, metal D20 within ₱500, unanswered validation, back/edit/reset/close, and result product actions.
- [x] Run finder browser tests and verify missing finder entry fails.
- [x] Build intro, steps, result cards, honest alternatives, focus management, and responsive styling.
- [x] Run matching tests and full npm test; inspect screenshots for desktop/mobile.
- [x] Update README and roadmap, review diff, and record evidence.

## Execution notes
The user approved and instructed building in this chat. Continue directly with implementation here. Keep changes in the requested local checkout, on a feature branch if Git allows it. Sites metadata is present, but its get_site tool returned unavailable; retain identity and report publication unavailable if the connector remains inaccessible. Do not create a replacement Site.

## Verification record
- Branch: feature/find-my-dice; original checkout preserved in place.
- Matching tests: missing-module failure observed first, then 5/5 passing.
- Browser-test dependencies initially blocked by network and certificate errors. Installation succeeded using Windows trusted certificates, without disabling verification.
- Browser UI tests were written first but could only run after the UI was implemented because the browser installation was pending. A controlled regression check with finder.js temporarily disabled failed at the missing Find my dice button; the script was automatically restored.
- Initial full browser run: 16 passed, 2 failed because Back included a decorative arrow in its accessible name. Marked that arrow aria-hidden and kept the readable Back label.
- Independent review found one important mobile focus issue. A new viewport regression reproduced it (next question viewport ratio 0). Allowing native focus scrolling fixed it; final suite includes desktop and mobile regression checks.
- Final npm test: 5 matching tests passed, 20 browser tests passed. Existing filtering, cart, persistence, validation, and checkout remain covered.
- Inspected desktop and mobile result screenshots: aligned cards, readable reasons, stacked mobile results, no clipping.
- git diff --check passed. No new runtime dependencies. No merge, GitHub push, or replacement Site creation.

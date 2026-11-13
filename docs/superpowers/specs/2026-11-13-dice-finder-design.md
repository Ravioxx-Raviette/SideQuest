# Find My Dice — priority 1

## Intent
Help first-time dice shoppers choose confidently and provide a clear, memorable HCI presentation flow. The user selected a guided section above the collection over a popup. Preserve the existing cream, green, and terracotta design and browser-only HTML/CSS/JavaScript implementation.

## Experience
A compact introduction above the collection offers “Find my dice.” Starting opens an inline, three-step quiz with a visible step count and progress indicator. The regular collection stays available below.

1. **Your adventure:** choose a first campaign (seven-piece set), a single D20, a classic D6, or help exploring any dice. Each choice includes a plain-language explanation, so beginners can answer without knowing dice terminology.
2. **Your budget:** choose up to ₱250, up to ₱500, up to ₱700, or any budget. Labels explicitly describe maximum prices and include the boundary price.
3. **Your style:** choose colorful resin, classic acrylic, weighty metal, or no preference. Describe style as a preference; type and budget are requirements.

No answer is preselected. Continue requires a choice, with inline feedback and focus on the unanswered group. Back preserves answers. Show results only on the final step. The user can close the quiz to its intro, reopen with answers preserved in page memory, edit answers, or start over.

## Matching and results
Use the existing PRODUCTS array as the only catalog source. Filter by chosen type (unless exploring) and budget first. Rank preferred materials first, with price ascending and catalog order as deterministic tie breakers. Show up to three options.

Each result includes its illustration, name, price, specifications, and reasons tied to the answers. Label a material mismatch honestly (for example, “Within your budget; resin alternative to your metal preference”). Never recommend over-budget products or the wrong dice type as matches. If nothing fits, explain why, provide edit-budget/back-to-answers actions, and keep the collection accessible. Do not imply a single die is a full campaign set.

Result cards offer existing product details and add-to-bag actions; reuse their established behavior. Answers are retained only in page memory, not stored or sent elsewhere. Existing catalog filters do not silently alter quiz results, and quiz answers do not silently alter catalog filters.

## Approaches
- **Guided section (selected by user):** keeps the shop visible, supports a clear presentation flow, and works without managing another modal.
- **Popup:** takes less page space, but covers the collection and complicates product-details dialogs.

## Constraints and builder decisions
Use native fieldsets, legends, radios, and buttons. Manage focus when changing steps/results, announce progress, use visible selection states, provide large touch targets, and honor reduced-motion preferences. Stack results and options on small screens without horizontal overflow. No new runtime dependencies or external services.

Detailed wording, spacing, and icons are implementation choices. This phase covers the quiz; the other accepted feature ideas remain queued in the roadmap.

## Acceptance checks
- A first-campaign shopper with ₱700 sees full sets within budget and understandable reasons.
- A metal D20 shopper with ₱500 sees Forged D20 first.
- A full-set shopper with ₱250 gets an honest no-match state.
- Material preferences can show explicitly explained alternatives within type and budget.
- Back/edit/reset, missing answers, keyboard navigation, mobile layout, product details, and add-to-bag work.
- Existing filtering, bag persistence, and checkout continue to pass their browser checks.

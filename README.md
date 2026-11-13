# Sidequest dice shop

A responsive class demo built with HTML, CSS, and vanilla JavaScript. No backend, runtime dependencies, build step, or external assets are required.

## Open the shop

Open `dist/index.html` in a modern browser. For consistent local-storage behavior, use the included local server with Node.js:

```sh
npm start
```

Then visit http://127.0.0.1:4173. Installing dependencies is not required to run the shop.

## Project files

- `dist/index.html`: page structure, filters, and dialogs.
- `dist/styles.css`: responsive styling, keyboard focus, and reduced-motion support.
- `dist/app.js`: sample products, SVG dice illustrations, filtering, cart, and simulated checkout.
- `dist/finder.js`: guided dice finder and budget-aware product recommendations.
- `dist/compare.js`: shared comparison selections, selection bar, and comparison dialog.
- `dist/guide.js`: beginner explanations, contextual quiz/product help, and guide-to-collection browsing.
- `dist/wishlist.js`: saved favorites, shared heart controls, and safe moves into the bag.
- `dist/catalog.js`: visible active filters, individual chip removal, and product sorting.
- `dist/cart-undo.js`: persistent-in-page recovery of confirmed bag removals.
- `dist/orders.js`: private order snapshots, order history, deletion, and current-price reorder review.
- `dist/receipt.js`: historical order-summary preview and native browser printing.
- `dist/roller.js`: reusable D6/D20 widgets, bounded random results, animation, and roll history.

Edit the `PRODUCTS` array in `dist/app.js` to change product names, prices, specifications, and colors. Prices are in Philippine pesos.

## HCI demonstration

### Find My Dice — guided discovery

Above the collection, choose **Find my dice** for three short steps: dice needs, maximum budget, and material preference. Move back without losing answers, edit the results, or start over. Answers stay in page memory only.

The finder respects dice type and maximum price. Material preferences affect ranking; alternatives are clearly explained. Result cards reuse product details and add-to-bag actions. If no products fit, the finder explains the minimum price and lets the shopper change their budget.

Presentation scenario: choose **My first campaign → Up to ₱700 → Colorful resin**. Explain the two affordable full sets and their matching reasons, open product details, then add one to the bag. Repeat with **Up to ₱250** to demonstrate a helpful no-match state. Use **A single D20 → Up to ₱500 → Weighty metal** to demonstrate preferred-material ranking.

### Product comparison — informed choices

Choose **Compare this dice** on a product card, finder result, or product-details dialog. Select two or three products, then use **Compare** in the selection bar. Selections stay synchronized while searching, filtering, or editing quiz answers; they are held only for the current page session.

The comparison table shows prices, dice types, materials, sizes, and package contents. **Show differences only** removes identical specification rows. Remove products individually or clear the selection bar. You can add a product directly to the bag, with confirmation inside the comparison dialog. On smaller screens, swipe the table horizontally or focus it and use the arrow keys; Escape closes the dialog and restores focus.

Presentation scenario: compare **Ember D20** and **Forged D20**. Toggle **Show differences only** to isolate their different prices and materials, explain that their size and package contents match, and add a favorite to the bag. Add a third product, then attempt a fourth to demonstrate the selection limit and recovery guidance.

### Beginner’s guide — learn as you shop

Open **Dice, decoded.** between the finder and collection, or follow **New to dice? Read the beginner’s guide** from the finder. The expandable guide explains dice notation, the seven-piece set, percentile dice, and the resin/acrylic/metal choices in this sample catalog. The dice terminology links to the official D&D Basic Rules; material descriptions refer to sample products.

Use a **Browse** button to replace the current search and filters with that category. Keyboard focus moves to the collection heading, while the bag and comparison selections remain intact. The full guide also opens directly at `#dice-guide`.

Short help disclosures appear on the quiz’s dice-needs and material steps and inside product details. They can be opened using the keyboard without losing answers or opening another modal.

Presentation scenario: open the guide, explain why D% is not a physical hundred-sided die, browse seven-piece sets, then compare two sets. Open a metal product’s details and use its contextual help to explain the tray suggestion.

### Saved wishlist — keep a favorite for later

Use the heart on collection cards, quiz results, or product details to save a favorite. The header’s **Wishlist** link shows the number of unique saved products and opens their own page. Favorites survive refreshes in the same browser and synchronize between tabs on the same origin. Only known product IDs are stored under `sidequest-wishlist-v1`; there are no accounts or personal details.

**Move to bag** adds one unit and removes the favorite after the bag is successfully saved. If the product is already at the 99-unit limit, it stays in the wishlist. If the bag cannot be saved, the item is added for the current page and the favorite is kept as a backup, with a clear explanation. If wishlist storage is blocked, favorites still work for the current page and the page explains that they may disappear on refresh.

Presentation scenario: save a product, open Wishlist, refresh to demonstrate persistence, inspect its details, then move it to the bag. Its wishlist count decreases and bag count increases. Demonstrate removal and the empty-state collection link.

### Active filters and sorting — find a clearer path

Search and dice-type/material/price selections appear as removable chips above the product grid. Remove one chip to clear only that constraint, or use **Clear all** to reset the search and filters. Chips also appear when no products match, so shoppers can loosen constraints without starting over.

**Sort by** offers Featured (the original catalog order), both price directions, and A–Z/Z–A names. Sorting applies after filtering and stays selected when filters are cleared, guide browse buttons are used, or shoppers visit their bag/wishlist. A refresh returns to Featured and the default filters. Favorites and comparison selections stay synchronized through catalog updates.

Presentation scenario: choose D20, Metal, and Under ₱250 to show no matches. Remove only the price chip to reveal Forged D20. Remove the material chip to see all D20s, then sort by price to compare the affordable options. Clear all filters and demonstrate that the selected sort order remains.

### Undo bag removal — recover from a change of heart

After confirming a removal, the bag shows the removed product and quantity with **Undo** and **Dismiss**. Undo has no timer and restores removals one at a time, newest first. It also works after removing the last item, when checkout is disabled. Browse the shop and return to the bag without losing recovery.

Undo restores the quantity and original line position. If that product was added again, it merges into the existing line at its current position. If merging would exceed 99, the bag and history stay unchanged and an explanation tells the shopper to reduce the quantity before trying again. Saved/restored totals update immediately; storage failures are clearly identified as lasting only for the current page.

Removal history lives only in page memory. It clears when checkout begins, an order completes, the page refreshes, the bag is updated in another tab, or **Dismiss** is used. A wishlist-only update does not clear it. Existing confirmation still supports canceling removal.

Presentation scenario: increase a product to three, remove it, point out the updated total and Undo action, then restore it with the keyboard. Remove every item to show that an empty bag can still be recovered. Remove two products and undo twice to demonstrate recovery order.

### Order history and reorder

After confirmed checkout, a product-only snapshot is saved under `sidequest-orders-v1`: order number, timestamp, product IDs/names, quantities, unit prices, and original total. Delivery names, addresses, and phone numbers are excluded. Open **Orders** in the header or **View order history** after checkout. Records survive refresh on the same browser/origin and synchronize across tabs.

Expand a record to inspect its original items and prices. **Reorder** opens a review at current catalog prices, explicitly identifies unavailable products, and checks the combined bag quantity before adding anything. Existing bag items are preserved. Unavailable products require accepting **Add available items**; quantity conflicts prevent all additions until corrected. The review updates when another tab changes the bag/history. Historical prices remain unchanged.

Delete a record or clear history through a confirmation. If saving fails, changes remain available for the current page and are reconciled with cross-tab updates instead of silently disappearing. No delivery details are stored or reused. Customer-facing checkout/history/footer copy uses neutral Order/Place order wording as requested; the underlying browser-only architecture has no payment or shipping integration.

Presentation scenario: complete checkout, open Orders, refresh to demonstrate persistence, expand the saved record, and press Reorder. Show the review, then add its quantities to a bag that already contains products. Explain original versus current prices, deletion confirmation, and the unavailable/quantity-conflict recovery states.

### Printable order summary

Choose **Order summary** on a saved order or checkout completion to open its preview. **Print summary** opens the browser’s print options, where you can print or choose Save as PDF. Ctrl+P also works from the preview. The native print window controls printer, paper size, headers/footers, and destination.

The summary uses the original order number/date, item names, quantities, unit prices, line totals, and total in PHP with two decimal places. It includes retired products from the saved snapshot, never current catalog prices or delivery/contact fields. It uses neutral Order summary wording without payment/shipping status claims.

Only the selected document prints: site navigation, buttons, notifications, other orders, and the shop are excluded. Print styling uses a white page, automatic paper size, 14 mm margins, repeated table headings, and rows/totals that stay together where possible. Long product names wrap. Canceling print leaves the preview available.

Direct `#receipt/SQ-XXXXXXXX` links reopen records saved in the same browser. Unknown/deleted records return to order history. An order deleted in another tab invalidates an open summary; page-session orders remain printable even if saving failed.

Presentation scenario: complete an order, open Order summary, and show the clean document before opening Print summary. Choose Save as PDF in the browser to share it. Repeat from an older order to show that historical prices remain unchanged.

### Interactive D6/D20 roller

Choose **Test your luck** in the hero or scroll below the collection. Select D6 or D20 and press **Roll**. The result is shown on the illustrated die and announced to assistive technology. A short animation is skipped entirely when reduced motion is enabled. Rapid repeated activation during a roll produces only one result.

The latest eight rolls are labelled with their dice types. **Clear history** removes that list while keeping the last displayed result. Results live only for the current page visit and do not change the bag, wishlist, or other shopping data.

Product details include an expandable compact roller. D6 products start with D6; D20 products and sets start with D20. Both choices remain available. This roller has independent results/history, starts fresh when another product is opened, and cancels unfinished rolls when closed.

Presentation scenario: roll a D6, switch to D20, show the labelled recent results, and clear the history. Open a D6 product’s details to demonstrate its matching default. Enable the device’s reduced-motion preference to demonstrate the immediate result without animation.

### Shopping and checkout

1. Search for “D20” and combine dice-type, material, and price filters.
2. Open product details, change the quantity, and add to the bag. A notification appears.
3. Open the bag, change quantities, and refresh to demonstrate persistence.
4. Remove an item, first canceling and then confirming the dialog.
5. Continue to checkout. Submit an empty form to demonstrate validation feedback.
6. Enter sample details, review the order, and observe the progress indicator.
7. Choose Place order, cancel once, and then confirm. The completion step shows an order number, saves the product-only order history, and clears the saved bag.

Only product IDs and quantities are saved under `sidequest-cart-v1` in localStorage. Delivery details stay in memory and are cleared after completing an order. If browser storage is blocked, the cart works for the current page session and a notification explains the limitation. Quantities are whole numbers from 1 to 99.

This is a simulated storefront: there are no real payments, accounts, shipping services, or submitted orders. Product illustrations and product claims are sample content.

## Browser checks

Development-only test setup:

```sh
npm install
npx playwright install chromium
npm test
```

The suite checks desktop and mobile filtering, dialogs, quantities, cart persistence, validation, checkout cancellation/completion, and keyboard interaction.

It also checks finder recommendations, missing-answer feedback, back/edit/reset behavior, no-match recovery, keyboard operation, and viewport fit. Comparison checks cover selection limits, shared selection state, filtering, exact specifications, differences filtering, removal recovery, modal keyboard navigation, responsive layout, and visible notifications. `npm test` runs matching/RNG unit tests and browser tests; `npm run test:unit` runs the matching and dice-result unit tests. Browser checks use two workers to keep local runs reliable.

The remaining presentation improvements are tracked in `docs/feature-roadmap.md`.

Guide checks cover keyboard disclosures, direct/repeated links, category browsing with previous filters, preserved bag/comparison choices, mobile layout, and contextual help in quiz/product dialogs.

Wishlist checks cover save/refresh/removal, safe moves and quantity limits, malformed/blocked storage, cross-tab updates, shared hearts, modal focus recovery, and 320px layouts. A separate regression verifies that a saved favorite survives when bag writes fail.

Catalog checks verify all five sort orders, restoring Featured order, individual/combined filter removal, no-results recovery, preserved wishlist/comparison state, guide integration, keyboard focus, accessible chip values, and long escaped search terms on 320px screens.

Undo checks cover quantity/position/total restoration and saved state, several removals, empty-bag recovery, re-added quantity limits, checkout and cross-tab invalidation, storage failure messages, dismissal, and accessible keyboard focus.

Order checks cover confirmed/canceled checkout, snapshot privacy and refresh, historical/current pricing, additive reorder, missing products and quantity conflicts, deletion, malformed/blocked storage, pending local changes, cross-tab bag/history updates, modal focus, neutral UI copy, and 320px layouts.

Summary checks cover historical prices and decimal totals, direct navigation/refresh, native print delegation, print-only visibility, white paper, escaped names, retired products, failed-storage checkout, multipage PDF output, and cross-tab deletion. Browser-generated PDF fixtures are development artifacts and are not included in source commits.

Roller unit checks cover both dice boundaries, rejection of excess random words, and invalid inputs. Browser checks cover both types, consecutive results, duplicate activation, eight-roll history, clearing, product defaults, closing/reopening, reduced motion, keyboard operation, 320px layout, and no storage/bag side effects.

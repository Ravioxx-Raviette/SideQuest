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

Edit the `PRODUCTS` array in `dist/app.js` to change product names, prices, specifications, and colors. Prices are in Philippine pesos.

## HCI demonstration

1. Search for “D20” and combine dice-type, material, and price filters.
2. Open product details, change the quantity, and add to the bag. A notification appears.
3. Open the bag, change quantities, and refresh to demonstrate persistence.
4. Remove an item, first canceling and then confirming the dialog.
5. Continue to checkout. Submit an empty form to demonstrate validation feedback.
6. Enter sample details, review the order, and observe the progress indicator.
7. Place the demo order, cancel once, and then confirm. The completion step shows an order number and clears the saved bag.

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

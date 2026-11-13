# Product comparison — priority 2

Continue the approved presentation roadmap with comparing up to three products by price, dice type, material, size, and package contents. Reuse the browser-only stack and established branding.

## Interaction
Compare toggles appear on catalog cards, finder results, and product details. Selection is shared across these entry points and survives filtering and quiz rerenders during the page session. Selecting a fourth product gives useful feedback without replacing a selection. A bottom selection bar lists products, individual removal, clear-all, and a Compare button enabled for two or three products.

Open an accessible native dialog with a semantic comparison table. Keep product names and add-to-bag buttons visible as columns; rows show the existing catalog data. A Show differences only checkbox hides identical specification rows without removing product identification or actions. Removing a column updates the table and focus. If fewer than two remain, show an explanation and a Choose more dice action. Escape/close returns focus to an available control. Adding products uses existing cart behavior. Avoid opening another product-details modal inside this modal.

On small screens the table scrolls within a labelled keyboard-focusable region; the document itself does not overflow. Include a visible scroll hint and sticky row labels. The fixed selection bar must not obscure the final page content; hide it with the shop when navigating to bag/checkout. No saved personal data or runtime dependencies.

## Approach and scope
Use the shop's native-dialog pattern for a focused side-by-side view. An inline wide table would lengthen the collection substantially; a separate page would require more navigation and routing changes for the same task. Keep all existing shopping and finder flows covered. Larger text, wishlist, guides, and the remaining roadmap items are subsequent phases.

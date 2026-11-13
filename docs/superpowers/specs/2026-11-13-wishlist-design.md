# Saved wishlist — priority 4

Add the next explicitly requested roadmap feature: browser-local saved favorites with a header count, a dedicated Wishlist view, and moving a favorite into the bag.

Heart toggles on collection images, finder result images, and product details share aria-pressed state. Store only unique, known product IDs in sidequest-wishlist-v1. Ignore invalid/unknown entries, recover safely from malformed JSON, and synchronize storage changes across tabs. If browser storage is blocked, keep the wishlist usable for the current page and explain the persistence limit.

The #wishlist view shows saved products, prices, details, individual removal, and Move to bag. Moving adds one unit using existing bag rules, then removes the favorite only if that succeeds. At the 99-unit cap retain the favorite and show useful feedback. Do not duplicate saved entries or silently change quantities. Empty state links to the collection. No accounts, backend, or dependencies.

Storage failure behavior: removing a saved favorite also requires the new bag contents to be saved successfully. If a bag write fails, keep the favorite as a backup and clearly explain that the bag addition only lasts for this page.

Native navigation supports browser back/forward and direct #wishlist loads. Keep the header compact on mobile. Restore focus after removing/moving cards, cross-tab updates, and closing details whose opener was removed. Keep cart, comparison, finder, guide, and checkout behavior intact. Comparison tray remains associated with the shop.

Use a dedicated view rather than a modal so favorites can hold the full collection without modal nesting. Existing branding and card patterns apply; heart toggles use compact image-corner placement to keep product cards readable.

# Active filters and sorting — priority 5

Continue the explicitly requested roadmap with visible removable chips for search, dice type, material, and price. Each chip removes only its own filter. A Clear all action resets filters and search. Keep sort separate: clearing filters does not change the selected order.

Add a labelled native Sort by selector: Featured (existing curated catalog order), Price: low to high, Price: high to low, Name: A–Z, Name: Z–A. Sort after filtering without mutating PRODUCTS. Retain sorting when filters change, chips are removed, guide browse actions run, or the user visits another view. No persistence requirement for sort/filter state across refresh.

Display chips between the toolbar and product grid. Hide the chip group when no filters are active. Include search even if it returns zero results. Escape user search text and wrap long values within the viewport. On removing a focused chip, focus a remaining chip or search; Clear all focuses search. Keep the existing result-count live announcement and include the selected order. Preserve saved favorites, comparison selection, bag, and finder behavior.

Use the established visual system and native controls. Responsive search/sort layout must fit 320px. No dependencies, backend, or external data. The user has approved continuing with this feature; use the existing inline catalog rather than a separate filter dialog.

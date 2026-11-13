# Undo bag removal — priority 6

Add the next requested feature without removing existing removal confirmation. After confirmed removal, show a persistent inline recovery strip in the bag with the most recently removed product/quantity, Undo, and Dismiss. Maintain session-memory removal history so successive Undo actions recover several removals in reverse order. No timeout.

Restore the exact quantity and original position; if the product was added again, merge only when the combined quantity is at most 99. Otherwise leave the history and current bag untouched and explain how to make room. Save restored cart state using existing persistence. If saving fails, clearly explain the restored/removed state lasts only for this page. Never obscure a real storage failure with unconditional success.

When merging with a product the shopper added again, keep that line’s current position so Undo preserves the newer shopping action. Original-position restoration applies when reinserting an absent product.

Keep recovery available while browsing other views and returning to the bag. Clear history on valid checkout entry, successful order completion, a cart storage update from another tab, refresh, or explicit Dismiss. Invalid empty checkout redirects must not discard recovery. Wishlist storage updates alone must not clear it.

Focus Undo after confirmation, the restored product after recovery, and a useful bag control after dismiss. Show an empty bag with Undo still available after removing its last item. Use a labelled region and accessible feedback. Restore nothing on cancellation or dismissal. Fit narrow screens and preserve every earlier feature.

An inline strip gives keyboard users enough time; a transient notification would expire or be replaced by unrelated feedback. No backend or runtime dependencies.

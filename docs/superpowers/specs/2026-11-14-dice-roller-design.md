# Interactive D6/D20 dice roller

Add the explicitly requested next feature: a browser-local D6/D20 roller with a prominent result, a short roll animation, and the latest eight rolls. Use native radio choices and a Roll button, an accessible final-result announcement, and clear-history control. No accounts, sounds, autoplay, storage, or dependencies. Do not change shopping state or add demo labels.

Place the main roller after the collection, with a Test your luck link in the hero and a #dice-roller anchor. Product details offer an expandable compact roller: D6 products default to D6; D20 and seven-piece sets default to D20, with both types available. Contexts have independent results/history. Reopening product details starts fresh, and closing the modal cancels any unfinished roll.

Generate integer results uniformly in 1–6 or 1–20. Prefer crypto.getRandomValues with rejection sampling to avoid modulo bias; use a Math.random-generated word if crypto is unavailable. A single user action produces one result; guard repeated activation during the approximately half-second animation. Keep the Roll button keyboard-focused with aria-disabled rather than dropping focus through native disabling. Disable type changes while rolling. Announce only the final result through a polite live region, with a short message for a D20 roll of 20.

Respect prefers-reduced-motion: no animated movement or artificial delay. Changing type clears the displayed result but keeps labelled roll history. Clearing history preserves the latest result and focuses Roll. Responsive 320px layout and native modal focus containment must remain intact. All previous features remain covered.

# Beginner dice and materials guide — priority 3

Continue the requested roadmap with a plain-language guide to dice notation, the seven-piece set, and the materials in the sample collection. The user explicitly approved proceeding with this feature.

## Experience
An expandable guide between the finder and collection keeps the main shop compact. Explain D notation and 2D6, identify D4/D6/D8/D10/D%/D12/D20, and clarify that D% is a ten-sided percentile-tens die used with a D10. Show what the shop's seven-piece sets include without promising that one set covers every game. Describe the sample resin/acrylic/metal offerings based on the catalog rather than claiming one material rolls better.

Browse actions for singles, full sets, and each material replace the search and filters with the chosen category. Explain this beside the actions. Preserve comparison selections and the bag. Open the collection at its heading with keyboard focus and announce the filter change.

Short native disclosure explanations appear on quiz steps about dice needs and materials, and inside product details. Product help matches that product's type/material and does not open nested dialogs. A link from the finder opens the full guide. Support #dice-guide on direct load and repeated navigation. Keep all content usable on mobile, keyboard, and reduced-motion settings.

## Approach
Use a native inline disclosure plus contextual help; a separate guide page adds navigation, while another modal would complicate existing product/comparison dialogs. Reuse the current visual system and HTML/CSS/JavaScript. No dependencies, external assets, or backend.

## Content reference
Dice terminology and percentile convention checked against https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game . Include a small source link in the guide. Material descriptions describe the sample catalog, not verified real products.

## Acceptance
Guide opens via keyboard and finder link, and on direct #dice-guide navigation. Browse actions reset previous filters and show the correct products, focus the collection heading, and preserve bag/comparison state. Context help is usable without leaving the quiz or closing a product dialog. Existing quiz, comparison, and checkout checks remain green.

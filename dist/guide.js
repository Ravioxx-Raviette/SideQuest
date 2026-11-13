"use strict";

// Material descriptions refer to this demo's sample catalog.
const GUIDE_MATERIAL_NOTES = {
  Resin: "Our resin collection includes colorful single dice and seven-piece sets.",
  Acrylic: "Our acrylic options are the classic Ivory D6 and ocean-colored Tide D20, both single dice.",
  Metal: "Our metal dice are described with a weighty feel. Use a dice tray to help protect the table.",
};
function diceGuideHelp(product) {
  const type = product.type === "Set"
    ? "This is a seven-piece set: D4, D6, D8, D10, D%, D12, and D20. Check your game’s requirements; you may need extra dice."
    : product.type === "D20"
      ? "D20 means a twenty-sided die. This product includes one die, rather than a set."
      : "D6 means a six-sided die. This product includes one die, rather than a set.";
  return `<details class="context-guide"><summary>New to ${product.type === "Set" ? "dice sets" : product.type}? Learn the basics</summary><div><p>${escapeHTML(type)}</p><p><strong>${escapeHTML(product.material)}:</strong> ${escapeHTML(GUIDE_MATERIAL_NOTES[product.material] || "Check the product specifications for material details.")}</p></div></details>`;
}
function finderGuideHelp(key) {
  if (key === "type") return `<details class="context-guide"><summary>D6, D20, or a set? A quick explanation</summary><div><p>A D6 is six-sided; a D20 is twenty-sided. A set includes seven different dice. Choose a single die for a specific need, or ask your game group which dice to bring.</p><a class="text-button" href="#dice-guide" data-guide-link>Explore the full beginner’s guide</a></div></details>`;
  if (key === "material") return `<details class="context-guide"><summary>What’s different about the materials?</summary><div><dl>${Object.entries(GUIDE_MATERIAL_NOTES).map(([name, note]) => `<dt>${name}</dt><dd>${escapeHTML(note)}</dd>`).join("")}</dl><p>Material doesn’t change how many dice a product includes. Check the package contents, too.</p></div></details>`;
  return "";
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-guide-link]");
  if (link) {
    event.preventDefault();
    document.querySelector("#guide-disclosure").open = true;
    if (location.hash === "#dice-guide") route();
    else location.hash = "dice-guide";
    return;
  }
  const browse = event.target.closest("[data-guide-type], [data-guide-material]");
  if (!browse) return;
  resetFilters();
  let category;
  if (browse.dataset.guideType) {
    const type = browse.dataset.guideType;
    const radio = document.querySelector(`input[name="type"][value="${type}"]`);
    if (!radio) return;
    radio.checked = true;
    category = type === "Set" ? "seven-piece sets" : `${type} dice`;
  } else {
    document.querySelector("#material").value = browse.dataset.guideMaterial;
    category = `${browse.dataset.guideMaterial.toLowerCase()} dice`;
  }
  renderProducts();
  notify(`Showing ${category}. Previous search and filters cleared.`);
  if (location.hash === "#collection") route();
  else location.hash = "collection";
});

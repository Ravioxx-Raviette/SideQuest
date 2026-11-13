"use strict";

// Loaded before the catalog so every entry point renders the same selection state.
const comparedDice = new Set();
function comparisonControl(product) {
  const selected = comparedDice.has(product.id);
  return `<button type="button" class="compare-toggle" data-compare="${product.id}" aria-label="Compare ${escapeHTML(product.name)}" aria-pressed="${selected}"><span aria-hidden="true" data-compare-mark>${selected ? "✓" : "+"}</span><span data-compare-label>${selected ? "Selected to compare" : "Compare this dice"}</span></button>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const dialog = document.querySelector("#comparison-dialog");
  const content = document.querySelector("#comparison-content");
  const tray = document.querySelector("#comparison-tray");
  const trayContent = document.querySelector("#comparison-selection");
  const heading = document.querySelector("#comparison-title");
  const feedback = document.querySelector("#comparison-status");
  let differencesOnly = false;
  let opener = null;
  const selectedProducts = () => [...comparedDice].map(productById).filter(Boolean);

  function focusShopControl() {
    const candidates = [
      document.querySelector('#products [data-compare][aria-pressed="true"]'),
      document.querySelector("#products [data-compare]"),
      document.querySelector("#search"),
      document.querySelector("#shop-link"),
    ];
    candidates.find((element) => element?.isConnected && !element.disabled && element.getClientRects().length)?.focus();
  }
  function restoreFocus() {
    if (opener?.isConnected && !opener.disabled && opener.getClientRects().length) opener.focus();
    else focusShopControl();
  }
  function syncSelection() {
    document.querySelectorAll("[data-compare]").forEach((button) => {
      const selected = comparedDice.has(button.dataset.compare);
      button.setAttribute("aria-pressed", String(selected));
      button.querySelector("[data-compare-mark]").textContent = selected ? "✓" : "+";
      button.querySelector("[data-compare-label]").textContent = selected ? "Selected to compare" : "Compare this dice";
    });
    document.querySelectorAll(".comparison-limit").forEach((message) => message.remove());
    const products = selectedProducts();
    tray.hidden = products.length === 0;
    document.body.classList.toggle("has-comparison", products.length > 0);
    trayContent.innerHTML = `<div class="comparison-tray-top"><div><strong>${products.length} of 3 selected</strong><p>Pick at least two. Find the details that matter.</p></div><div class="comparison-tray-actions"><button class="text-button" type="button" data-comparison-action="clear">Clear comparison</button><button class="button primary" type="button" data-comparison-action="open" aria-label="Compare selected dice" ${products.length < 2 ? "disabled" : ""}>Compare (${products.length}) <span aria-hidden="true">↗</span></button></div></div><ul class="comparison-selected-list" aria-label="Selected dice">${products.map((product) => `<li><span>${escapeHTML(product.name)}</span><button type="button" data-compare-remove="${product.id}" aria-label="Remove ${escapeHTML(product.name)} from comparison">×</button></li>`).join("")}</ul>`;
    measureTray();
  }
  function measureTray() {
    document.body.style.setProperty("--comparison-tray-height", `${tray.getBoundingClientRect().height}px`);
  }
  function renderTable() {
    const products = selectedProducts();
    if (products.length < 2) {
      content.innerHTML = `<div class="comparison-empty"><span aria-hidden="true">◇</span><h3>${products.length ? "Choose one more to compare." : "A fresh comparison starts here."}</h3><p>${products.length ? `${escapeHTML(products[0].name)} is still selected. Add another product to see them side by side.` : "Select two or three dice from the collection or your quiz matches."}</p><button class="button primary" type="button" data-comparison-action="close">Choose more dice</button></div>`;
      return;
    }
    const specs = [
      ["price", "Price", (product) => money(product.price)],
      ["type", "Dice type", (product) => product.type === "Set" ? "7-piece set" : `${product.type} · single die`],
      ["material", "Material", (product) => product.material],
      ["size", "Size", (product) => product.size],
      ["contents", "Includes", (product) => product.contents],
    ];
    const visibleSpecs = specs.filter(([, , value]) => !differencesOnly || new Set(products.map(value)).size > 1);
    content.innerHTML = `<div class="comparison-toolbar"><label><input type="checkbox" id="comparison-differences" ${differencesOnly ? "checked" : ""}> Show differences only</label><p>${products.length} products · ${differencesOnly ? "Different specifications" : "All specifications"}</p></div><p class="comparison-scroll-hint" id="comparison-scroll-hint">On smaller screens, swipe across the table or focus it and use the arrow keys.</p><div class="comparison-scroll" role="region" aria-label="Dice comparison table" aria-describedby="comparison-scroll-hint" tabindex="0"><table class="comparison-table" style="--compare-columns:${products.length}"><caption class="sr-only">Compare selected dice by price, dice type, material, size, and included dice.</caption><thead><tr><td class="comparison-row-label comparison-corner">AT A GLANCE</td>${products.map((product) => `<th scope="col"><div class="comparison-product-art" style="--card-bg:${product.bg}"><img src="${productImage(product)}" alt="" width="180" height="150"></div><h3>${escapeHTML(product.name)}</h3><button class="text-button comparison-remove" type="button" data-compare-remove="${product.id}" aria-label="Remove ${escapeHTML(product.name)} from comparison">Remove <span aria-hidden="true">×</span></button></th>`).join("")}</tr></thead><tbody>${visibleSpecs.map(([key, label, value]) => `<tr data-compare-row="${key}"><th class="comparison-row-label" scope="row">${label}</th>${products.map((product) => `<td>${escapeHTML(value(product))}</td>`).join("")}</tr>`).join("")}</tbody><tfoot><tr><th class="comparison-row-label" scope="row">Your next roll</th>${products.map((product) => `<td><button type="button" class="button primary" data-add="${product.id}" aria-label="Add ${escapeHTML(product.name)} to cart">Add to bag <span aria-hidden="true">+</span></button></td>`).join("")}</tr></tfoot></table></div><p class="comparison-note">Prices are per product. A seven-piece set includes seven dice; a single die includes one.</p>`;
  }
  function removeProduct(id) {
    if (!comparedDice.delete(id)) return;
    const wasInDialog = dialog.open;
    const wasInTray = tray.contains(document.activeElement);
    syncSelection();
    if (wasInDialog) {
      renderTable();
      (content.querySelector("[data-compare-remove]") || content.querySelector("button"))?.focus();
    } else if (wasInTray) {
      const remaining = tray.querySelector("[data-compare-remove]");
      if (!tray.hidden && remaining) remaining.focus();
      else focusShopControl();
    }
    notify("Comparison updated.");
  }
  document.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-compare]");
    if (toggle) {
      const id = toggle.dataset.compare;
      if (!productById(id)) return;
      if (comparedDice.has(id)) comparedDice.delete(id);
      else if (comparedDice.size >= 3) {
        const message = "Compare up to 3 products. Remove one to choose another.";
        notify(message, true);
        if (toggle.closest("dialog")) {
          toggle.closest("dialog").querySelector(".comparison-limit")?.remove();
          toggle.insertAdjacentHTML("afterend", `<p class="comparison-limit" role="alert">${message}</p>`);
        }
        return;
      } else comparedDice.add(id);
      syncSelection();
      notify(`${productById(id).name} ${comparedDice.has(id) ? "selected for" : "removed from"} comparison.`);
      return;
    }
    const remove = event.target.closest("[data-compare-remove]");
    if (remove) { removeProduct(remove.dataset.compareRemove); return; }
    const action = event.target.closest("[data-comparison-action]");
    if (!action) return;
    if (action.dataset.comparisonAction === "open") {
      if (comparedDice.size < 2 || document.querySelector("dialog[open]")) return;
      opener = action;
      feedback.textContent = "";
      renderTable();
      dialog.showModal();
      heading.focus();
    } else if (action.dataset.comparisonAction === "close") dialog.close();
    else if (action.dataset.comparisonAction === "clear") {
      comparedDice.clear();
      syncSelection();
      if (dialog.open) dialog.close();
      else focusShopControl();
      notify("Comparison cleared. Choose your next favorites.");
    }
  });
  content.addEventListener("change", (event) => {
    if (event.target.id !== "comparison-differences") return;
    differencesOnly = event.target.checked;
    renderTable();
    content.querySelector("#comparison-differences")?.focus();
  });
  // Keep confirmation inside the modal's accessible tree, and reuse cart rules.
  dialog.addEventListener("click", (event) => {
    const add = event.target.closest("[data-add]");
    if (!add) return;
    event.stopPropagation();
    const id = add.dataset.add;
    const before = cart.find((item) => item.id === id)?.quantity || 0;
    addToCart(id);
    const after = cart.find((item) => item.id === id)?.quantity || 0;
    feedback.textContent = after > before
      ? `${productById(id).name} added to your bag. ${after} in your bag.`
      : "You can add up to 99 of each product. Update your bag to add more.";
  });
  dialog.addEventListener("close", restoreFocus);
  new ResizeObserver(measureTray).observe(tray);
  syncSelection();
});

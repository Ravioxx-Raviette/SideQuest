"use strict";

const WISHLIST_KEY = "sidequest-wishlist-v1";
let wishlistIds = new Set();
let wishlistReady = false;
let wishlistCanSave = true;
let wishlistDetailOpener = null;
// One heart shape for both states; CSS fills it when aria-pressed="true", so
// saved and unsaved hearts stay the same size and style.
const WISHLIST_HEART = `<svg class="heart-icon" viewBox="0 0 24 24" focusable="false"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.5 3.4 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4Z"/></svg>`;

function readSavedWishlist() {
  let raw;
  try { raw = localStorage.getItem(WISHLIST_KEY); }
  catch { wishlistCanSave = false; return wishlistIds; }
  try {
    const saved = JSON.parse(raw || "[]");
    return new Set(Array.isArray(saved) ? saved.filter((id) => typeof id === "string" && productById(id)) : []);
  } catch { return new Set(); }
}
function ensureWishlist() {
  if (wishlistReady) return;
  wishlistIds = readSavedWishlist();
  wishlistReady = true;
}
function wishlistControl(product, compact = false) {
  ensureWishlist();
  const selected = wishlistIds.has(product.id);
  const button = `<button type="button" class="wishlist-toggle${compact ? " wishlist-toggle-compact" : ""}" data-wishlist="${product.id}" aria-label="Save ${escapeHTML(product.name)} to wishlist" aria-pressed="${selected}"><span aria-hidden="true" data-wishlist-mark>${WISHLIST_HEART}</span>${compact ? "" : `<span data-wishlist-label>${selected ? "Saved to wishlist" : "Save to wishlist"}</span>`}</button>`;
  return compact ? button : `<div class="wishlist-action">${button}<p class="wishlist-feedback" data-wishlist-feedback role="status" aria-live="polite"></p></div>`;
}
function renderWishlist() {
  ensureWishlist();
  const content = document.querySelector("#wishlist-content");
  const active = document.activeElement;
  const restore = content.contains(active) && !document.querySelector("dialog[open]");
  const previousCards = [...content.querySelectorAll(".wishlist-card")];
  const oldIndex = previousCards.indexOf(active?.closest(".wishlist-card"));
  const products = [...wishlistIds].map(productById).filter(Boolean);
  content.innerHTML = products.length ? `<div class="wishlist-grid">${products.map((product) => `<article class="wishlist-card"><div class="product-art" style="--card-bg:${product.bg}"><img src="${productImage(product)}" alt="${escapeHTML(product.name)} dice illustration" width="260" height="220"></div><div class="product-info"><p class="product-meta">${product.material} · ${product.type === "Set" ? "7-piece set" : `${product.type} · Single die`}</p><div class="product-name-line"><h2>${escapeHTML(product.name)}</h2><strong>${money(product.price)}</strong></div><p class="wishlist-description">${escapeHTML(product.description)}</p><div class="wishlist-card-actions"><button type="button" class="button secondary" data-detail="${product.id}" aria-label="View details for ${escapeHTML(product.name)}">View details</button><button type="button" class="button primary" data-wishlist-move="${product.id}" aria-label="Move ${escapeHTML(product.name)} to bag">Move to bag <span aria-hidden="true">→</span></button></div><button class="text-button wishlist-remove" type="button" data-wishlist-remove="${product.id}" aria-label="Remove ${escapeHTML(product.name)} from wishlist">Remove from wishlist</button></div></article>`).join("")}</div>` : `<div class="empty-state wishlist-empty"><span class="wishlist-empty-heart" aria-hidden="true">${WISHLIST_HEART}</span><h2>Your favorites start with a little curiosity.</h2><p>Tap a heart on any dice you like. They’ll be waiting here for your next adventure.</p><a class="button primary" href="#collection">Explore the collection <span aria-hidden="true">↗</span></a></div>`;
  if (restore) {
    const cards = content.querySelectorAll(".wishlist-card");
    (cards[Math.max(0, Math.min(oldIndex, cards.length - 1))]?.querySelector("button") || document.querySelector("#wishlist-heading")).focus();
  }
}
function syncWishlist() {
  ensureWishlist();
  document.querySelectorAll("[data-wishlist]").forEach((button) => {
    const saved = wishlistIds.has(button.dataset.wishlist);
    button.setAttribute("aria-pressed", String(saved));
    const label = button.querySelector("[data-wishlist-label]");
    if (label) label.textContent = saved ? "Saved to wishlist" : "Save to wishlist";
  });
  document.querySelector("#wishlist-count").textContent = wishlistIds.size;
  document.querySelector("#wishlist-link").setAttribute("aria-label", `Wishlist, ${wishlistIds.size} saved ${wishlistIds.size === 1 ? "item" : "items"}`);
  document.querySelector("#wishlist-storage-note").hidden = wishlistCanSave;
  if (!document.querySelector("#wishlist-view").hidden) renderWishlist();
}
function persistWishlist() {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify([...wishlistIds]));
    wishlistCanSave = true;
  } catch { wishlistCanSave = false; }
  syncWishlist();
}
function wishlistMessage(message) {
  document.querySelector("#wishlist-status").textContent = message;
  const explanation = wishlistCanSave ? "" : " Favorites are kept for the current page only; browser storage isn’t available.";
  notify(message + explanation, !wishlistCanSave);
  return message + explanation;
}

document.addEventListener("click", (event) => {
  const detail = event.target.closest("[data-detail]");
  if (detail) wishlistDetailOpener = detail.closest("#wishlist-view") ? detail : null;
  const button = event.target.closest("[data-wishlist], [data-wishlist-remove], [data-wishlist-move]");
  if (!button) return;
  ensureWishlist();
  const id = button.dataset.wishlist || button.dataset.wishlistRemove || button.dataset.wishlistMove;
  const product = productById(id);
  if (!product) return;
  if (button.dataset.wishlistMove) {
    if (!addToCart(id)) {
      document.querySelector("#wishlist-status").textContent = "You can add up to 99 of each product. This favorite is still saved; update your bag to make room.";
      return;
    }
    if (!cartLastSaveSucceeded) {
      const message = `${product.name} added to your bag for this page only. We kept it in your wishlist because the bag couldn’t be saved.`;
      document.querySelector("#wishlist-status").textContent = message;
      notify(message, true);
      return;
    }
    wishlistIds.delete(id);
    persistWishlist();
    wishlistMessage(`${product.name} moved to your bag and removed from your wishlist.`);
    return;
  }
  if (button.dataset.wishlistRemove || wishlistIds.has(id)) wishlistIds.delete(id);
  else wishlistIds.add(id);
  persistWishlist();
  const message = wishlistMessage(`${product.name} ${wishlistIds.has(id) ? "saved to" : "removed from"} your wishlist.`);
  const feedback = button.closest(".wishlist-action")?.querySelector("[data-wishlist-feedback]");
  if (feedback) feedback.textContent = message;
});
window.addEventListener("storage", (event) => {
  if (!wishlistReady || (event.key !== WISHLIST_KEY && event.key !== null)) return;
  wishlistIds = readSavedWishlist();
  syncWishlist();
  wishlistMessage("Your wishlist was updated in another tab.");
});
document.addEventListener("DOMContentLoaded", () => {
  syncWishlist();
  document.querySelector("#product-dialog").addEventListener("close", () => {
    if (location.hash === "#wishlist" && wishlistDetailOpener && !wishlistDetailOpener.isConnected) {
      (document.querySelector("#wishlist-content .wishlist-card button") || document.querySelector("#wishlist-heading")).focus();
    }
    wishlistDetailOpener = null;
  });
});

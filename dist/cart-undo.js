"use strict";

// Only removed line items are remembered; Undo never rolls back the whole bag.
let removedCartItems = [];
function rememberCartRemoval(item, index) {
  removedCartItems.push({ id: item.id, quantity: item.quantity, index });
}
function renderCartUndo() {
  const region = document.querySelector("#cart-undo-region");
  const latest = removedCartItems.at(-1);
  region.hidden = !latest;
  if (!latest) { region.innerHTML = ""; return; }
  region.innerHTML = `<div class="cart-undo-copy"><p class="eyebrow">A CHANGE OF HEART IS ALLOWED</p><p id="cart-undo-description"><strong>${escapeHTML(productById(latest.id).name)} × ${latest.quantity}</strong> removed from your bag.</p><p class="cart-undo-note">${removedCartItems.length > 1 ? `${removedCartItems.length} removals available. Undo restores the latest first. ` : ""}Available until checkout, refresh, or a bag update in another tab.${cartLastSaveSucceeded ? "" : " Bag changes are for this page only because browser storage isn’t available."}</p></div><div class="cart-undo-actions"><button class="button primary" type="button" id="undo-cart-removal" aria-label="Undo last item removal" aria-describedby="cart-undo-description"><span aria-hidden="true">↶</span> Undo</button><button class="text-button" type="button" id="dismiss-cart-undo" aria-label="Dismiss undo history">Dismiss</button></div><p id="cart-undo-feedback" class="cart-undo-feedback" role="alert"></p>`;
}
function clearCartUndo() {
  removedCartItems = [];
  renderCartUndo();
}
document.addEventListener("click", (event) => {
  if (event.target.closest("#dismiss-cart-undo")) {
    clearCartUndo();
    document.querySelector("#cart-heading").focus();
    return;
  }
  if (!event.target.closest("#undo-cart-removal")) return;
  const latest = removedCartItems.at(-1);
  if (!latest) return;
  const existing = cart.find((item) => item.id === latest.id);
  if (existing && existing.quantity + latest.quantity > 99) {
    const message = `Restoring ${latest.quantity} would exceed 99 of this product. Reduce its quantity in your bag, then try Undo again. Your removal is still available.`;
    document.querySelector("#cart-undo-feedback").textContent = message;
    notify(message, true);
    return;
  }
  if (existing) existing.quantity += latest.quantity;
  else cart.splice(Math.min(latest.index, cart.length), 0, { id: latest.id, quantity: latest.quantity });
  removedCartItems.pop();
  checkoutStep = "delivery";
  persistCart();
  renderCart();
  document.querySelector(`#cart-quantity-${latest.id}`)?.focus();
  notify(`${productById(latest.id).name} × ${latest.quantity} restored to your bag.${cartLastSaveSucceeded ? "" : " For this page only: browser storage couldn’t save the bag."}`, !cartLastSaveSucceeded);
});

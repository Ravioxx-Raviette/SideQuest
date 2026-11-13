"use strict";

const ORDERS_KEY = "sidequest-orders-v1";
let orderRecords = [];
let ordersReady = false;
let ordersCanSave = true;
let pendingOrderChanges = [];
let reorderNumber = null;
let reorderOpener = null;

function normalizeOrder(value) {
  if (!value || typeof value.number !== "string" || !/^SQ-[A-Z0-9]{8}$/.test(value.number) ||
      typeof value.createdAt !== "string" || !Number.isFinite(Date.parse(value.createdAt)) ||
      !Array.isArray(value.items) || !value.items.length) return null;
  const ids = new Set();
  const items = [];
  for (const item of value.items) {
    if (!item || typeof item.id !== "string" || !/^[a-z0-9-]{1,100}$/.test(item.id) || ids.has(item.id) ||
        typeof item.name !== "string" || !item.name.trim() || item.name.length > 150 ||
        !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99 ||
        typeof item.unitPrice !== "number" || item.unitPrice < 0 || !Number.isSafeInteger(Math.round(item.unitPrice * 100))) return null;
    ids.add(item.id);
    items.push({ id: item.id, name: item.name, quantity: item.quantity, unitPrice: Math.round(item.unitPrice * 100) / 100 });
  }
  const cents = items.reduce((sum, item) => sum + Math.round(item.unitPrice * 100) * item.quantity, 0);
  if (!Number.isSafeInteger(cents)) return null;
  return { number: value.number, createdAt: new Date(value.createdAt).toISOString(), items, total: cents / 100 };
}
function readOrders() {
  let raw;
  try { raw = localStorage.getItem(ORDERS_KEY); }
  catch { ordersCanSave = false; return orderRecords; }
  try {
    const values = JSON.parse(raw || "[]");
    if (!Array.isArray(values)) return [];
    const numbers = new Set();
    return values.map(normalizeOrder).filter((order) => {
      if (!order || numbers.has(order.number)) return false;
      numbers.add(order.number);
      return true;
    }).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch { return []; }
}
function ensureOrders() {
  if (ordersReady) return;
  orderRecords = readOrders();
  ordersReady = true;
}
function persistOrders() {
  try { localStorage.setItem(ORDERS_KEY, JSON.stringify(orderRecords)); ordersCanSave = true; pendingOrderChanges = []; }
  catch { ordersCanSave = false; }
  document.querySelector("#orders-storage-note").hidden = ordersCanSave;
  return ordersCanSave;
}
function recordCompletedOrder(number, items) {
  ensureOrders();
  if (orderRecords.some((order) => order.number === number)) return ordersCanSave;
  const order = normalizeOrder({ number, createdAt: new Date().toISOString(), items: items.map((item) => {
    const product = productById(item.id);
    return { id: item.id, name: product.name, quantity: item.quantity, unitPrice: product.price };
  }) });
  if (!order) return false;
  orderRecords.unshift(order);
  pendingOrderChanges.push({ order });
  return persistOrders();
}
function reconcileOrderChanges(saved) {
  const merged = new Map(saved.map((order) => [order.number, order]));
  pendingOrderChanges.forEach((change) => {
    if (change.order) merged.set(change.order.number, change.order);
    else merged.delete(change.deletedNumber);
  });
  return [...merged.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
const orderDate = (value) => new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short",
}).format(new Date(value));
function focusOrderControl() {
  if (location.hash !== "#orders") return;
  (document.querySelector("#orders-content .order-record button") || document.querySelector("#orders-heading")).focus();
}
function renderOrders() {
  ensureOrders();
  const content = document.querySelector("#orders-content");
  const hadFocus = content.contains(document.activeElement) && !document.querySelector("dialog[open]");
  document.querySelector("#orders-storage-note").hidden = ordersCanSave;
  content.innerHTML = orderRecords.length ? `<div class="orders-toolbar"><p>${orderRecords.length} saved ${orderRecords.length === 1 ? "order" : "orders"}</p><button class="text-button" type="button" data-order-action="clear">Clear order history</button></div><div class="order-records">${orderRecords.map((order) => `<article class="order-record" aria-label="Order ${order.number}"><details><summary><span class="order-record-ident"><strong>${order.number}</strong><time datetime="${order.createdAt}">${orderDate(order.createdAt)}</time></span><span class="order-record-tally">${order.items.reduce((sum, item) => sum + item.quantity, 0)} items<strong>${money(order.total)}</strong></span><span class="order-expand" aria-hidden="true">+</span></summary><div class="order-record-details"><p class="eyebrow">YOUR ORIGINAL ORDER</p><ul class="order-lines">${order.items.map((item) => `<li><div><h3>${escapeHTML(item.name)}</h3><p>${item.quantity} × ${money(item.unitPrice)} each${productById(item.id) ? "" : " · No longer in the collection"}</p></div><strong>${money(item.quantity * item.unitPrice)}</strong></li>`).join("")}</ul><div class="order-original-total"><span>Order total</span><strong>${money(order.total)}</strong></div></div></details><div class="order-record-actions"><button class="button primary" type="button" data-reorder="${order.number}" aria-label="Reorder ${order.number}">Reorder <span aria-hidden="true">↗</span></button><button class="button secondary" type="button" data-order-summary="${order.number}" aria-label="View summary for order ${order.number}">Order summary</button><button class="text-button" type="button" data-delete-order="${order.number}" aria-label="Delete order ${order.number}">Delete record</button></div></article>`).join("")}</div>` : `<div class="empty-state orders-empty"><span aria-hidden="true">◇</span><h2>Your next story starts here.</h2><p>Your completed orders will appear here, ready when you want another round.</p><a class="button primary" href="#collection">Explore the collection <span aria-hidden="true">↗</span></a></div>`;
  if (hadFocus) focusOrderControl();
}
function ordersMessage(message) {
  const text = message + (ordersCanSave ? "" : " Changes are for this page only; browser storage couldn’t save order history.");
  document.querySelector("#orders-status").textContent = text;
  notify(text, !ordersCanSave);
}
function reorderPlan(order) {
  const available = [], missing = [], conflicts = [];
  for (const item of order.items) {
    const product = productById(item.id);
    if (!product) { missing.push(item); continue; }
    available.push({ ...item, product });
    const quantity = cart.find((line) => line.id === item.id)?.quantity || 0;
    if (quantity + item.quantity > 99) conflicts.push(`${product.name}: ${quantity} in your bag + ${item.quantity} would exceed the 99-item limit.`);
  }
  return { available, missing, conflicts, total: available.reduce((sum, item) => sum + item.quantity * item.product.price, 0) };
}
function renderReorder() {
  const order = orderRecords.find((item) => item.number === reorderNumber);
  if (!order) return false;
  const plan = reorderPlan(order);
  document.querySelector("#reorder-content").innerHTML = `<p class="reorder-reference">From order <strong>${order.number}</strong> · ${orderDate(order.createdAt)}</p><ul class="reorder-lines">${order.items.map((item) => {
    const product = productById(item.id);
    return `<li><div><h3>${escapeHTML(item.name)}</h3><p>Quantity: ${item.quantity} · Original price: ${money(item.unitPrice)} each</p>${product ? `<p class="${product.price !== item.unitPrice ? "reorder-price-change" : ""}">Current price: ${money(product.price)} each${product.price !== item.unitPrice ? " · Price updated since this order" : ""}</p>` : '<p class="reorder-unavailable">Currently unavailable; this item won’t be added.</p>'}</div>${product ? `<strong>${money(product.price * item.quantity)}</strong>` : ""}</li>`;
  }).join("")}</ul>${plan.missing.length ? '<p class="reorder-warning">Unavailable products are excluded. Review the available items before adding them.</p>' : ""}${plan.conflicts.length ? `<div class="reorder-warning"><strong>Make room in your bag first.</strong><ul>${plan.conflicts.map((message) => `<li>${escapeHTML(message)}</li>`).join("")}</ul><p>No items will be added until these quantities fit.</p></div>` : ""}${!plan.available.length ? '<p class="reorder-warning">None of these products are currently available.</p>' : ""}<div class="reorder-total"><span>Total to add at current prices</span><strong>${money(plan.total)}</strong></div><p class="reorder-note">These quantities will be added to your existing bag. Review your bag before checkout.</p><div class="reorder-actions"><button class="button primary" type="button" id="confirm-reorder" ${!plan.available.length || plan.conflicts.length ? "disabled" : ""}>${plan.missing.length ? "Add available items" : "Add items to bag"}</button><button class="button secondary" type="button" data-close-dialog="reorder-dialog">Cancel</button></div>`;
  return true;
}
document.addEventListener("click", (event) => {
  const reorder = event.target.closest("[data-reorder]");
  if (reorder) {
    if (document.querySelector("dialog[open]")) return;
    reorderNumber = reorder.dataset.reorder;
    reorderOpener = reorder;
    document.querySelector("#reorder-feedback").textContent = "";
    if (!renderReorder()) return;
    document.querySelector("#reorder-dialog").showModal();
    document.querySelector("#reorder-title").focus();
    return;
  }
  if (event.target.closest("#confirm-reorder")) {
    const order = orderRecords.find((item) => item.number === reorderNumber);
    if (!order) return;
    const plan = reorderPlan(order);
    if (!plan.available.length || plan.conflicts.length) {
      renderReorder();
      document.querySelector("#reorder-feedback").textContent = "Your bag or the available products changed. Review the updated quantities before continuing.";
      document.querySelector("#reorder-title").focus();
      return;
    }
    const updated = cart.map((item) => ({ ...item }));
    plan.available.forEach((item) => {
      const existing = updated.find((line) => line.id === item.id);
      if (existing) existing.quantity += item.quantity;
      else updated.push({ id: item.id, quantity: item.quantity });
    });
    cart = updated;
    checkoutStep = "delivery";
    persistCart();
    document.querySelector("#reorder-dialog").close();
    location.hash = "cart";
    notify(`Items from ${order.number} added to your bag.${cartLastSaveSucceeded ? "" : " For this page only: browser storage couldn’t save the bag."}`, !cartLastSaveSucceeded);
    return;
  }
  const deletion = event.target.closest("[data-delete-order]");
  const clear = event.target.closest('[data-order-action="clear"]');
  if (!deletion && !clear) return;
  askConfirmation(clear ? "Clear your order history?" : "Delete this order record?", "This removes saved order records from this browser. Your bag stays as it is.", clear ? "Clear history" : "Delete record", () => {
    const deleted = clear ? orderRecords : orderRecords.filter((order) => order.number === deletion.dataset.deleteOrder);
    deleted.forEach((order) => pendingOrderChanges.push({ deletedNumber: order.number }));
    orderRecords = clear ? [] : orderRecords.filter((order) => order.number !== deletion.dataset.deleteOrder);
    persistOrders();
    renderOrders();
    ordersMessage(clear ? "Order history cleared." : "Order record removed.");
  }, focusOrderControl);
});
window.addEventListener("storage", (event) => {
  if (event.key === ORDERS_KEY || event.key === null) {
    ensureOrders();
    orderRecords = reconcileOrderChanges(readOrders());
    if (!document.querySelector("#orders-view").hidden) renderOrders();
    if (document.querySelector("#reorder-dialog").open) {
      if (!renderReorder()) document.querySelector("#reorder-dialog").close();
      else {
        document.querySelector("#reorder-feedback").textContent = "Order history changed in another tab. Review the updated items.";
        document.querySelector("#reorder-title").focus();
      }
    }
    ordersMessage("Order history was updated in another tab.");
  }
  // Wait until the cart's own storage listener has read the new bag.
  if (event.key === CART_KEY || event.key === null) setTimeout(() => {
    if (!document.querySelector("#reorder-dialog").open) return;
    renderReorder();
    document.querySelector("#reorder-feedback").textContent = "Your bag changed in another tab. Review the updated quantities.";
    document.querySelector("#reorder-title").focus();
  }, 0);
});
document.addEventListener("DOMContentLoaded", () => {
  ensureOrders();
  document.querySelector("#orders-storage-note").hidden = ordersCanSave;
  document.querySelector("#reorder-dialog").addEventListener("close", () => {
    reorderNumber = null;
    if (location.hash === "#orders") {
      if (reorderOpener?.isConnected) reorderOpener.focus();
      else focusOrderControl();
    }
    reorderOpener = null;
  });
});

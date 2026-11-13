"use strict";

const receiptMoney = (value) => new Intl.NumberFormat("en-PH", {
  style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(value);

function renderOrderReceipt(number) {
  ensureOrders();
  // Copy the validated historical values, never substitute today's catalog.
  const order = normalizeOrder(orderRecords.find((record) => record.number === number));
  if (!order) {
    document.querySelector("#receipt-content").replaceChildren();
    return false;
  }
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelector("#receipt-content").innerHTML = `<article id="order-receipt" class="order-receipt" aria-labelledby="receipt-heading"><header class="receipt-brand"><strong>SIDEQUEST<span aria-hidden="true">✦</span></strong><p>SMALL OBJECTS. EPIC POSSIBILITIES.</p></header><h1 id="receipt-heading" tabindex="-1">Order summary</h1><dl class="receipt-meta"><div><dt>Order number</dt><dd>${order.number}</dd></div><div><dt>Order date</dt><dd><time datetime="${order.createdAt}">${orderDate(order.createdAt)}</time></dd></div><div><dt>Items</dt><dd>${count} ${count === 1 ? "item" : "items"}</dd></div><div><dt>Currency</dt><dd>Philippine peso (PHP)</dd></div></dl><table class="receipt-table"><caption class="sr-only">Original items and prices for order ${order.number}</caption><colgroup><col class="receipt-item-column"><col class="receipt-quantity-column"><col class="receipt-price-column"><col class="receipt-price-column"></colgroup><thead><tr><th scope="col">Item</th><th scope="col">Qty</th><th scope="col">Unit price</th><th scope="col">Amount</th></tr></thead><tbody>${order.items.map((item) => `<tr><th scope="row">${escapeHTML(item.name)}</th><td>${item.quantity}</td><td>${receiptMoney(item.unitPrice)}</td><td>${receiptMoney(Math.round(item.quantity * item.unitPrice * 100) / 100)}</td></tr>`).join("")}</tbody></table><div id="receipt-total" class="receipt-total"><span>Order total</span><strong>${receiptMoney(order.total)}</strong></div><footer class="receipt-footer"><p>Thanks for making Sidequest part of your next adventure.</p><strong>A little luck goes a long way.</strong></footer></article>`;
  return true;
}
function openOrderReceipt(number) {
  if (document.querySelector("dialog[open]")) return;
  const target = `#receipt/${number}`;
  if (location.hash === target) route();
  else location.hash = target;
}
function selectedReceiptExists() {
  ensureOrders();
  const number = location.hash.startsWith("#receipt/") ? location.hash.slice("#receipt/".length) : null;
  return orderRecords.some((order) => order.number === number);
}
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-order-summary]");
  if (button) { openOrderReceipt(button.dataset.orderSummary); return; }
  if (event.target.closest("#print-order-summary") && !document.querySelector("#receipt-view").hidden) {
    if (!selectedReceiptExists()) { route(); return; }
    window.print();
  }
});
window.addEventListener("storage", (event) => {
  if ((event.key === ORDERS_KEY || event.key === null) &&
      !document.querySelector("#receipt-view").hidden && !selectedReceiptExists()) route();
});

/* Sidequest: a buildless storefront. No orders or personal details leave this page. */
"use strict";

const PRODUCTS = [
  {
    id: "ember-d20",
    name: "Ember D20",
    type: "D20",
    material: "Resin",
    price: 180,
    size: "22 mm",
    contents: "1 twenty-sided die",
    color: "#b85035",
    bg: "#ece3d8",
    tag: "PARTY FAVORITE",
    description:
      "A warm terracotta twenty-sider with ivory numbering. A little fire for your next saving throw.",
  },
  {
    id: "moss-d6",
    name: "Moss D6",
    type: "D6",
    material: "Resin",
    price: 120,
    size: "16 mm",
    contents: "1 six-sided die",
    color: "#748168",
    bg: "#e5e8dc",
    tag: "",
    description:
      "Earthy green, softly rounded, and ready for the table. A classic six-sided companion for everyday adventures.",
  },
  {
    id: "starlight-set",
    name: "Starlight Set",
    type: "Set",
    material: "Resin",
    price: 650,
    size: "16–22 mm",
    contents: "7 dice: D4, D6, D8, D10, D%, D12, D20",
    color: "#6b718a",
    bg: "#e5e5eb",
    tag: "THE WHOLE PARTY",
    description:
      "A full seven-piece polyhedral set in dusky blue with tiny star details. Everything you need to start a new campaign.",
  },
  {
    id: "ivory-d6",
    name: "Ivory D6",
    type: "D6",
    material: "Acrylic",
    price: 90,
    size: "16 mm",
    contents: "1 six-sided die",
    color: "#d9c8a4",
    bg: "#ede8db",
    tag: "",
    description:
      "A timeless ivory six-sider with dark pips. Simple, familiar, and always welcome at game night.",
  },
  {
    id: "forged-d20",
    name: "Forged D20",
    type: "D20",
    material: "Metal",
    price: 480,
    size: "22 mm",
    contents: "1 twenty-sided die",
    color: "#78796c",
    bg: "#e3e5df",
    tag: "A LITTLE HEFT",
    description:
      "A satisfyingly weighty metal D20 with an antique finish. We recommend a dice tray to keep your tabletop happy.",
  },
  {
    id: "rosewater-set",
    name: "Rosewater Set",
    type: "Set",
    material: "Resin",
    price: 550,
    size: "16–22 mm",
    contents: "7 dice: D4, D6, D8, D10, D%, D12, D20",
    color: "#bb8887",
    bg: "#eee2df",
    tag: "",
    description:
      "Soft rose tones and cream numbering make this seven-piece set a gentle companion for wonderfully chaotic adventures.",
  },
  {
    id: "tide-d20",
    name: "Tide D20",
    type: "D20",
    material: "Acrylic",
    price: 220,
    size: "22 mm",
    contents: "1 twenty-sided die",
    color: "#54858b",
    bg: "#e0e8e6",
    tag: "",
    description:
      "Ocean teal with light-catching facets and clear ivory numbers. Go wherever the next roll takes you.",
  },
  {
    id: "copper-set",
    name: "Copperbound Set",
    type: "Set",
    material: "Metal",
    price: 1250,
    size: "16–22 mm",
    contents: "7 dice: D4, D6, D8, D10, D%, D12, D20",
    color: "#aa7851",
    bg: "#eae2d7",
    tag: "FOR EPIC QUESTS",
    description:
      "A complete metal set in warm copper tones. Seven substantial dice for the stories that deserve a little extra drama.",
  },
];
const CART_KEY = "sidequest-cart-v1";
const $ = (selector, root = document) => root.querySelector(selector);
const money = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const productById = (id) => PRODUCTS.find((product) => product.id === id);
let storageWarning = false;
let cartLastSaveSucceeded = true;
let cart = readCart();
let checkoutStep = "delivery";
let delivery = { name: "", address: "", phone: "" };
let lastOrder = null;
let detailProduct = null;
let pendingConfirmation = null;
let toastTimer;

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    const clean = new Map();
    saved.forEach((item) => {
      if (
        item &&
        productById(item.id) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
      ) {
        clean.set(item.id, {
          id: item.id,
          quantity: Math.min(99, item.quantity),
        });
      }
    });
    return [...clean.values()];
  } catch {
    return [];
  }
}

function persistCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    cartLastSaveSucceeded = true;
  } catch {
    cartLastSaveSucceeded = false;
    if (!storageWarning) {
      storageWarning = true;
      notify(
        "Your browser cannot save this bag. It will last until you refresh.",
        true,
      );
    }
  }
  updateCartCount();
}

function notify(message, error = false) {
  clearTimeout(toastTimer);
  const region = $("#toast-region");
  region.innerHTML = `<div class="toast${error ? " error" : ""}"><span aria-hidden="true">${error ? "!" : "✓"}</span><p>${escapeHTML(message)}</p><button type="button" aria-label="Dismiss notification">×</button></div>`;
  $("button", region).addEventListener("click", () => {
    region.innerHTML = "";
    clearTimeout(toastTimer);
  });
  toastTimer = setTimeout(
    () => {
      region.innerHTML = "";
    },
    error ? 8000 : 4500,
  );
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  $("#cart-count").textContent = count;
  $(".cart-link").setAttribute(
    "aria-label",
    `Your bag, ${count} ${count === 1 ? "item" : "items"}`,
  );
}
const cartTotal = () =>
  cart.reduce(
    (sum, item) => sum + productById(item.id).price * item.quantity,
    0,
  );

/* Original SVG illustrations keep the entire shop self-contained and available offline. */
function d20(color, x = 0, y = 0, scale = 1, rotation = 0) {
  return `<g transform="translate(${x} ${y}) scale(${scale}) rotate(${rotation} 100 105)"><path d="M100 10 187 65 170 163 100 197 23 155 14 68Z" fill="${color}"/><path d="m100 10 37 65-79 3Zm87 55-50 10 33 88Zm-17 98-49-37-21 71ZM23 155l35-77-44-10Z" fill="#fff" opacity=".16"/><path d="m58 78 79-3-16 51Z" fill="#fff" opacity=".07"/><path d="m100 10 37 65 50-10M14 68l44 10 42-68M23 155l35-77 79-3 33 88-49-37-21 71-77-42 98-29-63-48" fill="none" stroke="#fff4d0" stroke-opacity=".38" stroke-width="1.2"/><path d="M100 10 187 65 170 163 100 197 23 155 14 68Z" fill="none" stroke="#322d20" stroke-opacity=".18" stroke-width="2"/><g fill="#fff3d2" font-family="Georgia,serif" text-anchor="middle"><text x="100" y="110" font-size="34" transform="rotate(-3 100 100)">20</text><text x="94" y="56" font-size="19">8</text><text x="150" y="117" font-size="18" transform="rotate(37 150 110)">14</text><text x="68" y="159" font-size="21" transform="rotate(29 68 150)">2</text><text x="43" y="112" font-size="16" transform="rotate(-27 43 105)">6</text></g></g>`;
}

function d6(color, x = 0, y = 0, scale = 1, rotation = 0, dark = false) {
  const pip = dark ? "#655b46" : "#f7efcf";
  return `<g transform="translate(${x} ${y}) scale(${scale}) rotate(${rotation} 100 100)"><path d="M31 40 112 15 179 54 174 153 94 184 27 139Z" fill="${color}" stroke="#383521" stroke-opacity=".15" stroke-width="2" stroke-linejoin="round"/><path d="m31 40 68 42 80-28-67-39Z" fill="#fff" opacity=".24"/><path d="m99 82 80-28-5 99-80 31Z" fill="#000" opacity=".13"/><path d="m31 40 68 42 80-28M99 82l-5 102" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"/><g fill="${pip}"><ellipse cx="91" cy="41" rx="7" ry="4" transform="rotate(-16 91 41)"/><ellipse cx="117" cy="57" rx="7" ry="4" transform="rotate(-16 117 57)"/><ellipse cx="51" cy="73" rx="6" ry="8" transform="rotate(-17 51 73)"/><ellipse cx="73" cy="137" rx="6" ry="8" transform="rotate(-17 73 137)"/><ellipse cx="61" cy="105" rx="6" ry="8" transform="rotate(-17 61 105)"/><ellipse cx="121" cy="105" rx="6" ry="8"/><ellipse cx="153" cy="93" rx="6" ry="8"/><ellipse cx="119" cy="148" rx="6" ry="8"/><ellipse cx="151" cy="135" rx="6" ry="8"/></g></g>`;
}

function productImage(product) {
  let art;
  if (product.type === "D6")
    art = d6(product.color, 25, 0, 1, -10, product.id === "ivory-d6");
  else if (product.type === "Set")
    art = `${d20(product.color, 80, 10, 0.7, 10)}${d6(product.color, -4, 61, 0.58, -9)}<g transform="translate(150 118)"><path d="m0 55 42-63 42 66-42 31Z" fill="${product.color}"/><path d="m42-8 0 63 42 3M0 55h42v34" fill="none" stroke="#f5e4c1" stroke-opacity=".45"/><text x="45" y="45" fill="#fff0d1" text-anchor="middle" font-size="19" font-family="Georgia">4</text></g><circle cx="185" cy="56" r="2" fill="#fdf2d7"/><circle cx="166" cy="45" r="1.5" fill="#fdf2d7"/>`;
  else art = d20(product.color, 27, -1, 1, -12);
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 220"><defs><filter id="s" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="0" dy="13" stdDeviation="9" flood-color="#433c26" flood-opacity=".17"/></filter></defs><g filter="url(#s)">${art}</g></svg>`)}`;
}

function renderHero() {
  $("#hero-art").insertAdjacentHTML(
    "afterbegin",
    `<svg viewBox="0 0 500 340" aria-hidden="true">${d6("#d8c6a1", 286, 130, 0.76, 15, true)}${d20("#b65338", 150, 10, 1.12, 14)}${d6("#738268", 23, 144, 0.83, -14)}<path d="m400 82 4-11 4 11 11 4-11 4-4 11-4-11-11-4Z" fill="#bf5537"/><circle cx="104" cy="77" r="3" fill="#c6a46a"/><circle cx="367" cy="283" r="3" fill="#c6a46a"/></svg>`,
  );
}

function renderProducts() {
  const query = $("#search").value.trim().toLowerCase();
  const type = $('input[name="type"]:checked').value;
  const material = $("#material").value;
  const price = $("#price").value;
  const filtered = PRODUCTS.filter(
    (product) =>
      product.name.toLowerCase().includes(query) &&
      (type === "all" || product.type === type) &&
      (material === "all" || product.material === material) &&
      (price === "all" ||
        (price === "under250" && product.price < 250) ||
        (price === "250to500" &&
          product.price >= 250 &&
          product.price <= 500) ||
        (price === "over500" && product.price > 500)),
  );
  const results = sortCatalog(filtered, $("#sort").value);
  $("#result-count").textContent =
    `Showing ${results.length} of ${PRODUCTS.length} products · ${$("#sort").selectedOptions[0].textContent}`;
  renderActiveFilters();
  $("#no-results").hidden = results.length > 0;
  $("#products").innerHTML = results
    .map(
      (product) =>
        `<article class="product-card"><div class="product-art" style="--card-bg:${product.bg}">${product.tag ? `<span class="product-tag">${product.tag}</span>` : ""}<button type="button" data-detail="${product.id}" aria-label="View ${product.name} details"><img src="${productImage(product)}" alt="${product.name} dice illustration" width="260" height="220"></button>${wishlistControl(product, true)}</div><div class="product-info"><p class="product-meta">${product.material} · ${product.type === "Set" ? "7-piece set" : product.type + " · Single die"}</p><div class="product-name-line"><h3>${product.name}</h3><span>${money(product.price)}</span></div><div class="product-actions"><button class="button secondary" type="button" data-detail="${product.id}" aria-label="View details for ${product.name}">View details</button><button class="button primary" type="button" data-add="${product.id}" aria-label="Add ${product.name} to cart">Add to cart <span aria-hidden="true">+</span></button></div>${comparisonControl(product)}</div></article>`,
    )
    .join("");
}

function resetFilters() {
  $("#search").value = "";
  $('input[name="type"][value="all"]').checked = true;
  $("#material").value = "all";
  $("#price").value = "all";
  renderProducts();
}

function quantityControl(product, quantity, context = "cart") {
  const id = `${context}-quantity-${product.id}`;
  return `<div class="quantity-control"><button type="button" data-quantity-action="decrease" data-id="${product.id}" data-context="${context}" aria-label="Decrease ${product.name} quantity" ${quantity <= 1 ? "disabled" : ""}>−</button><label class="sr-only" for="${id}">${product.name} quantity</label><input id="${id}" type="number" min="1" max="99" step="1" inputmode="numeric" value="${quantity}" data-quantity="${product.id}" data-context="${context}"><button type="button" data-quantity-action="increase" data-id="${product.id}" data-context="${context}" aria-label="Increase ${product.name} quantity" ${quantity >= 99 ? "disabled" : ""}>+</button></div>`;
}

function addToCart(id, quantity = 1) {
  const product = productById(id);
  const existing = cart.find((item) => item.id === id);
  if (existing && existing.quantity + quantity > 99) {
    notify("You can add up to 99 of each product.", true);
    return false;
  }
  if (existing) existing.quantity += quantity;
  else cart.push({ id, quantity });
  checkoutStep = "delivery";
  persistCart();
  if (!storageWarning)
    notify(
      `${product.name}${quantity > 1 ? ` × ${quantity}` : ""} added to your bag.`,
    );
  return true;
}

function showProduct(id) {
  const product = productById(id);
  detailProduct = product;
  $("#product-detail-content").innerHTML =
    `<div class="product-details"><div class="detail-image" style="--card-bg:${product.bg}"><img src="${productImage(product)}" alt="${product.name} dice illustration" width="260" height="220"></div><div class="detail-copy"><p class="eyebrow">MEET YOUR NEXT LUCKY CHARM</p><h2 id="product-dialog-title">${product.name}</h2><p class="detail-price">${money(product.price)}</p><p class="detail-description">${product.description}</p><dl class="detail-specs"><div><dt>Material</dt><dd>${product.material}</dd></div><div><dt>Size</dt><dd>${product.size}</dd></div><div><dt>Includes</dt><dd>${product.contents}</dd></div></dl><span class="detail-quantity-label">Quantity</span><div class="detail-add">${quantityControl(product, 1, "detail")}<button class="button primary" type="button" id="detail-add">Add to cart <span aria-hidden="true">+</span></button></div>${comparisonControl(product)}${wishlistControl(product)}${diceGuideHelp(product)}</div></div>`;
  $("#product-dialog").showModal();
}

function orderSummary(checkout = false) {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  return `<aside class="order-summary" aria-label="Order summary"><h2>The good stuff.</h2><div class="summary-line"><span>Subtotal (${count} ${count === 1 ? "item" : "items"})</span><span>${money(cartTotal())}</span></div><div class="summary-line"><span>Delivery</span><span>Demo only</span></div><div class="summary-line summary-total"><span>Total</span><span>${money(cartTotal())}</span></div>${checkout ? "" : `<button class="button primary" type="button" id="checkout-button" ${cart.length ? "" : "disabled"}>Continue to checkout <span aria-hidden="true">→</span></button>`}<p class="summary-note">A class project, made for exploring. Orders are simulated; no payment or delivery takes place.</p></aside>`;
}

function renderCart() {
  renderCartUndo();
  if (!cart.length) {
    $("#cart-content").innerHTML =
      `<div class="empty-cart-layout"><div class="empty-state"><span aria-hidden="true">◇</span><h3>Your next adventure awaits.</h3><p>Your bag is empty. Let’s find your lucky dice.</p><a class="button primary" href="#shop">Explore the collection ↗</a></div>${orderSummary()}</div>`;
    return;
  }
  $("#cart-content").innerHTML = `<div class="cart-layout"><div>${cart
    .map((item) => {
      const product = productById(item.id);
      return `<article class="cart-item" data-cart-item="${item.id}"><img src="${productImage(product)}" style="--card-bg:${product.bg}" alt="${product.name}" width="100" height="100"><div><h3>${product.name}</h3><p>${product.material} · ${product.type === "Set" ? "7-piece set" : product.type} · ${money(product.price)} each</p><div class="cart-item-tools">${quantityControl(product, item.quantity)}<button class="remove-button" type="button" data-remove="${item.id}" aria-label="Remove ${product.name} from bag">Remove</button></div></div><strong class="cart-subtotal">${money(product.price * item.quantity)}</strong></article>`;
    })
    .join("")}</div>${orderSummary()}</div>`;
}

function askConfirmation(title, description, button, action, restoreFocus) {
  $("#confirm-title").textContent = title;
  $("#confirm-description").textContent = description;
  $("#confirm-accept").textContent = button;
  pendingConfirmation = { action, restoreFocus };
  $("#confirm-dialog").returnValue = "";
  $("#confirm-dialog").showModal();
}

function changeQuantity(input, nextValue) {
  const id = input.dataset.quantity;
  const parsed = Number(nextValue);
  const valid = Number.isInteger(parsed) && parsed >= 1 && parsed <= 99;
  const quantity = valid
    ? parsed
    : Math.max(
        1,
        Math.min(99, Number.isFinite(parsed) ? Math.round(parsed) : 1),
      );
  if (!valid)
    notify("Please choose a whole-number quantity from 1 to 99.", true);
  input.value = quantity;
  const control = input.closest(".quantity-control");
  $('[data-quantity-action="decrease"]', control).disabled = quantity === 1;
  $('[data-quantity-action="increase"]', control).disabled = quantity === 99;
  if (input.dataset.context === "cart") {
    cart.find((item) => item.id === id).quantity = quantity;
    checkoutStep = "delivery";
    persistCart();
    const item = input.closest(".cart-item");
    $(".cart-subtotal", item).textContent = money(
      productById(id).price * quantity,
    );
    $(".order-summary", $("#cart-content")).outerHTML = orderSummary();
  }
}

function setProgress() {
  const steps = ["delivery", "review", "complete"];
  document.querySelectorAll(".checkout-steps li").forEach((item, index) => {
    const current = steps.indexOf(checkoutStep);
    item.classList.toggle("active", index === current);
    item.classList.toggle("done", index < current);
    if (index === current) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
    $("span", item).textContent = index < current ? "✓" : index + 1;
  });
}

function renderCheckout() {
  setProgress();
  if (checkoutStep === "complete" && lastOrder) {
    $("#checkout-content").innerHTML =
      `<div class="success-panel"><div class="success-icon" aria-hidden="true">✓</div><p class="eyebrow">HERE’S TO YOUR NEXT ADVENTURE</p><h2>You’re on a roll.</h2><p>Your simulated order is complete.<br>Thanks for taking Sidequest for a spin.</p><strong class="order-number">${lastOrder.number}</strong><p>${lastOrder.count} ${lastOrder.count === 1 ? "item" : "items"} · ${money(lastOrder.total)}<br>This is a demo. No payment was collected and nothing will be shipped.</p><a class="button primary" href="#shop">Continue shopping ↗</a></div>`;
    return;
  }
  if (checkoutStep === "review") {
    $("#checkout-content").innerHTML =
      `<div class="checkout-layout"><div class="checkout-panel"><h2>A quick look before you roll.</h2><p class="panel-intro">Check your details and the dice coming along for the adventure.</p><div class="review-block"><h3>Delivery details</h3><p class="delivery-details" id="review-delivery"></p><button class="text-button" id="edit-delivery" type="button">Edit delivery details</button></div><div class="review-block"><h3>In your bag</h3>${cart.map((item) => `<div class="review-item"><span>${productById(item.id).name} × ${item.quantity}</span><strong>${money(productById(item.id).price * item.quantity)}</strong></div>`).join("")}</div><div class="review-actions"><button class="button primary" id="place-order" type="button">Place demo order →</button><a class="button secondary" href="#cart">Edit bag</a></div></div>${orderSummary(true)}</div>`;
    $("#review-delivery").textContent =
      `${delivery.name}\n${delivery.address}\n${delivery.phone}`;
  } else {
    $("#checkout-content").innerHTML =
      `<div class="checkout-layout"><div class="checkout-panel"><h2>Where’s the adventure?</h2><p class="panel-intro">Use sample details for this class demo. Your information stays on this page and is cleared after checkout.</p><form id="delivery-form" novalidate><div class="field"><label for="delivery-name">Full name</label><input id="delivery-name" name="name" autocomplete="name" maxlength="100" required aria-describedby="name-error" value="${escapeHTML(delivery.name)}"><p class="field-error" id="name-error" hidden></p></div><div class="field"><label for="delivery-address">Delivery address</label><textarea id="delivery-address" name="address" autocomplete="street-address" maxlength="400" required aria-describedby="address-error">${escapeHTML(delivery.address)}</textarea><p class="field-error" id="address-error" hidden></p></div><div class="field"><label for="delivery-phone">Contact number</label><input id="delivery-phone" name="phone" type="tel" autocomplete="tel" maxlength="25" required aria-describedby="phone-hint phone-error" value="${escapeHTML(delivery.phone)}"><p class="field-hint" id="phone-hint">Include 7–15 digits, for example 0917 123 4567.</p><p class="field-error" id="phone-error" hidden></p></div><button class="button primary" type="submit">Review your order →</button></form></div>${orderSummary(true)}</div>`;
  }
}

function rememberDelivery() {
  const form = $("#delivery-form");
  if (form)
    delivery = {
      name: form.elements.name.value,
      address: form.elements.address.value,
      phone: form.elements.phone.value,
    };
}

function validateDelivery(form) {
  rememberDelivery();
  delivery = Object.fromEntries(
    Object.entries(delivery).map(([key, value]) => [key, value.trim()]),
  );
  const digits = delivery.phone.replace(/\D/g, "");
  const errors = {
    name: delivery.name ? "" : "Please enter your name.",
    address: delivery.address ? "" : "Please enter your delivery address.",
    phone: !delivery.phone
      ? "Please enter a contact number."
      : !/^[+\d\s().-]+$/.test(delivery.phone) ||
          digits.length < 7 ||
          digits.length > 15
        ? "Use a valid contact number with 7–15 digits."
        : "",
  };
  let firstInvalid;
  Object.entries(errors).forEach(([key, error]) => {
    const field = form.elements[key];
    const message = $(`#${key}-error`);
    field.setAttribute("aria-invalid", error ? "true" : "false");
    message.textContent = error;
    message.hidden = !error;
    if (error && !firstInvalid) firstInvalid = field;
  });
  if (firstInvalid) {
    notify("Check the highlighted delivery details before continuing.", true);
    firstInvalid.focus();
    return false;
  }
  return true;
}

function finishOrder() {
  if (!cart.length || checkoutStep !== "review") return;
  clearCartUndo();
  const unique =
    globalThis.crypto?.randomUUID?.().slice(0, 8).toUpperCase() ||
    Math.random().toString(36).slice(2, 10).toUpperCase();
  lastOrder = {
    number: `SQ-${unique}`,
    total: cartTotal(),
    count: cart.reduce((sum, item) => sum + item.quantity, 0),
  };
  cart = [];
  persistCart();
  delivery = { name: "", address: "", phone: "" };
  checkoutStep = "complete";
  renderCheckout();
  $("#checkout-heading").focus();
  notify("Demo order placed. Here’s to your next adventure!");
}

function route(initial = false) {
  rememberDelivery();
  const hash = location.hash.slice(1);
  let view =
    hash === "cart" ? "cart" : hash === "checkout" ? "checkout" : hash === "wishlist" ? "wishlist" : "shop";
  if (
    view === "checkout" &&
    !cart.length &&
    !(checkoutStep === "complete" && lastOrder)
  ) {
    history.replaceState(null, "", "#cart");
    view = "cart";
  }
  if (view !== "checkout" && checkoutStep === "complete") {
    checkoutStep = "delivery";
    lastOrder = null;
  }
  ["shop", "cart", "checkout", "wishlist"].forEach((name) => {
    $(`#${name}-view`).hidden = name !== view;
  });
  if (view === "cart") renderCart();
  if (view === "checkout") { clearCartUndo(); renderCheckout(); }
  if (view === "wishlist") renderWishlist();
  document.title = `${view === "cart" ? "Your bag" : view === "checkout" ? "Checkout" : view === "wishlist" ? "Your wishlist" : "Dice for your next adventure"} — Sidequest`;
  const section = ["collection", "dice-finder", "dice-guide"].includes(hash)
    ? document.getElementById(hash)
    : null;
  if (section) {
    if (hash === "dice-guide") $("#guide-disclosure").open = true;
    section.scrollIntoView({ behavior: "instant" });
    if (!initial) {
      const heading = $("h2", section);
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  } else if (!initial) {
    window.scrollTo({ top: 0, behavior: "instant" });
    $(view === "wishlist" ? "#wishlist-heading" : "#main").focus({ preventScroll: true });
  }
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.detail) showProduct(button.dataset.detail);
  if (button.dataset.add) addToCart(button.dataset.add);
  if (button.dataset.closeDialog) $(`#${button.dataset.closeDialog}`).close();
  if (button.dataset.quantityAction) {
    const input = $("input", button.closest(".quantity-control"));
    changeQuantity(
      input,
      Number(input.value) +
        (button.dataset.quantityAction === "increase" ? 1 : -1),
    );
  }
  if (button.dataset.remove) {
    const id = button.dataset.remove;
    askConfirmation(
      "Leave this one behind?",
      `Remove ${productById(id).name} from your bag? You can always add it again.`,
      "Remove item",
      () => {
        const index = cart.findIndex((item) => item.id === id);
        if (index < 0) return;
        rememberCartRemoval(cart[index], index);
        cart = cart.filter((item) => item.id !== id);
        checkoutStep = "delivery";
        persistCart();
        renderCart();
        notify(`${productById(id).name} removed from your bag. Undo is available.${cartLastSaveSucceeded ? "" : " For this page only: browser storage couldn’t save the bag."}`, !cartLastSaveSucceeded);
      },
      () => {
        ($("#undo-cart-removal") || $("[data-remove]", $("#cart-content")) || $("#cart-heading")).focus();
      },
    );
  }
  if (button.id === "detail-add") {
    const quantity = $("input[data-quantity]", $("#product-dialog"));
    changeQuantity(quantity, quantity.value);
    addToCart(detailProduct.id, Number(quantity.value));
  }
  if (button.id === "checkout-button" && cart.length) {
    checkoutStep = "delivery";
    location.hash = "checkout";
  }
  if (button.id === "edit-delivery") {
    checkoutStep = "delivery";
    renderCheckout();
    $("#delivery-name").focus();
  }
  if (button.id === "place-order")
    askConfirmation(
      "Ready for your next quest?",
      `Place this simulated order for ${money(cartTotal())}? No payment will be collected.`,
      "Place demo order",
      finishOrder,
      () => $("#checkout-heading").focus(),
    );
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-quantity]"))
    changeQuantity(event.target, event.target.value);
});
document.addEventListener("submit", (event) => {
  if (event.target.id !== "delivery-form") return;
  event.preventDefault();
  if (validateDelivery(event.target)) {
    checkoutStep = "review";
    renderCheckout();
    $("#checkout-heading").focus();
    notify("Delivery details saved. Review your order before placing it.");
  }
});
document.addEventListener("input", (event) => {
  if (event.target.closest("#delivery-form")) {
    rememberDelivery();
    if (event.target.getAttribute("aria-invalid") === "true") {
      event.target.removeAttribute("aria-invalid");
      $(`#${event.target.name}-error`).hidden = true;
    }
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const dialog = $("dialog[open]");
  if (!dialog) return;
  const controls = [
    ...dialog.querySelectorAll(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], summary, [tabindex]:not([tabindex="-1"]):not(:disabled)',
    ),
  ].filter((element) => element.getClientRects().length);
  const first = controls[0];
  const last = controls.at(-1);
  if (
    event.shiftKey &&
    (document.activeElement === first ||
      !dialog.contains(document.activeElement))
  ) {
    event.preventDefault();
    last?.focus();
  } else if (
    !event.shiftKey &&
    (document.activeElement === last ||
      !dialog.contains(document.activeElement))
  ) {
    event.preventDefault();
    first?.focus();
  }
});
$("#search").addEventListener("input", renderProducts);
document
  .querySelectorAll('input[name="type"], #material, #price, #sort')
  .forEach((input) => input.addEventListener("change", renderProducts));
$("#reset-filters").addEventListener("click", resetFilters);
$("#clear-search").addEventListener("click", () => {
  resetFilters();
  $("#search").focus();
});
$("#confirm-cancel").addEventListener("click", () =>
  $("#confirm-dialog").close("cancel"),
);
$("#confirm-accept").addEventListener("click", () =>
  $("#confirm-dialog").close("confirm"),
);
$("#confirm-dialog").addEventListener("close", () => {
  const pending = pendingConfirmation;
  pendingConfirmation = null;
  if ($("#confirm-dialog").returnValue === "confirm" && pending) {
    pending.action();
    pending.restoreFocus?.();
  }
});
window.addEventListener("hashchange", () => route());
window.addEventListener("storage", (event) => {
  if (event.key !== CART_KEY && event.key !== null) return;
  clearCartUndo();
  cart = readCart();
  checkoutStep = "delivery";
  if ($("#confirm-dialog").open) $("#confirm-dialog").close("cancel");
  updateCartCount();
  route(true);
  notify("Your bag was updated in another tab.");
});
$("#cart-heading").tabIndex = -1;
$("#checkout-heading").tabIndex = -1;
renderHero();
renderProducts();
updateCartCount();
route(true);

"use strict";

// Type and budget are requirements; material only changes the ranking.
function matchDice(products, answers) {
  return products
    .filter((product) =>
      (answers.type === "any" || product.type === answers.type) &&
      product.price <= answers.budget,
    )
    .map((product) => ({
      product,
      materialMatch: answers.material !== "any" && product.material === answers.material,
    }))
    .sort((a, b) => Number(b.materialMatch) - Number(a.materialMatch) || a.product.price - b.product.price)
    .slice(0, 3);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { matchDice };
}

if (typeof document !== "undefined") (() => {
  const root = document.querySelector("#dice-finder");
  if (!root) return;
  const content = root.querySelector("#finder-content");
  const status = root.querySelector("#finder-status");
  const steps = [
    {
      key: "type", label: "Your adventure", title: "What brings you to the table?",
      hint: "Choose what you need. No dice knowledge required.",
      options: [
        ["Set", "My first campaign", "A seven-piece set, with dice from four to twenty sides."],
        ["D20", "A single D20", "One twenty-sided die for your next big moment."],
        ["D6", "A classic D6", "One familiar six-sided die for everyday game nights."],
        ["any", "Help me explore", "I’m open to single dice and complete sets."],
      ],
    },
    {
      key: "budget", label: "Your budget", title: "How much would you like to spend?",
      hint: "This is your maximum price for one product, before any quantity changes.",
      options: [
        ["250", "Up to ₱250", "Small treasures, a smaller spend."],
        ["500", "Up to ₱500", "A little more room to find your favorite."],
        ["700", "Up to ₱700", "Room for our colorful seven-piece sets."],
        ["any", "Any budget", "Show me the options at every price."],
      ],
    },
    {
      key: "material", label: "Your style", title: "What feels like your kind of dice?",
      hint: "A preference, not a limit. We’ll explain any alternatives that fit your needs and budget.",
      options: [
        ["Resin", "Colorful resin", "Expressive colors for a personal touch."],
        ["Acrylic", "Classic acrylic", "Simple, familiar, and easy to start with."],
        ["Metal", "Weighty metal", "A substantial feel. A dice tray is recommended."],
        ["any", "No material preference", "Let my dice needs and budget lead the way."],
      ],
    },
  ];
  const answers = {};
  let step = 0;
  let completed = false;

  const action = (name, label, primary = false) =>
    `<button type="button" class="button ${primary ? "primary" : "secondary"}" data-finder-action="${name}">${label}</button>`;
  function focusHeading() {
    content.querySelector("h3")?.focus();
  }
  function progress() {
    return `<ol class="finder-progress" aria-label="Dice finder progress">${steps.map((item, index) =>
      `<li class="${completed || index < step ? "done" : index === step ? "current" : ""}" ${!completed && index === step ? 'aria-current="step"' : ""}><span>${completed || index < step ? "✓" : index + 1}</span>${item.label}</li>`,
    ).join("")}</ol>`;
  }
  function intro() {
    content.innerHTML = `<div class="finder-intro"><div><p class="finder-intro-title">Your next favorite is three answers away.</p><p>Tell us your adventure, budget, and style. Get up to three suggestions, with a reason for every pick.</p><span class="finder-footnote">3 quick steps · No account needed</span><a class="finder-guide-link text-button" href="#dice-guide" data-guide-link>New to dice? Read the beginner’s guide</a></div>${action("start", "Find my dice <span aria-hidden=\"true\">↗</span>", true)}</div>`;
  }
  function renderStep() {
    completed = false;
    const current = steps[step];
    content.innerHTML = `${progress()}<form id="finder-form" novalidate>
      <div class="finder-step-top"><span class="eyebrow">STEP ${step + 1} OF 3</span><button class="text-button" type="button" data-finder-action="close" aria-label="Close dice finder">Close <span aria-hidden="true">×</span></button></div>
      <h3 id="finder-step-heading" tabindex="-1">${current.title}</h3>
      <p class="finder-hint" id="finder-hint">${current.hint}</p>${finderGuideHelp(current.key)}
      <fieldset class="finder-options" aria-describedby="finder-hint finder-error"><legend class="sr-only">${current.title}</legend>
      ${current.options.map(([value, name, description], index) => `<label class="finder-option"><input type="radio" name="finder-${current.key}" value="${value}" ${answers[current.key] === value ? "checked" : ""}><span class="finder-option-copy"><strong>${name}</strong><span>${description}</span></span><span class="finder-option-mark" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span></label>`).join("")}
      </fieldset><p class="finder-error" id="finder-error" role="alert" hidden>Choose an option to continue.</p>
      <div class="finder-controls"><div>${step > 0 ? action("back", '<span aria-hidden="true">←</span> Back') : ""}${action("reset", "Start over")}</div><button class="button primary" type="submit">${step === 2 ? "Show my matches" : "Continue"}<span aria-hidden="true">→</span></button></div>
      <p class="finder-footnote">Your answers stay on this page. Browse the collection below at any time.</p></form>`;
    status.textContent = `Step ${step + 1} of 3: ${current.label}`;
    focusHeading();
  }
  function resultReasons(product, materialMatch) {
    const typeReason = answers.type === "Set" ? "Seven dice for your first campaign" : answers.type === "D20" ? "The single D20 you’re looking for" : answers.type === "D6" ? "A classic six-sided die for your table" : product.type === "Set" ? "A seven-piece set to explore" : `A single ${product.type} to explore`;
    const budgetReason = answers.budget === "any" ? "Fits your open budget" : `Within your ${money(Number(answers.budget))} budget`;
    const materialReason = answers.material === "any" ? `${product.material} · open to any material` : materialMatch ? `Matches your ${answers.material.toLowerCase()} preference` : `${product.material} alternative to your ${answers.material.toLowerCase()} preference`;
    return [typeReason, budgetReason, materialReason].map((reason) => `<li>${escapeHTML(reason)}</li>`).join("");
  }
  function renderResults() {
    completed = true;
    const results = matchDice(PRODUCTS, {
      type: answers.type,
      budget: answers.budget === "any" ? Infinity : Number(answers.budget),
      material: answers.material,
    });
    const summary = steps.map(({ key, options }) => options.find(([value]) => value === answers[key])?.[1]).filter(Boolean);
    const eligible = PRODUCTS.filter((product) => answers.type === "any" || product.type === answers.type);
    const minimum = eligible.length ? Math.min(...eligible.map((product) => product.price)) : null;
    content.innerHTML = `${progress()}<div class="finder-step-top"><span class="eyebrow">${results.length ? "MADE FOR YOUR NEXT ADVENTURE" : "LET’S FIND A WAY FORWARD"}</span><button class="text-button" type="button" data-finder-action="close" aria-label="Close dice finder">Close <span aria-hidden="true">×</span></button></div>
      <h3 tabindex="-1">${results.length ? "Your next adventure, matched." : "No match yet. Let’s adjust."}</h3>
      <ul class="finder-answer-summary" aria-label="Your answers">${summary.map((label) => `<li>${escapeHTML(label)}</li>`).join("")}</ul>
      ${results.length ? `<p class="finder-hint">${results.length} ${results.length === 1 ? "pick" : "picks"} for your needs and budget. Material preferences come first, then price.</p><div class="finder-matches">${results.map(({ product, materialMatch }, index) => `<article class="finder-match"><div class="finder-match-art" style="--card-bg:${product.bg}"><span class="finder-match-rank">PICK ${String(index + 1).padStart(2, "0")}</span><img src="${productImage(product)}" alt="${product.name} dice illustration" width="260" height="220">${wishlistControl(product, true)}</div><div class="finder-match-copy"><p class="product-meta">${product.material} · ${product.type === "Set" ? "7-piece set" : product.type + " · Single die"}</p><div class="finder-match-title"><h4>${product.name}</h4><strong>${money(product.price)}</strong></div><p class="finder-reason-label">WHY IT FITS YOU</p><ul class="finder-reasons">${resultReasons(product, materialMatch)}</ul><div class="finder-match-actions"><button class="button secondary" type="button" data-detail="${product.id}" aria-label="View details for ${product.name}">View details</button><button class="button primary" type="button" data-add="${product.id}" aria-label="Add ${product.name} to cart">Add to bag <span aria-hidden="true">+</span></button></div>${comparisonControl(product)}</div></article>`).join("")}</div>` : `<div class="finder-no-match"><span aria-hidden="true">◇</span><p>${minimum !== null ? `Our ${answers.type === "Set" ? "seven-piece sets" : answers.type === "any" ? "dice" : answers.type + " dice"} start at ${money(minimum)}, above your ${money(Number(answers.budget))} budget. We haven’t swapped in a different dice type or an over-budget pick.` : "There aren’t any products of this type in the collection yet."}</p>${action("budget", "Change budget", true)}</div>`}
      <div class="finder-controls finder-result-controls"><div>${action("edit", "Edit answers")}${action("reset", "Start over")}</div><a class="text-button" href="#collection">Explore the collection <span aria-hidden="true">↓</span></a></div>`;
    status.textContent = results.length ? `${results.length} dice recommendations ready.` : "No products match your dice needs and budget. You can change your answers.";
    focusHeading();
  }
  root.addEventListener("change", (event) => {
    if (!event.target.matches('input[type="radio"]')) return;
    answers[steps[step].key] = event.target.value;
    const error = content.querySelector("#finder-error");
    if (error) error.hidden = true;
  });
  root.addEventListener("submit", (event) => {
    if (event.target.id !== "finder-form") return;
    event.preventDefault();
    if (!answers[steps[step].key]) {
      content.querySelector("#finder-error").hidden = false;
      content.querySelector('input[type="radio"]').focus();
      return;
    }
    if (step < 2) { step++; renderStep(); }
    else renderResults();
  });
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-finder-action]");
    if (!button) return;
    switch (button.dataset.finderAction) {
      case "start": completed ? renderResults() : renderStep(); break;
      case "close": intro(); content.querySelector("button").focus(); status.textContent = "Dice finder closed. Your answers are kept until you leave this page."; break;
      case "back": step = Math.max(0, step - 1); renderStep(); break;
      case "edit": step = 0; renderStep(); break;
      case "budget": step = 1; renderStep(); break;
      case "reset": Object.keys(answers).forEach((key) => delete answers[key]); step = 0; renderStep(); break;
    }
  });
  intro();
})();

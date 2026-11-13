"use strict";

function diceRandomWord() {
  if (globalThis.crypto?.getRandomValues) return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 4294967296);
}
function rollDiceValue(sides, draw = diceRandomWord) {
  if (sides !== 6 && sides !== 20) throw new RangeError("Choose D6 or D20.");
  const limit = Math.floor(4294967296 / sides) * sides;
  let word;
  do {
    word = draw();
    if (!Number.isInteger(word) || word < 0 || word >= 4294967296) throw new RangeError("Invalid random word.");
  } while (word >= limit);
  return word % sides + 1;
}
if (typeof module !== "undefined" && module.exports) module.exports = { rollDiceValue };

const diceRollerStates = new Map();
function diceFace(sides) {
  return sides === 6
    ? '<svg viewBox="0 0 200 200" aria-hidden="true"><rect x="28" y="28" width="144" height="144" rx="25" fill="#637958"/><rect x="39" y="39" width="122" height="122" rx="19" fill="none" stroke="#f5eed6" stroke-opacity=".4"/></svg>'
    : '<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M100 9 183 57 174 149 100 192 26 149 17 57Z" fill="#ad482d"/><path d="M100 9 142 66 183 57M17 57l42 9 41-57M26 149l33-83h83l32 83-74 43-74-43M59 66l41 78 42-78M26 149l74-5 74 5M100 144v48" fill="none" stroke="#f5eed6" stroke-opacity=".4" stroke-width="1.5"/></svg>';
}
function cancelDiceRoll(context) {
  const state = diceRollerStates.get(context);
  if (!state) return;
  clearTimeout(state.timer);
  state.timer = null;
  state.rolling = false;
  updateDiceRoller(context);
}
function diceRollerMarkup(context, initialSides = 20) {
  cancelDiceRoll(context);
  diceRollerStates.set(context, { sides: initialSides, value: null, history: [], rollCount: 0, rolling: false, timer: null, message: "Choose a die, then give it a roll." });
  return `<div class="dice-roller-widget" data-roller="${context}" role="group" aria-label="D6 and D20 dice roller" aria-busy="false"><div class="roller-play"><div class="roller-die" data-sides="${initialSides}"><div class="roller-art">${diceFace(initialSides)}</div><output class="roller-result" aria-label="D${initialSides} result" aria-live="off">—</output></div><div class="roller-choices"><fieldset class="roller-types"><legend>Choose a die</legend>${[6, 20].map((sides) => `<label><input type="radio" name="roller-${context}-type" value="${sides}" ${sides === initialSides ? "checked" : ""}><span><strong>D${sides}</strong> <span>${sides} sides</span></span></label>`).join("")}</fieldset><button type="button" class="button primary roller-roll" data-roller-action="roll" aria-disabled="false">Roll D${initialSides}</button><p class="roller-status" role="status" aria-live="polite" aria-atomic="true">Choose a die, then give it a roll.</p></div></div><div class="roller-history-heading"><h3>Recent rolls</h3><button class="text-button" type="button" data-roller-action="clear" aria-label="Clear roll history" disabled>Clear history</button></div><p class="roller-history-note">Latest first · Up to 8 rolls · Kept for this visit</p><ol class="roller-history" aria-label="Recent rolls, latest first"></ol><p class="roller-empty">Roll history is empty.</p></div>`;
}
function productDiceRoller(product) {
  const sides = product.type === "D6" ? 6 : 20;
  return `<details class="product-roller"><summary>${product.type === "Set" ? "Try the D6/D20 roller" : `Try a virtual D${sides}`}</summary>${diceRollerMarkup("detail", sides)}</details>`;
}
function updateDiceRoller(context) {
  if (typeof document === "undefined") return;
  const root = document.querySelector(`[data-roller="${context}"]`);
  const state = diceRollerStates.get(context);
  if (!root || !state) return;
  root.setAttribute("aria-busy", String(state.rolling));
  root.classList.toggle("is-rolling", state.rolling);
  root.classList.toggle("is-twenty", state.sides === 20 && state.value === 20);
  root.querySelector(".roller-art").innerHTML = diceFace(state.sides);
  root.querySelector(".roller-die").dataset.sides = state.sides;
  const output = root.querySelector(".roller-result");
  output.textContent = state.value ?? "—";
  output.setAttribute("aria-label", `D${state.sides} result`);
  const button = root.querySelector(".roller-roll");
  button.textContent = state.rolling ? "Rolling…" : `Roll D${state.sides}`;
  button.setAttribute("aria-disabled", String(state.rolling));
  root.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.disabled = state.rolling;
    input.checked = Number(input.value) === state.sides;
  });
  const status = root.querySelector(".roller-status");
  if (status.textContent !== state.message) status.textContent = state.message;
  root.querySelector('[data-roller-action="clear"]').disabled = state.rolling || !state.history.length;
  root.querySelector(".roller-history").innerHTML = state.history.map((roll) => `<li><span>D${roll.sides}</span><strong>${roll.value}</strong></li>`).join("");
  root.querySelector(".roller-empty").hidden = state.history.length > 0;
}
function startDiceRoll(context) {
  const state = diceRollerStates.get(context);
  if (!state || state.rolling) return;
  let result;
  try { result = rollDiceValue(state.sides); }
  catch { state.message = "The roll couldn’t be generated. Please try again."; updateDiceRoller(context); return; }
  state.rolling = true;
  updateDiceRoller(context);
  const finish = () => {
    if (!state.rolling || diceRollerStates.get(context) !== state) return;
    state.timer = null;
    state.rolling = false;
    state.value = result;
    state.history.unshift({ sides: state.sides, value: result });
    state.history.splice(8);
    state.rollCount++;
    state.message = `D${state.sides} rolled ${result}.${state.sides === 20 && result === 20 ? " Natural 20!" : ""} Roll ${state.rollCount}.`;
    updateDiceRoller(context);
  };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) finish();
  else state.timer = setTimeout(finish, 520);
}
if (typeof document !== "undefined") {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-roller-action]");
    if (!button) return;
    const root = button.closest("[data-roller]");
    const context = root.dataset.roller;
    const state = diceRollerStates.get(context);
    if (!state || state.rolling) return;
    if (button.dataset.rollerAction === "roll") startDiceRoll(context);
    else {
      state.history = [];
      state.message = "Roll history cleared.";
      updateDiceRoller(context);
      root.querySelector(".roller-roll").focus();
    }
  });
  document.addEventListener("change", (event) => {
    const input = event.target;
    if (!input.matches('.dice-roller-widget input[type="radio"]')) return;
    const context = input.closest("[data-roller]").dataset.roller;
    const state = diceRollerStates.get(context);
    if (!state || state.rolling) return;
    state.sides = Number(input.value);
    state.value = null;
    state.message = `D${state.sides} selected. Roll when you’re ready.`;
    updateDiceRoller(context);
  });
  // The full-page roller section was folded into the closing-note die
  // (dice-roll.js); this widget now lives only in product details.
  document.addEventListener("DOMContentLoaded", () => {
    const dialog = document.querySelector("#product-dialog");
    dialog.addEventListener("close", () => { if (!dialog.open) cancelDiceRoll("detail"); });
  });
}

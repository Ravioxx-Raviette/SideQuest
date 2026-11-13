/*
 * The die in the closing note: switch between a D6 and a D20, then click
 * (or press Enter/Space) to roll it. It hops while flicking through faces,
 * lands on a fair random result, and announces it through the polite live
 * region under the die. The latest rolls are listed underneath and saved in
 * this browser so they survive a refresh; if storage is blocked they last
 * for the current visit only.
 */
(() => {
  "use strict";

  const die = document.getElementById("closing-die");
  const face = die?.querySelector(".closing-die-face");
  const pips = die?.querySelector(".d6-pips");
  const result = document.getElementById("die-result");
  const historyBox = document.getElementById("die-history");
  const historyList = historyBox?.querySelector("ol");
  const clearButton = historyBox?.querySelector(".die-history-clear");
  const switches = [...document.querySelectorAll('input[name="closing-die-type"]')];
  if (!die || !face || !pips || !result || !historyBox || !historyList || !clearButton) return;

  const STORAGE_KEY = "sidequest-closing-rolls-v1";
  const HISTORY_LIMIT = 5;
  const ROLL_MS = 950;
  const SVG_NS = "http://www.w3.org/2000/svg";
  // Pip centres on the cube's front face (see .d6-front in index.html).
  const PIP = { tl: [27, 47], tr: [59, 47], ml: [27, 65], c: [43, 65], mr: [59, 65], bl: [27, 83], br: [59, 83] };
  const PIP_LAYOUT = {
    1: ["c"],
    2: ["tl", "br"],
    3: ["tl", "c", "br"],
    4: ["tl", "tr", "bl", "br"],
    5: ["tl", "tr", "c", "bl", "br"],
    6: ["tl", "tr", "ml", "mr", "bl", "br"],
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let sides = 20;
  let rolling = false;
  let history = loadHistory();

  function roll(count) {
    // Shared, rejection-sampled generator from roller.js keeps every face
    // exactly equally likely.
    if (typeof rollDiceValue === "function") return rollDiceValue(count);
    return Math.floor(Math.random() * count) + 1;
  }

  function loadHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved
        .filter((entry) => (entry?.sides === 6 || entry?.sides === 20) && Number.isInteger(entry.value) && entry.value >= 1 && entry.value <= entry.sides)
        .slice(0, HISTORY_LIMIT)
        .map(({ sides: s, value }) => ({ sides: s, value }));
    } catch {
      return [];
    }
  }

  function saveHistory() {
    try {
      if (history.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Storage blocked: the list still works for this visit. */
    }
  }

  function renderHistory() {
    historyBox.hidden = history.length === 0;
    historyList.innerHTML = "";
    history.forEach(({ sides: s, value }) => {
      const item = document.createElement("li");
      item.className = value === s ? "is-max" : value === 1 ? "is-min" : "";
      item.innerHTML = `<span>D${s}</span> ${value}`;
      item.setAttribute("aria-label", `D${s}: ${value}`);
      historyList.append(item);
    });
  }

  function showFace(value, kind = sides) {
    if (kind === 20) {
      face.textContent = value;
      return;
    }
    pips.replaceChildren(
      ...PIP_LAYOUT[value].map((key) => {
        const dot = document.createElementNS(SVG_NS, "circle");
        dot.setAttribute("cx", PIP[key][0]);
        dot.setAttribute("cy", PIP[key][1]);
        dot.setAttribute("r", "5.5");
        return dot;
      }),
    );
  }

  function message(value) {
    if (value === sides) return sides === 20 ? "Natural 20! Critical hit ✦" : "A perfect 6 ✦";
    if (value === 1) return sides === 20 ? "Natural 1… the dice gods frown." : "Just a 1… shake it off.";
    if (sides === 20 && value >= 15) return `You rolled a ${value}. Nicely done!`;
    return `You rolled a ${value}.`;
  }

  function setSides(next) {
    sides = next;
    die.dataset.sides = String(next);
    die.classList.remove("is-crit", "is-fumble");
    die.setAttribute("aria-label", `Roll the D${next}`);
    showFace(next);
    result.textContent = `D${next} ready. Tap to roll`;
  }

  function land(value) {
    showFace(value);
    die.classList.remove("is-rolling");
    die.classList.toggle("is-crit", value === sides);
    die.classList.toggle("is-fumble", value === 1);
    die.setAttribute("aria-label", `Roll the D${sides} again. Last roll: ${value}`);
    result.textContent = message(value);
    history.unshift({ sides, value });
    history.splice(HISTORY_LIMIT);
    saveHistory();
    renderHistory();
    switches.forEach((input) => (input.disabled = false));
    rolling = false;
  }

  die.addEventListener("click", () => {
    if (rolling) return;
    rolling = true;
    switches.forEach((input) => (input.disabled = true));
    const value = roll(sides);
    die.classList.remove("is-crit", "is-fumble");

    if (reducedMotion.matches) {
      land(value);
      return;
    }

    result.textContent = "Rolling…";
    // Restart the tumble animation even on back-to-back rolls.
    die.classList.remove("is-rolling");
    void die.offsetWidth;
    die.classList.add("is-rolling");

    // Flick through faces, slowing down as the die settles.
    const start = performance.now();
    let delay = 45;
    const flick = () => {
      if (performance.now() - start >= ROLL_MS - 80) {
        land(value);
        return;
      }
      showFace(roll(sides));
      delay *= 1.16;
      window.setTimeout(flick, delay);
    };
    window.setTimeout(flick, delay);
  });

  switches.forEach((input) =>
    input.addEventListener("change", () => {
      if (input.checked && !rolling) setSides(Number(input.value));
    }),
  );

  clearButton.addEventListener("click", () => {
    history = [];
    saveHistory();
    renderHistory();
    result.textContent = "Recent rolls cleared.";
    die.focus();
  });

  showFace(6, 6); // Pre-draw the D6 so switching never shows an empty cube.
  renderHistory();
})();

/*
 * The D20 in the closing note: click (or press Enter/Space) to roll it.
 * It hops while flicking through numbers, lands on a fair random result,
 * and announces it through the polite live region under the die.
 */
(() => {
  "use strict";

  const die = document.getElementById("closing-die");
  const face = die?.querySelector(".closing-die-face");
  const result = document.getElementById("die-result");
  if (!die || !face || !result) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ROLL_MS = 950;
  let rolling = false;

  function rollD20() {
    if (window.crypto?.getRandomValues) {
      // Rejection sampling keeps every face exactly equally likely.
      const buffer = new Uint8Array(1);
      do window.crypto.getRandomValues(buffer);
      while (buffer[0] >= 240);
      return (buffer[0] % 20) + 1;
    }
    return Math.floor(Math.random() * 20) + 1;
  }

  function message(value) {
    if (value === 20) return "Natural 20! Critical hit ✦";
    if (value === 1) return "Natural 1… the dice gods frown.";
    if (value >= 15) return `You rolled a ${value}. Nicely done!`;
    return `You rolled a ${value}.`;
  }

  function land(value) {
    face.textContent = value;
    die.classList.remove("is-rolling");
    die.classList.toggle("is-crit", value === 20);
    die.classList.toggle("is-fumble", value === 1);
    die.setAttribute("aria-label", `Roll the D20 again. Last roll: ${value}`);
    result.textContent = message(value);
    rolling = false;
  }

  die.addEventListener("click", () => {
    if (rolling) return;
    rolling = true;
    const value = rollD20();
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
      face.textContent = rollD20();
      delay *= 1.16;
      window.setTimeout(flick, delay);
    };
    window.setTimeout(flick, delay);
  });
})();

/*
 * Light / dark theme toggle. The initial theme is set by a tiny inline script
 * in <head> (saved choice, else the system preference) so the page never
 * flashes the wrong colors; this file wires up the header button.
 */
(() => {
  "use strict";

  const STORAGE_KEY = "sidequest-theme";
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const BAR_COLORS = { light: "#3b2516", dark: "#1e120a" };

  function savedTheme() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === "light" || value === "dark" ? value : null;
    } catch {
      return null;
    }
  }

  function apply(theme, animate) {
    if (animate && !reducedMotion.matches) {
      root.classList.add("theme-transition");
      window.setTimeout(() => root.classList.remove("theme-transition"), 450);
    }
    root.setAttribute("data-theme", theme);
    if (themeColor) themeColor.setAttribute("content", BAR_COLORS[theme]);
    if (toggle) {
      const dark = theme === "dark";
      toggle.setAttribute("aria-pressed", String(dark));
      toggle.title = dark ? "Switch to light mode" : "Switch to dark mode";
    }
  }

  apply(root.getAttribute("data-theme") === "dark" ? "dark" : "light", false);

  toggle?.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    apply(next, true);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Storage unavailable: the choice lasts for this page view only. */
    }
  });

  // Follow the system setting until the visitor picks a theme themselves.
  systemDark.addEventListener?.("change", (event) => {
    if (!savedTheme()) apply(event.matches ? "dark" : "light", true);
  });
})();

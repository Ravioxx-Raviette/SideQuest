"use strict";

function sortCatalog(products, order) {
  const ordered = [...products];
  const comparators = {
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    "name-asc": (a, b) => a.name.localeCompare(b.name, "en"),
    "name-desc": (a, b) => b.name.localeCompare(a.name, "en"),
  };
  if (comparators[order]) ordered.sort(comparators[order]);
  return ordered;
}

function renderActiveFilters() {
  const filters = [];
  const query = document.querySelector("#search").value.trim();
  const type = document.querySelector('input[name="type"]:checked').value;
  const material = document.querySelector("#material");
  const price = document.querySelector("#price");
  if (query) filters.push(["search", `Search: “${query}”`]);
  if (type !== "all") filters.push(["type", type === "Set" ? "Dice sets" : `${type} dice`]);
  if (material.value !== "all") filters.push(["material", `Material: ${material.selectedOptions[0].textContent}`]);
  if (price.value !== "all") filters.push(["price", `Price: ${price.selectedOptions[0].textContent}`]);
  document.querySelector("#active-filters").hidden = filters.length === 0;
  document.querySelector("#filter-chip-list").innerHTML = filters.map(([key, label]) =>
    `<li><button class="filter-chip" type="button" data-clear-filter="${key}" aria-label="Remove ${key} filter" aria-describedby="filter-value-${key}"><span id="filter-value-${key}">${escapeHTML(label)}</span><span aria-hidden="true">×</span></button></li>`,
  ).join("");
}

document.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-clear-filter]");
  if (chip) {
    const index = [...document.querySelectorAll("[data-clear-filter]")].indexOf(chip);
    const key = chip.dataset.clearFilter;
    if (key === "search") document.querySelector("#search").value = "";
    else if (key === "type") document.querySelector('input[name="type"][value="all"]').checked = true;
    else if (key === "material" || key === "price") document.querySelector(`#${key}`).value = "all";
    else return;
    renderProducts();
    const remaining = document.querySelectorAll("[data-clear-filter]");
    (remaining[Math.min(index, remaining.length - 1)] || document.querySelector("#search")).focus();
    return;
  }
  if (event.target.closest("#clear-active-filters")) {
    resetFilters();
    document.querySelector("#search").focus();
  }
});

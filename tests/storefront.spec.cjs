const { test, expect } = require("@playwright/test");

test("combined filters and empty-state reset", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".product-card")).toHaveCount(8);
  await page.locator(".filters").getByRole("radio", { name: "D20", exact: false }).check();
  await page.getByLabel("Material", { exact: true }).selectOption("Metal");
  await page.getByLabel("Price range").selectOption("250to500");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.locator(".product-card h3")).toHaveText("Forged D20");
  await page.getByLabel("Search dice by name").fill("nothing matches");
  await expect(
    page.getByRole("heading", { name: "No dice found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear all filters" }).click();
  await expect(page.locator(".product-card")).toHaveCount(8);
  await page.getByLabel("Search dice by name").fill("mOsS");
  await expect(page.locator(".product-card h3")).toHaveText("Moss D6");
});

test("details, quantities, persistence, and removal cancellation", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "View details for Ember D20", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Ember D20" });
  await expect(dialog).toContainText("22 mm");
  await dialog
    .getByRole("button", { name: "Increase Ember D20 quantity" })
    .click();
  await dialog
    .getByRole("button", { name: "Add to cart", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "View details for Ember D20",
      exact: true,
    }),
  ).toBeFocused();
  await page.getByRole("link", { name: "Your bag, 2 items" }).click();
  await expect(page.locator(".summary-total")).toContainText("₱360");
  await page
    .getByRole("spinbutton", { name: "Ember D20 quantity", exact: true })
    .fill("3");
  await page
    .getByRole("spinbutton", { name: "Ember D20 quantity", exact: true })
    .press("Tab");
  await expect(page.locator(".summary-total")).toContainText("₱540");
  await page.reload();
  await expect(
    page.getByRole("spinbutton", { name: "Ember D20 quantity", exact: true }),
  ).toHaveValue("3");
  await page.getByRole("button", { name: "Remove Ember D20 from bag" }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("spinbutton", { name: "Ember D20 quantity", exact: true }),
  ).toHaveValue("3");
  await page.getByRole("button", { name: "Remove Ember D20 from bag" }).click();
  await page.getByRole("button", { name: "Remove item", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your next adventure awaits." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue to checkout" }),
  ).toBeDisabled();
});

test("checkout validates, preserves canceled orders, and completes once", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Add Moss D6 to cart", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add Starlight Set to cart", exact: true })
    .click();
  await page.getByRole("link", { name: "Your bag, 2 items" }).click();
  await page.getByRole("button", { name: "Continue to checkout" }).click();
  await page.getByRole("button", { name: "Review your order" }).click();
  await expect(page.getByLabel("Full name")).toBeFocused();
  await expect(page.locator("#name-error")).toBeVisible();
  await page.getByLabel("Full name").fill("Test Adventurer");
  await page.getByLabel("Delivery address").fill("123 Sample Street, Cavite");
  await page.getByLabel("Contact number").fill("abc");
  await page.getByRole("button", { name: "Review your order" }).click();
  await expect(page.locator("#phone-error")).toBeVisible();
  await page.getByLabel("Contact number").fill("0917 123 4567");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-delivery.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Review your order" }).click();
  await expect(page.locator('[aria-current="step"]')).toContainText("Review");
  await expect(page.locator("#review-delivery")).toContainText(
    "Test Adventurer",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-review.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Edit delivery details" }).click();
  await expect(page.getByLabel("Full name")).toHaveValue("Test Adventurer");
  await page.getByRole("button", { name: "Review your order" }).click();
  await page
    .getByRole("button", { name: "Place order", exact: false })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#review-delivery")).toContainText(
    "Test Adventurer",
  );
  await expect(
    page.getByRole("link", { name: "Your bag, 2 items" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Place order", exact: false })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Place order", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "You’re on a roll." }),
  ).toBeVisible();
  await expect(page.locator('[aria-current="step"]')).toContainText("Complete");
  await expect(page.locator(".success-panel")).toContainText("₱770");
  await expect(page.locator(".order-number")).toHaveText(/^SQ-[A-Z0-9]{8}$/);
  await expect(
    page.getByRole("link", { name: "Your bag, 0 items" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("sidequest-cart-v1")),
    ),
  ).toEqual([]);
  await page.getByRole("link", { name: "Continue shopping" }).click();
  await page.getByRole("link", { name: "Your bag, 0 items" }).click();
  await expect(
    page.getByRole("button", { name: "Continue to checkout" }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});

test("keyboard access, modal focus containment, and responsive layout", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  await page
    .getByRole("button", { name: "View details for Tide D20", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Tide D20" });
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => document.activeElement.closest("dialog")?.id),
    ).toBe("product-dialog");
  }
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", {
      name: "View details for Tide D20",
      exact: true,
    }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.locator("#main").focus();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-shop.png`,
    fullPage: true,
  });
});

test("invalid saved carts are sanitized and empty checkout is guarded", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "sidequest-cart-v1",
      JSON.stringify([
        { id: "unknown", quantity: 2 },
        { id: "ember-d20", quantity: -1 },
        { id: "moss-d6", quantity: 2.5 },
      ]),
    ),
  );
  await page.goto("/#checkout");
  await expect(page).toHaveURL(/#cart$/);
  await expect(
    page.getByRole("heading", { name: "Your next adventure awaits." }),
  ).toBeVisible();
});

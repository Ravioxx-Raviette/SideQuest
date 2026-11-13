const { test, expect } = require('@playwright/test');
const names = (page) => page.locator('#products .product-card h3');

test('catalog sorts all five ways and restores curated order', async ({ page }) => {
  await page.goto('/');
  const sort = page.getByLabel('Sort by', { exact: true });
  await sort.selectOption('price-asc');
  await expect(names(page)).toHaveText(['Ivory D6', 'Moss D6', 'Ember D20', 'Tide D20', 'Forged D20', 'Rosewater Set', 'Starlight Set', 'Copperbound Set']);
  await sort.selectOption('price-desc');
  await expect(names(page)).toHaveText(['Copperbound Set', 'Starlight Set', 'Rosewater Set', 'Forged D20', 'Tide D20', 'Ember D20', 'Moss D6', 'Ivory D6']);
  await sort.selectOption('name-asc');
  await expect(names(page)).toHaveText(['Copperbound Set', 'Ember D20', 'Forged D20', 'Ivory D6', 'Moss D6', 'Rosewater Set', 'Starlight Set', 'Tide D20']);
  await sort.selectOption('name-desc');
  await expect(names(page)).toHaveText(['Tide D20', 'Starlight Set', 'Rosewater Set', 'Moss D6', 'Ivory D6', 'Forged D20', 'Ember D20', 'Copperbound Set']);
  await sort.selectOption('featured');
  await expect(names(page)).toHaveText(['Ember D20', 'Moss D6', 'Starlight Set', 'Ivory D6', 'Forged D20', 'Rosewater Set', 'Tide D20', 'Copperbound Set']);
});

test('filter chips remove one constraint at a time and recover from no results', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'D20', exact: false }).check();
  await page.getByLabel('Material', { exact: true }).selectOption('Metal');
  await page.getByLabel('Price range').selectOption('under250');
  await page.getByLabel('Search dice by name').fill('D20');
  const chips = page.getByRole('group', { name: 'Active filters', exact: true });
  await expect(chips.locator('[data-clear-filter]')).toHaveCount(4);
  await expect(chips.getByRole('button', { name: 'Remove material filter', exact: true })).toHaveAccessibleDescription('Material: Metal');
  await expect(page.getByRole('heading', { name: 'No dice found' })).toBeVisible();
  await chips.getByRole('button', { name: 'Remove price filter', exact: true }).click();
  await expect(names(page)).toHaveText(['Forged D20']);
  await expect(page.getByLabel('Material', { exact: true })).toHaveValue('Metal');
  await expect(page.getByLabel('Search dice by name')).toHaveValue('D20');
  await chips.getByRole('button', { name: 'Remove material filter', exact: true }).click();
  await expect(names(page)).toHaveCount(3);
  await page.locator('.catalog-toolbar').screenshot({ path: `artifacts/${testInfo.project.name}-catalog-toolbar.png` });
  await chips.screenshot({ path: `artifacts/${testInfo.project.name}-filter-chips.png` });
  await chips.getByRole('button', { name: 'Clear all active filters', exact: true }).click();
  await expect(chips).toBeHidden();
  await expect(page.getByLabel('Search dice by name')).toBeFocused();
  await expect(names(page)).toHaveCount(8);
});

test('sorting and chips preserve favorites, comparison, and guide browsing', async ({ page }) => {
  await page.goto('/');
  await page.locator('#products').getByRole('button', { name: 'Save Ember D20 to wishlist', exact: true }).click();
  await page.locator('#products').getByRole('button', { name: 'Compare Forged D20', exact: true }).click();
  const sort = page.getByLabel('Sort by', { exact: true });
  await sort.selectOption('price-desc');
  await page.getByLabel('Material', { exact: true }).selectOption('Metal');
  await expect(names(page)).toHaveText(['Copperbound Set', 'Forged D20']);
  await page.getByRole('button', { name: 'Remove material filter', exact: true }).click();
  await expect(names(page).first()).toHaveText('Copperbound Set');
  await expect(page.locator('#products').getByRole('button', { name: 'Save Ember D20 to wishlist', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#products').getByRole('button', { name: 'Compare Forged D20', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#guide-disclosure > summary').click();
  await page.locator('#dice-guide').getByRole('button', { name: 'Browse seven-piece sets', exact: true }).click();
  await expect(sort).toHaveValue('price-desc');
  await expect(names(page)).toHaveText(['Copperbound Set', 'Starlight Set', 'Rosewater Set']);
  await expect(page.getByRole('group', { name: 'Active filters', exact: true })).toContainText('Dice sets');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(sort).toHaveValue('price-desc');
  await expect(names(page).first()).toHaveText('Copperbound Set');
});

test('long search chips are escaped, fit narrow screens, and support keyboard removal', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 320, height: 740 });
  const text = '<img src=x onerror="window.badSearch=true">' + 'x'.repeat(350);
  await page.getByLabel('Search dice by name').fill(text);
  const chips = page.getByRole('group', { name: 'Active filters', exact: true });
  await expect(chips).toContainText(text);
  await expect(chips.locator('img')).toHaveCount(0);
  expect(await page.evaluate(() => window.badSearch)).toBeUndefined();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await chips.getByRole('button', { name: 'Remove search filter', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(chips).toBeHidden();
  await expect(page.getByLabel('Search dice by name')).toBeFocused();
  await expect(names(page)).toHaveCount(8);
});

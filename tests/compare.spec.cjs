const { test, expect } = require('@playwright/test');
const catalogToggle = (page, name) => page.locator('#products').getByRole('button', { name: `Compare ${name}`, exact: true });
async function selectTwo(page) {
  await page.goto('/');
  await catalogToggle(page, 'Ember D20').click();
  await catalogToggle(page, 'Forged D20').click();
}
async function openComparison(page) {
  await page.getByRole('button', { name: 'Compare selected dice', exact: true }).click();
  return page.getByRole('dialog', { name: 'Find your favorite roll.' });
}

test('comparison enforces three unique choices and preserves selections through filtering', async ({ page }) => {
  await selectTwo(page);
  await catalogToggle(page, 'Moss D6').click();
  await catalogToggle(page, 'Ivory D6').click();
  await expect(page.locator('#toast-region')).toContainText('up to 3');
  await expect(catalogToggle(page, 'Ivory D6')).toHaveAttribute('aria-pressed', 'false');
  await page.getByLabel('Search dice by name').fill('Ember');
  await expect(catalogToggle(page, 'Ember D20')).toHaveAttribute('aria-pressed', 'true');
  const dialog = await openComparison(page);
  await expect(dialog.locator('thead th[scope=col]')).toHaveCount(3);
  await expect(dialog).toContainText('Forged D20');
  await expect(dialog).toContainText('Moss D6');
  await dialog.getByRole('button', { name: 'Add Forged D20 to cart', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Your bag, 1 item', exact: true })).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Compare selected dice', exact: true })).toBeFocused();
});

test('comparison displays exact specs and can show only differing rows', async ({ page }, testInfo) => {
  await selectTwo(page);
  const dialog = await openComparison(page);
  await expect(dialog.getByRole('table')).toBeVisible();
  await expect(dialog.locator('[data-compare-row=price]')).toContainText('₱180');
  await expect(dialog.locator('[data-compare-row=price]')).toContainText('₱480');
  await expect(dialog.locator('[data-compare-row=size]')).toContainText('22 mm');
  await expect(dialog.locator('[data-compare-row=contents]')).toContainText('1 twenty-sided die');
  await dialog.getByLabel('Show differences only').check();
  await expect(dialog.locator('[data-compare-row=size]')).toHaveCount(0);
  await expect(dialog.locator('[data-compare-row=contents]')).toHaveCount(0);
  await expect(dialog.locator('[data-compare-row=material]')).toContainText('Metal');
  await dialog.getByLabel('Show differences only').uncheck();
  const scrollArea = dialog.getByRole('region', { name: 'Dice comparison table' });
  await scrollArea.focus();
  await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await scrollArea.evaluate((element) => { element.scrollLeft = 0; });
  await dialog.evaluate((element) => { element.scrollTop = 0; });
  await dialog.screenshot({ path: `artifacts/${testInfo.project.name}-comparison.png` });
});

test('removing below two gives a recovery path and clear-all restores focus', async ({ page }) => {
  await selectTwo(page);
  let dialog = await openComparison(page);
  await dialog.getByRole('button', { name: 'Remove Ember D20 from comparison', exact: true }).click();
  await expect(dialog).toContainText('Choose one more');
  await expect(dialog.getByRole('button', { name: 'Choose more dice', exact: true })).toBeFocused();
  await dialog.getByRole('button', { name: 'Choose more dice', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Compare selected dice', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Clear comparison', exact: true }).click();
  await expect(page.locator('#comparison-tray')).toBeHidden();
  await expect(page.locator('#products [data-compare][aria-pressed=true]')).toHaveCount(0);
  await expect(page.locator('#products [data-compare]').first()).toBeFocused();
});

test('comparison selections stay synchronized with product details and finder results', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'View details for Ember D20', exact: true }).click();
  const details = page.getByRole('dialog', { name: 'Ember D20' });
  await details.getByRole('button', { name: 'Compare Ember D20', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(catalogToggle(page, 'Ember D20')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Find my dice', exact: true }).click();
  await page.getByRole('radio', { name: 'A single D20', exact: false }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('radio', { name: 'Up to ₱250', exact: false }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('radio', { name: 'No material preference', exact: false }).check();
  await page.getByRole('button', { name: 'Show my matches', exact: true }).click();
  const resultToggle = page.locator('#finder-content').getByRole('button', { name: 'Compare Ember D20', exact: true });
  await expect(resultToggle).toHaveAttribute('aria-pressed', 'true');
  await resultToggle.click();
  await expect(catalogToggle(page, 'Ember D20')).toHaveAttribute('aria-pressed', 'false');
});

test('comparison keeps limit feedback above the tray and announces bag changes inside the dialog', async ({ page }) => {
  await selectTwo(page);
  await catalogToggle(page, 'Moss D6').click();
  await catalogToggle(page, 'Ivory D6').click();
  await expect.poll(async () => {
    const toast = await page.locator('#toast-region').boundingBox();
    const tray = await page.locator('#comparison-tray').boundingBox();
    return tray.y - (toast.y + toast.height);
  }).toBeGreaterThanOrEqual(8);
  const dialog = await openComparison(page);
  await dialog.getByRole('button', { name: 'Add Ember D20 to cart', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Ember D20 added to your bag');
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.closest('dialog')?.id)).toBe('comparison-dialog');
  }
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Your bag, 1 item', exact: true }).click();
  await expect(page.locator('#comparison-tray')).toBeHidden();
});

test('comparison restores focus to search when filters hide every product', async ({ page }) => {
  await selectTwo(page);
  const search = page.getByLabel('Search dice by name');
  await search.fill('no matching dice');
  const dialog = await openComparison(page);
  await dialog.getByRole('button', { name: 'Remove Ember D20 from comparison', exact: true }).click();
  await dialog.getByRole('button', { name: 'Choose more dice', exact: true }).click();
  await expect(search).toBeFocused();
  await page.getByRole('button', { name: 'Clear comparison', exact: true }).click();
  await expect(search).toBeFocused();
  await search.fill('Ember');
  await catalogToggle(page, 'Ember D20').click();
  await search.fill('no matching dice');
  await page.getByRole('button', { name: 'Remove Ember D20 from comparison', exact: true }).click();
  await expect(search).toBeFocused();
});

test('selection tray leaves footer content reachable at the bottom of the page', async ({ page }) => {
  await selectTwo(page);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const footer = await page.locator('.site-footer').boundingBox();
  const tray = await page.locator('#comparison-tray').boundingBox();
  expect(footer.y + footer.height).toBeLessThanOrEqual(tray.y - 8);
});

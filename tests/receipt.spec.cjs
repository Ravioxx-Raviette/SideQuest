const { test, expect } = require('@playwright/test');
const sample = (number = 'SQ-PRINT001') => ({ number, createdAt: '2026-11-13T10:00:00.000Z', items: [
  { id: 'ember-d20', name: 'Ember D20', quantity: 2, unitPrice: 150.25 },
  { id: 'retired', name: 'Retired Dice', quantity: 1, unitPrice: 25.50 },
] });
async function seed(page, orders = [sample()]) {
  await page.goto('/');
  await page.evaluate((orders) => localStorage.setItem('sidequest-orders-v1', JSON.stringify(orders)), orders);
  await page.goto('/#orders');
  await page.reload();
}
async function openSummary(page, number = 'SQ-PRINT001') {
  await page.getByRole('button', { name: `View summary for order ${number}`, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`#receipt/${number}$`));
}

test('summary uses original historical quantities and prices and survives direct refresh', async ({ page }, testInfo) => {
  await seed(page);
  await openSummary(page);
  await expect(page.locator('#receipt-heading')).toBeFocused();
  const receipt = page.locator('#order-receipt');
  await expect(receipt).toContainText('SQ-PRINT001');
  await expect(receipt).toContainText('₱150.25');
  await expect(receipt).toContainText('₱300.50');
  await expect(receipt).toContainText('₱326.00');
  await expect(receipt).toContainText('Retired Dice');
  await expect(receipt).not.toContainText('₱180');
  await expect(receipt).not.toContainText(/demo|simulated|delivery address|contact number/i);
  await receipt.screenshot({ path: `artifacts/${testInfo.project.name}-order-summary.png` });
  await page.reload();
  await expect(receipt).toContainText('SQ-PRINT001');
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Back to order history', exact: false }).click();
  await expect(page.locator('.order-record')).toHaveCount(1);
});

test('print delegates to the browser and print media isolates the selected summary', async ({ page }, testInfo) => {
  await seed(page, [sample(), sample('SQ-PRINT002')]);
  await openSummary(page);
  await page.evaluate(() => { window.print = () => { window.printRequested = true; }; });
  await page.getByRole('button', { name: 'Print summary', exact: true }).click();
  expect(await page.evaluate(() => window.printRequested)).toBe(true);
  await expect(page.locator('#receipt-view')).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('.site-header')).toBeHidden();
  await expect(page.locator('.site-footer')).toBeHidden();
  await expect(page.locator('.receipt-actions')).toBeHidden();
  await expect(page.locator('#orders-view')).toBeHidden();
  await expect(page.locator('#toast-region')).toBeHidden();
  await expect(page.locator('#order-receipt')).toBeVisible();
  await expect(page.locator('#order-receipt')).not.toContainText('SQ-PRINT002');
  await page.pdf({ path: `artifacts/${testInfo.project.name}-order-summary.pdf`, format: 'A4', printBackground: true, displayHeaderFooter: false });
  await page.emulateMedia({ media: 'screen' });
  await expect(page.getByRole('button', { name: 'Print summary', exact: true })).toBeVisible();
});

test('unknown summary route recovers and stored item names remain text', async ({ page }) => {
  await seed(page, [{ ...sample(), items: [{ id: 'retired', name: '<img src=x onerror="window.badReceipt=true">', quantity: 1, unitPrice: 1 }] }]);
  await openSummary(page);
  await expect(page.locator('#order-receipt')).toContainText('<img src=x');
  await expect(page.locator('#order-receipt img')).toHaveCount(0);
  await page.goto('/#receipt/SQ-MISSING1');
  await expect(page).toHaveURL(/#orders$/);
  await expect(page.locator('#orders-view')).toBeVisible();
});

test('completed order can open a summary even when order history cannot be saved', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'sidequest-orders-v1') throw new DOMException('Blocked', 'SecurityError');
      return original.call(this, key, value);
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Moss D6 to cart', exact: true }).click();
  await page.getByRole('link', { name: 'Your bag, 1 item', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to checkout', exact: true }).click();
  await page.getByLabel('Full name').fill('Do not print this name');
  await page.getByLabel('Delivery address').fill('Do not print this address');
  await page.getByLabel('Contact number').fill('09171234567');
  await page.getByRole('button', { name: 'Review your order', exact: true }).click();
  await page.getByRole('button', { name: 'Place order', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Place order', exact: true }).click();
  await page.getByRole('button', { name: 'View order summary', exact: true }).click();
  await expect(page.locator('#order-receipt')).toContainText('Moss D6');
  await expect(page.locator('#order-receipt')).not.toContainText(/Do not print|09171234567/);
  expect(await page.evaluate(() => localStorage.getItem('sidequest-orders-v1'))).toBeNull();
});

test('long multipage summaries retain every line and the original total', async ({ page }, testInfo) => {
  const items = Array.from({ length: 65 }, (_, index) => ({ id: `retired-${index}`, name: `Historical dice ${index + 1} — ${'adventure '.repeat(8)}`, quantity: 2, unitPrice: 12.50 }));
  await seed(page, [{ ...sample(), items }]);
  await openSummary(page);
  await expect(page.locator('#order-receipt tbody tr')).toHaveCount(65);
  await expect(page.locator('#receipt-total')).toContainText('₱1,625.00');
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: `artifacts/${testInfo.project.name}-order-summary-long.pdf`, format: 'A4', printBackground: true, displayHeaderFooter: false });
});

test('deleting an order in another tab invalidates its open summary', async ({ page }) => {
  await seed(page);
  await openSummary(page);
  const other = await page.context().newPage();
  await other.goto('/#orders');
  await other.getByRole('button', { name: 'Delete order SQ-PRINT001', exact: true }).click();
  await other.getByRole('dialog').getByRole('button', { name: 'Delete record', exact: true }).click();
  await expect(page).toHaveURL(/#orders$/);
  await expect(page.locator('#receipt-view')).toBeHidden();
  await expect(page.locator('#order-receipt')).toHaveCount(0);
  await expect(page.locator('#orders-heading')).toBeFocused();
  await other.close();
});

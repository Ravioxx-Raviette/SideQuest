const { test, expect } = require('@playwright/test');
const record = (items = [{ id: 'ember-d20', name: 'Ember D20', quantity: 2, unitPrice: 150 }]) => ({ number: 'SQ-TEST0001', createdAt: '2026-11-13T10:00:00.000Z', items });
async function seed(page, order = record(), bag = []) {
  await page.goto('/');
  await page.evaluate(({ order, bag }) => {
    localStorage.setItem('sidequest-orders-v1', JSON.stringify([order]));
    localStorage.setItem('sidequest-cart-v1', JSON.stringify(bag));
  }, { order, bag });
  await page.goto('/#orders');
  await page.reload();
}
async function review(page) {
  await page.getByRole('button', { name: 'Reorder SQ-TEST0001', exact: true }).click();
  return page.getByRole('dialog', { name: 'Another round of favorites.' });
}

test('confirmed checkout saves a private order snapshot and survives refresh', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Moss D6 to cart', exact: true }).click();
  await page.getByRole('link', { name: 'Your bag, 1 item', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to checkout', exact: true }).click();
  await page.getByLabel('Full name').fill('Private Name');
  await page.getByLabel('Delivery address').fill('Private Address');
  await page.getByLabel('Contact number').fill('09171234567');
  await page.getByRole('button', { name: 'Review your order', exact: true }).click();
  await page.getByRole('button', { name: 'Place order', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('sidequest-orders-v1'))).toBeNull();
  await page.getByRole('button', { name: 'Place order', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Place order', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re on a roll.' })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sidequest-orders-v1')));
  expect(saved).toHaveLength(1);
  expect(saved[0].items).toEqual([{ id: 'moss-d6', name: 'Moss D6', quantity: 1, unitPrice: 120 }]);
  expect(saved[0].total).toBe(120);
  expect(JSON.stringify(saved)).not.toMatch(/Private Name|Private Address|09171234567/);
  await page.getByRole('link', { name: 'View order history', exact: true }).click();
  await page.reload();
  await expect(page.locator('.order-record')).toHaveCount(1);
  await expect(page.locator('body')).not.toContainText(/demo|simulated|student storefront/i);
});

test('reorder reviews current prices and merges with the existing bag', async ({ page }, testInfo) => {
  await seed(page, record(), [{ id: 'ember-d20', quantity: 1 }, { id: 'moss-d6', quantity: 1 }]);
  await page.locator('.order-record summary').click();
  await expect(page.locator('.order-record')).toContainText('₱300');
  await page.locator('#orders-view').screenshot({ path: `artifacts/${testInfo.project.name}-orders.png` });
  const dialog = await review(page);
  await expect(dialog).toContainText('₱180');
  await expect(dialog).toContainText('₱150');
  await expect(dialog).toContainText('₱360');
  await dialog.screenshot({ path: `artifacts/${testInfo.project.name}-reorder.png` });
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await dialog.getByRole('button', { name: 'Add items to bag', exact: true }).click();
  await expect(page).toHaveURL(/#cart$/);
  await expect(page.getByRole('spinbutton', { name: 'Ember D20 quantity', exact: true })).toHaveValue('3');
  await expect(page.getByRole('spinbutton', { name: 'Moss D6 quantity', exact: true })).toHaveValue('1');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sidequest-orders-v1'))[0].items[0].unitPrice)).toBe(150);
});

test('reorder explains unavailable products and never partially applies quantity conflicts', async ({ page }) => {
  await seed(page, record([{ id: 'ember-d20', name: 'Ember D20', quantity: 2, unitPrice: 180 }, { id: 'retired', name: 'Retired Dice', quantity: 1, unitPrice: 50 }]), [{ id: 'ember-d20', quantity: 98 }]);
  let dialog = await review(page);
  await expect(dialog).toContainText('Retired Dice');
  await expect(dialog).toContainText('unavailable');
  await expect(dialog).toContainText('99');
  await expect(dialog.getByRole('button', { name: 'Add available items', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sidequest-cart-v1')))).toEqual([{ id: 'ember-d20', quantity: 98 }]);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Reorder SQ-TEST0001', exact: true })).toBeFocused();
  await seed(page, record([{ id: 'ember-d20', name: 'Ember D20', quantity: 2, unitPrice: 180 }, { id: 'retired', name: 'Retired Dice', quantity: 1, unitPrice: 50 }]));
  dialog = await review(page);
  await dialog.getByRole('button', { name: 'Add available items', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Ember D20 quantity', exact: true })).toHaveValue('2');
});

test('history sanitizes stored records, escapes names, and confirms deletion', async ({ page }) => {
  await seed(page, record([{ id: 'retired', name: '<img src=x onerror="window.badOrder=true">', quantity: 1, unitPrice: 20 }]));
  await page.locator('.order-record summary').click();
  await expect(page.locator('.order-record')).toContainText('<img src=x');
  await expect(page.locator('.order-record img')).toHaveCount(0);
  const dialog = await review(page);
  await expect(dialog.getByRole('button', { name: 'Add available items', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Delete order SQ-TEST0001', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('.order-record')).toHaveCount(1);
  await page.getByRole('button', { name: 'Delete order SQ-TEST0001', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete record', exact: true }).click();
  await expect(page.locator('.order-record')).toHaveCount(0);
  await expect(page.locator('#orders-heading')).toBeFocused();
  await page.evaluate(() => localStorage.setItem('sidequest-orders-v1', JSON.stringify([{ number: 'bad', items: [] }, { number: 'SQ-BAD00001', createdAt: 'invalid', items: [] }])));
  await page.reload();
  await expect(page.locator('.order-record')).toHaveCount(0);
});

test('history handles blocked saves, cross-tab updates, and narrow keyboard layout', async ({ page }) => {
  await seed(page);
  const other = await page.context().newPage();
  await other.goto('/#orders');
  await other.getByRole('button', { name: 'Clear order history', exact: true }).click();
  await other.getByRole('dialog').getByRole('button', { name: 'Clear history', exact: true }).click();
  await expect(page.locator('.order-record')).toHaveCount(0);
  await other.close();
  await seed(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'sidequest-orders-v1') throw new DOMException('Blocked', 'SecurityError');
      return original.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: 'Clear order history', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Clear history', exact: true }).click();
  await expect(page.locator('#orders-storage-note')).toBeVisible();
  await expect(page.locator('#orders-status')).toContainText('page only');
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('reorder updates a review when another tab changes bag quantities', async ({ page }) => {
  await seed(page);
  const dialog = await review(page);
  const other = await page.context().newPage();
  await other.goto('/');
  await other.evaluate(() => localStorage.setItem('sidequest-cart-v1', JSON.stringify([{ id: 'ember-d20', quantity: 98 }])));
  await expect(dialog.getByRole('button', { name: 'Add items to bag', exact: true })).toBeDisabled();
  await expect(dialog).toContainText('99');
  await expect(page.locator('#reorder-title')).toBeFocused();
  await other.evaluate(() => localStorage.setItem('sidequest-cart-v1', '[]'));
  await expect(dialog.getByRole('button', { name: 'Add items to bag', exact: true })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Add items to bag', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Ember D20 quantity', exact: true })).toHaveValue('2');
  await other.close();
});

test('failed history writes preserve local deletions and new orders through cross-tab updates', async ({ page }) => {
  await seed(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'sidequest-orders-v1') throw new DOMException('Blocked', 'SecurityError');
      return original.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: 'Delete order SQ-TEST0001', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete record', exact: true }).click();
  await expect(page.locator('.order-record')).toHaveCount(0);
  const other = await page.context().newPage();
  await other.goto('/');
  const second = { ...record(), number: 'SQ-TEST0002' };
  await other.evaluate((values) => localStorage.setItem('sidequest-orders-v1', JSON.stringify(values)), [record(), second]);
  await expect(page.locator('.order-record')).toHaveCount(1);
  await expect(page.locator('.order-record')).not.toContainText('SQ-TEST0001');
  await page.locator('#orders-view').getByRole('link', { name: 'Back to the collection', exact: false }).click();
  await page.getByRole('button', { name: 'Add Moss D6 to cart', exact: true }).click();
  await page.getByRole('link', { name: 'Your bag, 1 item', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to checkout', exact: true }).click();
  await page.getByLabel('Full name').fill('Name');
  await page.getByLabel('Delivery address').fill('Address');
  await page.getByLabel('Contact number').fill('09171234567');
  await page.getByRole('button', { name: 'Review your order', exact: true }).click();
  await page.getByRole('button', { name: 'Place order', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Place order', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re on a roll.' })).toBeVisible();
  const localNumber = await page.locator('.order-number').textContent();
  await page.getByRole('link', { name: 'View order history', exact: true }).click();
  await expect(page.locator('.order-record')).toHaveCount(2);
  await other.evaluate((values) => localStorage.setItem('sidequest-orders-v1', JSON.stringify(values)), [record(), second, { ...record(), number: 'SQ-TEST0003' }]);
  await expect(page.locator('.order-record')).toHaveCount(3);
  await expect(page.locator('#orders-content')).toContainText(localNumber);
  await expect(page.locator('#orders-content')).not.toContainText('SQ-TEST0001');
  await other.close();
});

test('cross-tab history refresh keeps keyboard focus inside the reorder review', async ({ page }) => {
  await seed(page);
  const dialog = await review(page);
  await dialog.getByRole('button', { name: 'Add items to bag', exact: true }).focus();
  const other = await page.context().newPage();
  await other.goto('/');
  await other.evaluate((value) => localStorage.setItem('sidequest-orders-v1', JSON.stringify([value])), record([{ id: 'ember-d20', name: 'Ember D20', quantity: 3, unitPrice: 150 }]));
  await expect(page.locator('#reorder-title')).toBeFocused();
  await expect(dialog).toContainText('Quantity: 3');
  await other.close();
});

const { test, expect } = require('@playwright/test');
async function seed(page, items) {
  await page.goto('/');
  await page.evaluate((items) => localStorage.setItem('sidequest-cart-v1', JSON.stringify(items)), items);
  await page.goto('/#cart');
  await page.reload();
}
async function remove(page, name) {
  await page.getByRole('button', { name: `Remove ${name} from bag`, exact: true }).click();
  await page.getByRole('button', { name: 'Remove item', exact: true }).click();
  await expect(page.getByRole('button', { name: `Remove ${name} from bag`, exact: true, includeHidden: true })).toHaveCount(0);
}
const undo = (page) => page.getByRole('button', { name: 'Undo last item removal', exact: true });

test('undo restores quantity, position, totals, and saved bag', async ({ page }, testInfo) => {
  await seed(page, [{ id: 'ember-d20', quantity: 3 }, { id: 'moss-d6', quantity: 1 }]);
  await remove(page, 'Ember D20');
  await expect(undo(page)).toBeFocused();
  await expect(undo(page)).toHaveAccessibleDescription('Ember D20 × 3 removed from your bag.');
  await expect(page.locator('#cart-undo-region')).toContainText('Ember D20 × 3');
  await expect(page.locator('.summary-total')).toContainText('₱120');
  await page.locator('#cart-view').screenshot({ path: `artifacts/${testInfo.project.name}-cart-undo.png` });
  await page.keyboard.press('Enter');
  await expect(page.getByRole('spinbutton', { name: 'Ember D20 quantity', exact: true })).toHaveValue('3');
  await expect(page.getByRole('spinbutton', { name: 'Ember D20 quantity', exact: true })).toBeFocused();
  await expect(page.locator('.cart-item h3')).toHaveText(['Ember D20', 'Moss D6']);
  await expect(page.locator('.summary-total')).toContainText('₱660');
  await page.reload();
  await expect(page.getByRole('spinbutton', { name: 'Ember D20 quantity', exact: true })).toHaveValue('3');
  await expect(page.locator('#cart-undo-region')).toBeHidden();
});

test('undo recovers multiple removals and the last item from an empty bag', async ({ page }) => {
  await seed(page, [{ id: 'ember-d20', quantity: 2 }, { id: 'moss-d6', quantity: 3 }]);
  await remove(page, 'Ember D20');
  await remove(page, 'Moss D6');
  await expect(page.getByRole('button', { name: 'Continue to checkout', exact: true })).toBeDisabled();
  await undo(page).click();
  await expect(page.getByRole('spinbutton', { name: 'Moss D6 quantity', exact: true })).toHaveValue('3');
  await expect(page.locator('#cart-undo-region')).toContainText('Ember D20 × 2');
  await undo(page).click();
  await expect(page.locator('.cart-item h3')).toHaveText(['Ember D20', 'Moss D6']);
  await expect(page.getByRole('spinbutton', { name: 'Ember D20 quantity', exact: true })).toHaveValue('2');
  await expect(page.locator('#cart-undo-region')).toBeHidden();
});

test('undo preserves history when a re-added product would exceed 99', async ({ page }) => {
  await seed(page, [{ id: 'ember-d20', quantity: 98 }]);
  await remove(page, 'Ember D20');
  await page.getByRole('link', { name: 'Back to the collection', exact: false }).click();
  await page.getByRole('button', { name: 'Add Ember D20 to cart', exact: true }).click();
  await page.getByRole('button', { name: 'Add Ember D20 to cart', exact: true }).click();
  await page.getByRole('link', { name: 'Your bag, 2 items', exact: true }).click();
  await undo(page).click();
  await expect(page.getByRole('spinbutton', { name: 'Ember D20 quantity', exact: true })).toHaveValue('2');
  await expect(page.locator('#cart-undo-feedback')).toContainText('99');
  const quantity = page.getByRole('spinbutton', { name: 'Ember D20 quantity', exact: true });
  await quantity.fill('1');
  await quantity.press('Tab');
  await undo(page).click();
  await expect(quantity).toHaveValue('99');
});

test('checkout and another-tab cart changes invalidate removal recovery', async ({ page }) => {
  await seed(page, [{ id: 'ember-d20', quantity: 1 }, { id: 'moss-d6', quantity: 1 }]);
  await remove(page, 'Ember D20');
  await page.getByRole('button', { name: 'Continue to checkout', exact: true }).click();
  await page.getByRole('link', { name: 'Back to your bag', exact: false }).click();
  await expect(page.locator('#cart-undo-region')).toBeHidden();
  await remove(page, 'Moss D6');
  await page.evaluate(() => { location.hash = 'checkout'; });
  await expect(page).toHaveURL(/#cart$/);
  await expect(undo(page)).toBeVisible();
  const other = await page.context().newPage();
  await other.goto('/');
  await other.getByRole('button', { name: 'Add Tide D20 to cart', exact: true }).click();
  await expect(page.locator('#cart-undo-region')).toBeHidden();
  await expect(page.locator('.cart-item h3')).toHaveText('Tide D20');
  await other.close();
});

test('undo explains storage failures and dismissal keeps the removal', async ({ page }) => {
  await seed(page, [{ id: 'ember-d20', quantity: 2 }]);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'sidequest-cart-v1') throw new DOMException('Storage blocked', 'SecurityError');
      return original.call(this, key, value);
    };
  });
  await remove(page, 'Ember D20');
  await undo(page).click();
  await expect(page.getByRole('spinbutton', { name: 'Ember D20 quantity', exact: true })).toHaveValue('2');
  await expect(page.locator('#toast-region')).toContainText('page only');
  await remove(page, 'Ember D20');
  await page.getByRole('button', { name: 'Dismiss undo history', exact: true }).click();
  await expect(page.locator('#cart-undo-region')).toBeHidden();
  await expect(page.locator('#cart-heading')).toBeFocused();
  await expect(page.locator('.cart-item')).toHaveCount(0);
});

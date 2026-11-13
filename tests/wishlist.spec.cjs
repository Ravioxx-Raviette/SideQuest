const { test, expect } = require('@playwright/test');
const toggle = (page, name) => page.locator('#products').getByRole('button', { name: `Save ${name} to wishlist`, exact: true });
const favorites = (page) => page.locator('#wishlist-view');
async function openWishlist(page, count) {
  await page.getByRole('link', { name: `Wishlist, ${count} saved ${count === 1 ? 'item' : 'items'}`, exact: true }).click();
}

test('wishlist saves unique favorites across refreshes and removes them with useful focus', async ({ page }, testInfo) => {
  await page.goto('/');
  await toggle(page, 'Ember D20').click();
  await toggle(page, 'Moss D6').click();
  await page.getByLabel('Search dice by name').fill('Ember');
  await expect(toggle(page, 'Ember D20')).toHaveAttribute('aria-pressed', 'true');
  await openWishlist(page, 2);
  await expect(page.locator('#wishlist-heading')).toBeFocused();
  await page.reload();
  await expect(favorites(page).locator('.wishlist-card')).toHaveCount(2);
  await favorites(page).screenshot({ path: `artifacts/${testInfo.project.name}-wishlist.png` });
  await favorites(page).getByRole('button', { name: 'Remove Ember D20 from wishlist', exact: true }).click();
  await expect(favorites(page).locator('.wishlist-card')).toHaveCount(1);
  expect(await page.evaluate(() => document.activeElement.closest('.wishlist-card') !== null)).toBe(true);
  await favorites(page).getByRole('button', { name: 'Remove Moss D6 from wishlist', exact: true }).click();
  await expect(favorites(page).getByRole('heading', { name: 'Your favorites start with a little curiosity.' })).toBeVisible();
  await expect(page.locator('#wishlist-heading')).toBeFocused();
});

test('moving to bag adds one and retains a favorite if its bag quantity is at the limit', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sidequest-cart-v1', JSON.stringify([{ id: 'ember-d20', quantity: 99 }])));
  await page.goto('/');
  await toggle(page, 'Ember D20').click();
  await toggle(page, 'Moss D6').click();
  await openWishlist(page, 2);
  await favorites(page).getByRole('button', { name: 'Move Ember D20 to bag', exact: true }).click();
  await expect(favorites(page).locator('.wishlist-card')).toHaveCount(2);
  await expect(page.locator('#wishlist-status')).toContainText('99');
  await favorites(page).getByRole('button', { name: 'Move Moss D6 to bag', exact: true }).click();
  await expect(favorites(page).locator('.wishlist-card')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Your bag, 100 items', exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sidequest-wishlist-v1')))).toEqual(['ember-d20']);
});

test('wishlist sanitizes storage and synchronizes changes between tabs', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('sidequest-wishlist-v1', JSON.stringify(['unknown', 'ember-d20', 'ember-d20', null, { id: 'moss-d6' }])));
  await page.goto('/#wishlist');
  await page.reload();
  await expect(favorites(page).locator('.wishlist-card')).toHaveCount(1);
  const other = await page.context().newPage();
  await other.goto('/');
  await toggle(other, 'Ember D20').click();
  await expect(favorites(page).locator('.wishlist-card')).toHaveCount(0);
  await toggle(other, 'Tide D20').click();
  await expect(favorites(page).locator('.wishlist-card')).toHaveCount(1);
  await expect(favorites(page)).toContainText('Tide D20');
  await other.close();
  await page.evaluate(() => localStorage.setItem('sidequest-wishlist-v1', '{malformed'));
  await page.reload();
  await expect(favorites(page).locator('.wishlist-card')).toHaveCount(0);
});

test('blocked wishlist saving falls back to the current page with an explanation', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'sidequest-wishlist-v1') throw new DOMException('Storage blocked', 'SecurityError');
      return original.call(this, key, value);
    };
  });
  await page.goto('/');
  await toggle(page, 'Ember D20').click();
  await openWishlist(page, 1);
  await expect(favorites(page).locator('.wishlist-card')).toHaveCount(1);
  await expect(page.locator('#wishlist-storage-note')).toBeVisible();
  await expect(page.locator('#wishlist-storage-note')).toContainText('current page');
});

test('wishlist contextual buttons synchronize and removing a details opener restores focus', async ({ page }) => {
  await page.goto('/');
  await toggle(page, 'Ember D20').click();
  await openWishlist(page, 1);
  await favorites(page).getByRole('button', { name: 'View details for Ember D20', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Ember D20' });
  const heart = dialog.getByRole('button', { name: 'Save Ember D20 to wishlist', exact: true });
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  await heart.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#wishlist-heading')).toBeFocused();
  await page.goto('/');
  await page.getByRole('button', { name: 'Find my dice', exact: true }).click();
  await page.getByRole('radio', { name: 'A single D20', exact: false }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('radio', { name: 'Up to ₱250', exact: false }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('radio', { name: 'No material preference', exact: false }).check();
  await page.getByRole('button', { name: 'Show my matches', exact: true }).click();
  await page.locator('#finder-content').getByRole('button', { name: 'Save Ember D20 to wishlist', exact: true }).click();
  await expect(toggle(page, 'Ember D20')).toHaveAttribute('aria-pressed', 'true');
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await openWishlist(page, 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('moving a favorite retains its saved copy when the bag cannot be persisted', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'sidequest-cart-v1') throw new DOMException('Quota exceeded', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('sidequest-wishlist-v1', JSON.stringify(['ember-d20'])));
  await page.goto('/#wishlist');
  await page.reload();
  await favorites(page).getByRole('button', { name: 'Move Ember D20 to bag', exact: true }).click();
  await expect(favorites(page).locator('.wishlist-card')).toHaveCount(1);
  await expect(page.locator('#wishlist-status')).toContainText('kept it in your wishlist');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sidequest-wishlist-v1')))).toEqual(['ember-d20']);
  await page.reload();
  await expect(favorites(page).locator('.wishlist-card')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Your bag, 0 items', exact: true })).toBeVisible();
});

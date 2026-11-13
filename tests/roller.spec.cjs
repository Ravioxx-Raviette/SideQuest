const { test, expect } = require('@playwright/test');

// The closing-note die (dice-roll.js) replaced the full "Test your luck"
// section; Jared's widget (roller.js) now appears only in product details.
const closing = (page) => page.locator('#dice-roller');
const closingDie = (page) => page.locator('#closing-die');
const recent = (page) => page.locator('#die-history li');
const ROLLS_KEY = 'sidequest-closing-rolls-v1';

async function roll(page, root, sides) {
  await root.getByRole('radio', { name: `D${sides} ${sides} sides`, exact: true }).check();
  await root.getByRole('button', { name: `Roll D${sides}`, exact: true }).click();
  await expect(root.locator('.roller-status')).toContainText(`D${sides} rolled`);
  const value = Number(await root.locator('.roller-result').textContent());
  expect(Number.isInteger(value) && value >= 1 && value <= sides).toBe(true);
}

async function rollClosing(page, sides) {
  await closing(page).getByRole('radio', { name: `D${sides}`, exact: true }).check({ force: true });
  await expect(closingDie(page)).toHaveAttribute('data-sides', String(sides));
  await closingDie(page).click();
  await expect(page.locator('#die-result')).not.toHaveText(/Rolling|ready/);
}

test('the separate roller section is gone and the hero link leads to the closing die', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#roller-main')).toHaveCount(0);
  await expect(page.locator('.roller-section')).toHaveCount(0);
  await page.getByRole('link', { name: 'Test your luck', exact: true }).click();
  await expect(page.locator('#closing-heading')).toBeFocused();
  await expect(closingDie(page)).toBeInViewport();
});

test('closing die switches between D6 and D20 and lists labelled recent rolls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#dice-roller');
  await expect(page.locator('#die-history')).toBeHidden();

  await rollClosing(page, 6);
  await expect(closingDie(page).locator('.d6-art')).toBeVisible();
  await expect(closingDie(page).locator('.d20-art')).toBeHidden();
  const d6 = await closingDie(page).locator('.d6-pips circle').count();
  expect(d6).toBeGreaterThanOrEqual(1);
  expect(d6).toBeLessThanOrEqual(6);
  await expect(recent(page)).toHaveCount(1);
  await expect(recent(page).first()).toHaveAttribute('aria-label', `D6: ${d6}`);

  await rollClosing(page, 20);
  await expect(closingDie(page).locator('.d20-art')).toBeVisible();
  const d20 = Number(await closingDie(page).locator('.closing-die-face').textContent());
  expect(d20 >= 1 && d20 <= 20).toBe(true);
  await expect(recent(page)).toHaveCount(2);
  await expect(recent(page).first()).toHaveAttribute('aria-label', `D20: ${d20}`);

  await page.getByRole('button', { name: 'Clear recent rolls', exact: true }).click();
  await expect(page.locator('#die-history')).toBeHidden();
  await expect(closingDie(page)).toBeFocused();
});

test('closing die guards rapid clicks, keeps five rolls, and restores them after refresh', async ({ page }) => {
  await page.addInitScript(() => {
    crypto.getRandomValues = (values) => { values[0] = 19; return values; };
  });
  await page.goto('/#dice-roller');
  await closingDie(page).evaluate((button) => { button.click(); button.click(); });
  await expect(page.locator('#die-result')).toContainText('Natural 20');
  await expect(closingDie(page)).toHaveClass(/is-crit/);
  await expect(recent(page)).toHaveCount(1);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (let index = 0; index < 7; index++) await closingDie(page).click();
  await expect(recent(page)).toHaveCount(5);
  await expect(recent(page).first()).toHaveClass(/is-max/);

  await page.reload();
  await expect(recent(page)).toHaveCount(5);
  await expect(recent(page).first()).toHaveAttribute('aria-label', 'D20: 20');
});

test('closing die ignores malformed saved rolls and still works when storage is blocked', async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify([{ sides: 6, value: 9 }, { sides: 20, value: 3 }, 'oops', { sides: 8, value: 2 }]));
  }, ROLLS_KEY);
  await page.goto('/#dice-roller');
  await expect(recent(page)).toHaveCount(1);
  await expect(recent(page).first()).toHaveAttribute('aria-label', 'D20: 3');

  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
    Storage.prototype.getItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
  });
  await page.reload();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('#die-history')).toBeHidden();
  await rollClosing(page, 6);
  await expect(recent(page)).toHaveCount(1);
});

test('product roller defaults match dice type and closing cancels unfinished rolls', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'View details for Moss D6', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: 'Moss D6', exact: true });
  await dialog.locator('.product-roller > summary').focus();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close product details', exact: true })).toBeFocused();
  await dialog.locator('.product-roller > summary').click();
  await expect(dialog.getByRole('radio', { name: 'D6 6 sides', exact: true })).toBeChecked();
  await dialog.getByRole('button', { name: 'Roll D6', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'View details for Ember D20', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Ember D20', exact: true });
  await dialog.locator('.product-roller > summary').click();
  await expect(dialog.getByRole('radio', { name: 'D20 20 sides', exact: true })).toBeChecked();
  await expect(dialog.locator('.roller-result')).toHaveText('—');
  await expect(dialog.locator('.roller-history li')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await roll(page, dialog.locator('.dice-roller-widget'), 20);
  expect(await dialog.locator('.roller-die').evaluate((element) => element.getAnimations().length)).toBe(0);
  // The product roller is independent of the closing die's recent rolls.
  await expect(recent(page)).toHaveCount(0);
});

test('product roller never saves data or changes the bag; closing die fits 320px with the keyboard', async ({ page }) => {
  await page.addInitScript(() => {
    window.rollerStorageWrites = 0;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key !== 'sidequest-closing-rolls-v1') window.rollerStorageWrites++;
      return original.call(this, key, value);
    };
  });
  await page.goto('/');
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'View details for Moss D6', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Moss D6', exact: true });
  await dialog.locator('.product-roller > summary').click();
  await dialog.getByRole('button', { name: 'Roll D6', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(dialog.locator('.roller-status')).toContainText('D6 rolled');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.rollerStorageWrites)).toBe(0);
  await expect(page.getByRole('link', { name: 'Your bag, 0 items', exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Test your luck', exact: true }).click();
  await closing(page).getByRole('radio', { name: 'D6', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(closingDie(page)).toHaveAttribute('data-sides', '6');
  await closingDie(page).focus();
  await page.keyboard.press('Enter');
  await expect(recent(page)).toHaveCount(1);
  for (const element of [closingDie(page), page.locator('.die-switch'), page.locator('#die-history')]) {
    const box = await element.boundingBox();
    expect(box.x >= 0 && box.x + box.width <= 320).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

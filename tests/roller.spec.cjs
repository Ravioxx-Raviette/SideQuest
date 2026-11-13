const { test, expect } = require('@playwright/test');
const main = (page) => page.locator('#roller-main');
async function roll(page, root, sides) {
  await root.getByRole('radio', { name: `D${sides} ${sides} sides`, exact: true }).check();
  await root.getByRole('button', { name: `Roll D${sides}`, exact: true }).click();
  await expect(root.locator('.roller-status')).toContainText(`D${sides} rolled`);
  const value = Number(await root.locator('.roller-result').textContent());
  expect(Number.isInteger(value) && value >= 1 && value <= sides).toBe(true);
}

test('main roller supports D6 and D20 with labelled history and clearing', async ({ page }, testInfo) => {
  await page.goto('/#dice-roller');
  await roll(page, main(page), 6);
  await roll(page, main(page), 20);
  await expect(main(page).locator('.roller-history li')).toHaveCount(2);
  await expect(main(page).locator('.roller-history li').first()).toContainText('D20');
  await main(page).screenshot({ path: `artifacts/${testInfo.project.name}-dice-roller.png` });
  await main(page).getByRole('button', { name: 'Clear roll history', exact: true }).click();
  await expect(main(page).locator('.roller-history li')).toHaveCount(0);
  await expect(main(page).getByRole('button', { name: 'Roll D20', exact: true })).toBeFocused();
  await expect(main(page).getByRole('button', { name: 'Clear roll history', exact: true })).toBeDisabled();
});

test('roller guards rapid activation and keeps only the latest eight rolls', async ({ page }) => {
  await page.addInitScript(() => {
    crypto.getRandomValues = (values) => { values[0] = 19; return values; };
  });
  await page.goto('/#dice-roller');
  const root = main(page);
  await root.getByRole('button', { name: 'Roll D20', exact: true }).evaluate((button) => { button.click(); button.click(); });
  await expect(root.locator('.roller-status')).toContainText('D20 rolled 20');
  await expect(root.locator('.roller-status')).toContainText('Natural 20');
  await expect(root.locator('.roller-history li')).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const firstAnnouncement = await root.locator('.roller-status').textContent();
  await root.getByRole('button', { name: 'Roll D20', exact: true }).click();
  await expect(root.locator('.roller-status')).not.toHaveText(firstAnnouncement);
  await expect(root.locator('.roller-result')).toHaveText('20');
  for (let index = 0; index < 10; index++) {
    await root.getByRole('button', { name: 'Roll D20', exact: true }).click();
    await expect(root.getByRole('button', { name: 'Roll D20', exact: true })).toHaveAttribute('aria-disabled', 'false');
  }
  await expect(root.locator('.roller-history li')).toHaveCount(8);
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
  await expect(main(page).locator('.roller-history li')).toHaveCount(0);
});

test('roller supports keyboard and 320px layout without saving data or changing the bag', async ({ page }) => {
  await page.addInitScript(() => {
    window.rollerStorageWrites = 0;
    Storage.prototype.setItem = () => { window.rollerStorageWrites++; throw new DOMException('Blocked', 'SecurityError'); };
  });
  await page.goto('/');
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByRole('link', { name: 'Test your luck', exact: true }).click();
  await expect(page.locator('#roller-heading')).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await main(page).getByRole('radio', { name: 'D6 6 sides', exact: true }).focus();
  await page.keyboard.press('Space');
  await main(page).getByRole('button', { name: 'Roll D6', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(main(page).locator('.roller-status')).toContainText('D6 rolled');
  expect(await page.evaluate(() => window.rollerStorageWrites)).toBe(0);
  await expect(page.getByRole('link', { name: 'Your bag, 0 items', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

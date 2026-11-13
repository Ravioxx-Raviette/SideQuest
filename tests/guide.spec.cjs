const { test, expect } = require('@playwright/test');
const guide = (page) => page.locator('#dice-guide');

test('beginner guide opens with keyboard and explains the seven-piece set', async ({ page }, testInfo) => {
  await page.goto('/');
  const summary = page.locator('#guide-disclosure > summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#guide-disclosure')).toHaveAttribute('open', '');
  await expect(guide(page).getByRole('heading', { name: 'The seven-piece set, decoded.' })).toBeVisible();
  await expect(guide(page).locator('.guide-dice-list > li')).toHaveCount(7);
  await expect(guide(page)).toContainText('70 and 1 make 71');
  await expect(guide(page).getByRole('link', { name: 'D&D Basic Rules: game dice' })).toHaveAttribute('href', 'https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await guide(page).screenshot({ path: `artifacts/${testInfo.project.name}-beginner-guide.png` });
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#guide-disclosure')).not.toHaveAttribute('open');
});

test('guide browse actions replace conflicting filters and preserve bag and comparison', async ({ page }) => {
  await page.goto('/');
  await page.locator('#products').getByRole('button', { name: 'Compare Ember D20', exact: true }).click();
  await page.getByRole('button', { name: 'Add Moss D6 to cart', exact: true }).click();
  await page.getByLabel('Search dice by name').fill('nothing matches');
  await page.getByLabel('Material', { exact: true }).selectOption('Metal');
  await page.getByLabel('Price range').selectOption('under250');
  await page.locator('#guide-disclosure > summary').click();
  await guide(page).getByRole('button', { name: 'Browse seven-piece sets', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(3);
  await expect(page.locator('#collection-heading')).toBeFocused();
  await expect(page.getByLabel('Search dice by name')).toHaveValue('');
  await expect(page.getByLabel('Material', { exact: true })).toHaveValue('all');
  await expect(page.getByLabel('Price range')).toHaveValue('all');
  await expect(page.getByRole('link', { name: 'Your bag, 1 item', exact: true })).toBeVisible();
  await expect(page.locator('#comparison-tray')).toContainText('Ember D20');
  await guide(page).getByRole('button', { name: 'Browse acrylic dice', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(2);
  await expect(page.getByLabel('Material', { exact: true })).toHaveValue('Acrylic');
  await guide(page).getByRole('button', { name: 'Browse D20 dice', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(3);
  await expect(page.locator('#collection-heading')).toBeFocused();
});

test('guide supports direct links, repeated finder links, and returning from the bag', async ({ page }) => {
  await page.goto('/#dice-guide');
  await expect(page.locator('#guide-disclosure')).toHaveAttribute('open', '');
  await expect(guide(page).getByRole('heading', { name: 'Dice, decoded.' })).toBeInViewport();
  await page.locator('#guide-disclosure > summary').click();
  await page.getByRole('link', { name: 'New to dice? Read the beginner’s guide', exact: true }).click();
  await expect(page.locator('#guide-disclosure')).toHaveAttribute('open', '');
  await expect(page.locator('#guide-heading')).toBeFocused();
  await page.getByRole('link', { name: 'Your bag, 0 items', exact: true }).click();
  await page.evaluate(() => { location.hash = 'dice-guide'; });
  await expect(guide(page)).toBeVisible();
  await expect(page.locator('#guide-heading')).toBeFocused();
});

test('quiz and product details offer contextual help without losing selections', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Find my dice', exact: true }).click();
  const finder = page.locator('#finder-content');
  await finder.locator('.context-guide > summary').click();
  await expect(finder.locator('.context-guide')).toContainText('twenty-sided');
  await page.getByRole('radio', { name: 'A single D20', exact: false }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('radio', { name: 'Up to ₱500', exact: false }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await finder.locator('.context-guide > summary').click();
  await expect(finder.locator('.context-guide')).toContainText('Metal');
  await page.getByRole('radio', { name: 'Weighty metal', exact: false }).check();
  await page.getByRole('button', { name: 'Show my matches', exact: true }).click();
  await finder.getByRole('button', { name: 'View details for Forged D20', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Forged D20' });
  await dialog.getByRole('button', { name: 'Compare Forged D20', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Save Forged D20 to wishlist', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.locator('.context-guide > summary')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog.locator('.context-guide')).toContainText('twenty-sided');
  await expect(dialog.locator('.context-guide')).toContainText('dice tray');
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(finder.getByRole('heading', { name: 'Your next adventure, matched.' })).toBeVisible();
});

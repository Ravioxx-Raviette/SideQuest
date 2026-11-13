const { test, expect } = require('@playwright/test');

async function start(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Find my dice', exact: true }).click();
}
async function choose(page, name) {
  await page.getByRole('radio', { name, exact: false }).check();
  await page.getByRole('button', { name: /Continue|Show my matches/ }).click();
}

test('finder guides a beginner to affordable full sets and supports shopping from results', async ({ page }) => {
  await start(page);
  await choose(page, 'My first campaign');
  await choose(page, 'Up to ₱700');
  await choose(page, 'No material preference');
  const results = page.locator('#finder-content');
  await expect(results.getByRole('heading', { name: 'Your next adventure, matched.' })).toBeFocused();
  await expect(results.locator('.finder-match')).toHaveCount(2);
  await expect(results).toContainText('Rosewater Set');
  await expect(results).toContainText('Starlight Set');
  await expect(results).toContainText('Within your ₱700 budget');
  await expect(results).not.toContainText('Copperbound');
  await results.getByRole('button', { name: 'View details for Rosewater Set', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Rosewater Set' })).toBeVisible();
  await page.keyboard.press('Escape');
  await results.getByRole('button', { name: 'Add Rosewater Set to cart', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Your bag, 1 item', exact: true })).toBeVisible();
  await expect(page.locator('.product-card')).toHaveCount(8);
});

test('finder validates choices and preserves them when moving back, closing, and editing', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('#finder-error')).toContainText('Choose an option');
  await expect(page.locator('#finder-content input').first()).toBeFocused();
  await choose(page, 'A single D20');
  await page.getByRole('radio', { name: 'Up to ₱500', exact: false }).check();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'A single D20', exact: false })).toBeChecked();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Up to ₱500', exact: false })).toBeChecked();
  await page.getByRole('button', { name: 'Close dice finder' }).click();
  await page.getByRole('button', { name: 'Find my dice', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Up to ₱500', exact: false })).toBeChecked();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await choose(page, 'Weighty metal');
  await expect(page.locator('.finder-match h4').first()).toHaveText('Forged D20');
  await expect(page.locator('#finder-content')).toContainText('Resin alternative to your metal preference');
  await page.getByRole('button', { name: 'Edit answers', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'A single D20', exact: false })).toBeChecked();
  await page.getByRole('button', { name: 'Start over', exact: true }).click();
  await expect(page.locator('#finder-content input:checked')).toHaveCount(0);
});

test('finder explains no affordable sets and lets shoppers change budget', async ({ page }) => {
  await start(page);
  await choose(page, 'My first campaign');
  await choose(page, 'Up to ₱250');
  await choose(page, 'Weighty metal');
  await expect(page.getByRole('heading', { name: 'No match yet. Let’s adjust.' })).toBeVisible();
  await expect(page.locator('.finder-match')).toHaveCount(0);
  await expect(page.locator('#finder-content')).toContainText('₱550');
  await page.getByRole('button', { name: 'Change budget', exact: true }).click();
  await choose(page, 'Up to ₱700');
  await expect(page.getByRole('radio', { name: 'Weighty metal', exact: false })).toBeChecked();
  await page.getByRole('button', { name: 'Show my matches', exact: true }).click();
  await expect(page.locator('.finder-match')).toHaveCount(2);
});

test('finder supports keyboard completion and fits the viewport', async ({ page }, testInfo) => {
  await start(page);
  for (let step = 0; step < 3; step++) {
    const radios = page.locator('#finder-content input[type=radio]');
    await radios.first().focus();
    await page.keyboard.press('Space');
    await page.getByRole('button', { name: /Continue|Show my matches/ }).focus();
    await page.keyboard.press('Enter');
  }
  await expect(page.getByRole('heading', { name: 'No match yet. Let’s adjust.' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#dice-finder').screenshot({ path: `artifacts/${testInfo.project.name}-finder-empty.png` });
  await page.getByRole('button', { name: 'Change budget', exact: true }).click();
  await choose(page, 'Up to ₱700');
  await page.getByRole('button', { name: 'Show my matches', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#dice-finder').screenshot({ path: `artifacts/${testInfo.project.name}-finder-results.png` });
});

test('finder keeps the next question and results visible after submitting a long step', async ({ page }) => {
  await start(page);
  await choose(page, 'My first campaign');
  await expect(page.locator('#finder-step-heading')).toBeInViewport({ ratio: 1 });
  await choose(page, 'Up to ₱700');
  await expect(page.locator('#finder-step-heading')).toBeInViewport({ ratio: 1 });
  await choose(page, 'Colorful resin');
  await expect(page.getByRole('heading', { name: 'Your next adventure, matched.' })).toBeInViewport({ ratio: 1 });
});

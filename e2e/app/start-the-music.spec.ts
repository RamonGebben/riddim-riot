import { expect, test } from '@playwright/test';

test('start the music, move and fire the wobble gun', async ({ page }) => {
  const errors: Array<string> = [];
  page.on('pageerror', error => errors.push(error.message));

  const response = await page.goto('/?seed=42');
  expect(response?.ok()).toBe(true);
  await expect(
    page.getByRole('heading', { name: 'Bass Weapons' }),
  ).toBeVisible();
  await expect(
    page.getByText(/^[A-G]#? (minor|phrygian) · 140 BPM halftime$/),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Press to start' }).click();
  const playArea = page.getByRole('main', { name: 'Play area' });
  await expect(playArea).toBeVisible();
  await expect(playArea.locator('canvas')).toBeVisible();

  await page.keyboard.down('KeyD');
  await page.waitForTimeout(300);
  await page.keyboard.up('KeyD');

  // Tap, then hold through a full magazine and its reload.
  await playArea.click();
  await page.mouse.move(400, 400);
  await page.mouse.down();
  await page.waitForTimeout(2500);
  await page.mouse.up();

  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: 'Quit' }).click();
  await expect(
    page.getByRole('button', { name: 'Press to start' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

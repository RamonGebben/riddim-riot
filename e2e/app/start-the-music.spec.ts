import { expect, test } from '@playwright/test';

test('start the music, move and fire the wobble gun', async ({ page }) => {
  // A dozen steps on a real-time game: past the default 30 s on a slow runner.
  test.setTimeout(60_000);
  const errors: Array<string> = [];
  page.on('pageerror', error => errors.push(error.message));

  const response = await page.goto('/?seed=42');
  expect(response?.ok()).toBe(true);
  await expect(
    page.getByRole('heading', { name: 'Bass Weapons' }),
  ).toBeVisible();
  await expect(
    page.getByText(/^[A-G]#? (minor|phrygian) · 140 BPM halftime · 5 levels$/),
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
  await page.mouse.move(400, 250);
  await page.mouse.down();
  await page.waitForTimeout(2500);
  await page.mouse.up();

  // Nothing on the game screen selects: not the HUD, nor a drag across it.
  await page.getByLabel('Score').dblclick();
  await page.mouse.move(20, 20);
  await page.mouse.down();
  await page.mouse.move(620, 340, { steps: 5 });
  await page.mouse.up();
  expect(await page.evaluate(() => String(window.getSelection()))).toBe('');

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible();
  await page.getByRole('heading', { name: 'Paused' }).dblclick();
  expect(await page.evaluate(() => String(window.getSelection()))).toBe('');
  await page.getByRole('button', { name: 'Quit' }).click();
  await expect(
    page.getByRole('button', { name: 'Press to start' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

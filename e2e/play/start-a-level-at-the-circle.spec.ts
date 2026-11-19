import { expect, test } from '@playwright/test';

test('step into the circle to start the fight', async ({ page }) => {
  // Two musical waits of up to 20 s each need more than the default 30 s.
  test.setTimeout(60_000);
  const errors: Array<string> = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('/?seed=42');
  await page.getByRole('button', { name: 'Press to start' }).click();
  const playArea = page.getByRole('main', { name: 'Play area' });
  await expect(playArea.locator('canvas')).toBeVisible();
  await expect(page.getByRole('status')).toHaveText(
    'Step into the circle to start',
  );

  // Waits are musical: up to two bar lines (~3.4 s at 140 BPM) before the
  // slam, with room for a CI runner whose audio clock crawls (Firefox's did).
  const musical = { timeout: 20_000 };

  // The circle is straight ahead of the spawn: walk up until it takes.
  await playArea.click();
  await page.keyboard.down('KeyW');
  await expect(page.getByText(/charging/)).toBeVisible(musical);
  await page.keyboard.up('KeyW');

  // A bar of charge, then the slam starts the song on its intro.
  await expect(page.getByText(/intro \d:\d\d/)).toBeVisible(musical);
  expect(errors).toEqual([]);
});

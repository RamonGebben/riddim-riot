import { expect, test } from '@playwright/test';

test('step into the circle to start the fight', async ({ page }) => {
  const errors: Array<string> = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('/?seed=42');
  await page.getByRole('button', { name: 'Press to start' }).click();
  const playArea = page.getByRole('main', { name: 'Play area' });
  await expect(playArea.locator('canvas')).toBeVisible();
  await expect(page.getByRole('status')).toHaveText(
    'Step into the circle to start',
  );

  // The circle is straight ahead of the spawn: walk up until it takes.
  await playArea.click();
  await page.keyboard.down('KeyW');
  await expect(page.getByText(/charging/)).toBeVisible({ timeout: 8000 });
  await page.keyboard.up('KeyW');

  // A bar of charge, then the slam starts the song on its intro.
  await expect(page.getByText(/intro \d:\d\d/)).toBeVisible({
    timeout: 8000,
  });
  expect(errors).toEqual([]);
});

import { expect, test } from '@playwright/test';

test('start the music from the start screen', async ({ page }) => {
  const errors: Array<string> = [];
  page.on('pageerror', error => errors.push(error.message));

  const response = await page.goto('/?seed=42');
  expect(response?.ok()).toBe(true);
  await expect(
    page.getByRole('heading', { name: 'Bass Weapons' }),
  ).toBeVisible();
  await expect(page.getByText('seed 42 · 140 BPM halftime')).toBeVisible();

  await page.getByRole('button', { name: 'Press to start' }).click();
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();

  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(
    page.getByRole('button', { name: 'Press to start' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

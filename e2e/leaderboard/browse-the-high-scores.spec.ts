import { expect, test } from '@playwright/test';

test('open the high scores from the start screen and drop back in', async ({
  page,
}) => {
  const errors: Array<string> = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('/?seed=42');
  await page.getByRole('link', { name: 'High scores' }).click();

  await expect(page).toHaveURL(/\/leaderboard$/);
  await expect(
    page.getByRole('heading', { name: 'High scores' }),
  ).toBeVisible();
  // Signed out, the card says how to get on the board. (CI has no
  // database, so the board itself may say it couldn't load.)
  await expect(page.getByText(/Every run's points add up/)).toBeVisible();

  await page.getByRole('link', { name: 'Drop in' }).click();
  await expect(page.getByRole('button', { name: 'Drop in' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('an unknown player has no place to share', async ({ page }) => {
  const response = await page.goto('/leaderboard/NO_SUCH_ONE');
  // 404 for a name no one has; 500 where there's no database to ask.
  expect([404, 500]).toContain(response?.status());
});

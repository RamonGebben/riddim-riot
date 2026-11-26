import { expect, test } from '@playwright/test';
import { dropIn, pageErrors, riot, rig } from '../support/game';

test('win a run on the last level: rigged, it stays off the board', async ({
  page,
}) => {
  const errors = pageErrors(page);
  await page.goto('/?seed=42');
  await rig(page, { level: 5, skipCircle: true, god: true });
  await dropIn(page);
  await riot(page, 'skip');

  await expect(
    page.getByRole('heading', { name: 'Run complete' }),
  ).toBeVisible();
  // The clear bonus at the top tier.
  await expect(page.getByText('50,000').first()).toBeVisible();
  await expect(
    page.getByText(/rigged from the console, so it stays off the board/),
  ).toBeVisible();
  await expect(page.getByText('New best!')).toBeHidden();
  expect(
    await page.evaluate(() => localStorage.getItem('bass-weapons:best')),
  ).toBeNull();
  expect(errors).toEqual([]);
});

test('quit a run on a later level, and back to a start still rigged', async ({
  page,
}) => {
  const errors = pageErrors(page);
  await page.goto('/?seed=42');
  await rig(page, { level: 3 });
  await dropIn(page);

  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: 'Quit' }).click();
  // Past level 1 a quit ends the run with what it has, on its own screen.
  await expect(page.getByRole('heading', { name: 'Run ended' })).toBeVisible();
  await expect(page.getByText(/stays off the board/)).toBeVisible();
  await page.getByRole('button', { name: 'Main menu' }).click();

  await expect(page.getByRole('button', { name: 'Drop in' })).toBeVisible();
  await expect(page.getByText(/^Rigged: level 3/)).toBeVisible();
  expect(errors).toEqual([]);
});

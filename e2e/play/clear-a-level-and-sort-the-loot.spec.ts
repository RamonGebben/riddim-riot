import { expect, test } from '@playwright/test';
import { dropIn, pageErrors, riot, rig } from '../support/game';

test('clear a level, sort the loot and start the next at its tempo', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const errors = pageErrors(page);
  await page.goto('/?seed=42');
  await rig(page, {
    level: 2,
    subgenre: 'liquid',
    bpm: 172,
    skipCircle: true,
    god: true,
  });
  await dropIn(page);
  await expect(page.getByText('2/5')).toBeVisible();

  // Loot to sort without fighting for it, then the exit.
  await riot(page, 'loot', 3);
  await riot(page, 'skip');
  await expect(
    page.getByRole('heading', { name: 'Level 2 cleared' }),
  ).toBeVisible();
  // The clear bonus at tier 2.
  await expect(page.getByText('+20,000')).toBeVisible();

  // It waits for a press: no moving on by itself.
  await page.getByRole('button', { name: 'Sort your loot' }).click();
  const menu = page.getByRole('dialog', { name: 'Sort your loot' });
  await expect(menu).toBeVisible();
  await expect(
    menu.getByText(/Everything left in the bag is scrapped/),
  ).toBeVisible();
  // Leaving isn't an option: the loot has to be sorted.
  await page.keyboard.press('Escape');
  await expect(menu).toBeVisible();
  await menu
    .getByRole('button', { name: /^Scrap 24 weapons · start level 3$/ })
    .click();

  // The next level's card, then the level itself with an empty bag.
  const card = page.getByRole('status').filter({ hasText: 'Level 3 of 5' });
  await expect(card).toContainText('points ×3');
  await expect(card).toContainText('Liquid · 172 BPM');
  await expect(page.getByText('3/5')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('dialog', { name: 'Loadout' }).getByText('Bag 0/24'),
  ).toBeVisible();

  // A rigged run's loadout isn't kept for the next run.
  expect(
    await page.evaluate(() => localStorage.getItem('bass-weapons:loadout')),
  ).toBeNull();
  expect(errors).toEqual([]);
});

import { expect, test } from '@playwright/test';
import {
  contextCount,
  gameAudioState,
  sounding,
  watchAudio,
} from '../support/audio';
import { dropIn, inTheSong, musical, pageErrors, rig } from '../support/game';

test('open the loadout mid-level, hear a weapon, trade two slots and fight on', async ({
  page,
}) => {
  const errors = pageErrors(page);
  await watchAudio(page);

  await page.goto('/?seed=42');
  // Straight into the song, so the loop has the drums in it: the circle
  // is the circle test's to walk.
  await rig(page, { skipCircle: true });
  await dropIn(page);
  await inTheSong(page);
  // The game's context is the latest so far (an earlier probe may be closed).
  const contexts = await contextCount(page);
  const weapons = page.getByRole('list', { name: 'Weapons' });
  const first = await weapons
    .getByRole('button')
    .first()
    .getAttribute('aria-label');
  const firstName = first?.split(',')[0] ?? '';

  await page.keyboard.press('Tab');
  const menu = page.getByRole('dialog', { name: 'Loadout' });
  await expect(menu).toBeVisible();
  await expect(menu.getByText('Bag 0/24')).toBeVisible();
  // The level waits behind the menu while its bar loops on a media
  // element, which sounds with every context on the page suspended.
  await expect.poll(() => gameAudioState(page)).toBe('suspended');
  await expect.poll(() => sounding(page), musical).toEqual(['loop']);
  expect(await contextCount(page)).toBe(contexts);

  await menu.getByRole('button', { name: `Hear ${firstName}` }).click();
  await expect.poll(() => sounding(page), musical).toEqual(['loop', 'preview']);
  await expect(
    menu.getByRole('button', { name: `Stop ${firstName}` }),
  ).toBeVisible();

  await menu.getByRole('button', { name: /^Slot 1:/ }).click();
  // The pick smooth-scrolls the comparison into view, and a click while it
  // slides can miss: wait for the button to settle first.
  const move = menu.getByRole('button', { name: 'Move to slot 3' });
  let lastY: number | undefined;
  await expect
    .poll(async () => {
      const y = (await move.boundingBox())?.y;
      const settled = y !== undefined && y === lastY;
      lastY = y;
      return settled;
    })
    .toBe(true);
  await move.click();
  await expect(
    menu.getByRole('button', { name: `Slot 3: ${firstName}` }),
  ).toBeVisible();
  await menu.getByRole('button', { name: 'Back', exact: true }).click();

  await expect(menu).toBeHidden();
  await expect.poll(() => gameAudioState(page)).toBe('running');
  await expect(weapons.getByRole('button').nth(2)).toHaveAttribute(
    'aria-label',
    new RegExp(`^${firstName.replaceAll('/', '\\/')},`),
  );
  expect(errors).toEqual([]);
});

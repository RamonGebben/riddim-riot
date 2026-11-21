import { expect, test, type Page } from '@playwright/test';

/**
 * Every realtime AudioContext, and every rendered file a media element
 * starts playing, to see the game freeze, the menu's loop come in and a
 * preview play.
 */
const watchAudio = (page: Page) =>
  page.addInitScript(() => {
    const contexts: Array<AudioContext> = [];
    const played: Array<HTMLMediaElement> = [];
    Object.assign(window, { audioContexts: contexts, filesPlayed: played });
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options);
        contexts.push(this);
      }
    };
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      // Rendered sound comes as a blob; the unlocking silence doesn't.
      if (this.src.startsWith('blob:')) played.push(this);
      return play.call(this);
    };
  });

interface Watched {
  audioContexts: Array<AudioContext>;
  filesPlayed: Array<HTMLMediaElement>;
}

/** The state of the context at `index` (the game's, or the menu's). */
const stateAt = (page: Page, index: number) =>
  page.evaluate(
    at => (window as unknown as Watched).audioContexts[at]?.state,
    index,
  );

const contextCount = (page: Page) =>
  page.evaluate(() => (window as unknown as Watched).audioContexts.length);

/** The rendered files sounding now: looping (the loop) or not (a preview). */
const sounding = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as Watched).filesPlayed
      .filter(element => !element.paused && element.src.startsWith('blob:'))
      .map(element => (element.loop ? 'loop' : 'preview'))
      .sort(),
  );

test('open the loadout mid-level, hear a weapon, trade two slots and fight on', async ({
  page,
}) => {
  const errors: Array<string> = [];
  page.on('pageerror', error => errors.push(error.message));
  await watchAudio(page);

  await page.goto('/?seed=42');
  await page.getByRole('button', { name: 'Drop in' }).click();
  const playArea = page.getByRole('main', { name: 'Play area' });
  await expect(playArea.locator('canvas')).toBeVisible();
  // The game's context is the latest so far (an earlier probe may be closed).
  const game = (await contextCount(page)) - 1;
  const weapons = page.getByRole('list', { name: 'Weapons' });
  const first = await weapons
    .getByRole('button')
    .first()
    .getAttribute('aria-label');
  const firstName = first?.split(',')[0] ?? '';

  // Into the song first, so the loop has the drums in it. Waits are
  // musical: up to two bar lines, with room for a slow runner.
  test.setTimeout(60_000);
  const musical = { timeout: 20_000 };
  await playArea.click();
  await page.keyboard.down('KeyW');
  await expect(page.getByText(/charging/)).toBeVisible(musical);
  await page.keyboard.up('KeyW');
  await expect(page.getByText(/intro \d:\d\d/)).toBeVisible(musical);

  await page.keyboard.press('Tab');
  const menu = page.getByRole('dialog', { name: 'Loadout' });
  await expect(menu).toBeVisible();
  await expect(menu.getByText('Bag 0/24')).toBeVisible();
  // The level waits behind the menu while its bar loops on a media
  // element, which sounds with every context on the page suspended.
  await expect.poll(() => stateAt(page, game)).toBe('suspended');
  await expect.poll(() => sounding(page), musical).toEqual(['loop']);
  expect(await contextCount(page)).toBe(game + 1);

  await menu.getByRole('button', { name: `Hear ${firstName}` }).click();
  await expect.poll(() => sounding(page), musical).toEqual(['loop', 'preview']);
  await expect(
    menu.getByRole('button', { name: `Stop ${firstName}` }),
  ).toBeVisible();

  await menu.getByRole('button', { name: /^Slot 1:/ }).click();
  await menu.getByRole('button', { name: 'Move to slot 3' }).click();
  await expect(
    menu.getByRole('button', { name: `Slot 3: ${firstName}` }),
  ).toBeVisible();
  await menu.getByRole('button', { name: 'Back to the fight' }).click();

  await expect(menu).toBeHidden();
  await expect.poll(() => stateAt(page, game)).toBe('running');
  await expect(weapons.getByRole('button').nth(2)).toHaveAttribute(
    'aria-label',
    new RegExp(`^${firstName.replaceAll('/', '\\/')},`),
  );
  expect(errors).toEqual([]);
});

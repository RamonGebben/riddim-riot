import { expect, test, type Page } from '@playwright/test';

/** Every realtime AudioContext, to see the game stay frozen. */
const watchAudio = (page: Page) =>
  page.addInitScript(() => {
    const contexts: Array<AudioContext> = [];
    Object.assign(window, { audioContexts: contexts });
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options);
        contexts.push(this);
      }
    };
  });

/** The state of the latest context: the game's. */
const gameState = (page: Page) =>
  page.evaluate(
    () =>
      (
        window as unknown as { audioContexts: Array<AudioContext> }
      ).audioContexts.at(-1)?.state,
  );

test('open the bag from the pause and close back to it', async ({
  page,
  browserName,
}) => {
  await watchAudio(page);
  await page.goto('/?seed=42');
  await page.getByRole('button', { name: 'Drop in' }).click();
  await expect(
    page.getByRole('main', { name: 'Play area' }).locator('canvas'),
  ).toBeVisible();

  await page.keyboard.press('KeyP');
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible();
  await page.getByRole('button', { name: 'Loadout and bag' }).click();
  const menu = page.getByRole('dialog', { name: 'Loadout' });
  await expect(menu).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeHidden();

  // Closing it goes back to the pause, the game still frozen behind it.
  await menu.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(menu).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible();
  await expect.poll(() => gameState(page)).toBe('suspended');

  // B opens it from the pause too, and only Resume starts the game again.
  await page.keyboard.press('KeyB');
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible();

  // Back on the pause, focus is on Resume and Tab walks the buttons (Safari
  // tabs to buttons only with Option held).
  await expect(page.getByRole('button', { name: 'Resume' })).toBeFocused();
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(menu).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Loadout and bag' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeHidden();
  await expect.poll(() => gameState(page)).toBe('running');
});

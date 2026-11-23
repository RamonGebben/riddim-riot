import { expect, test, type Page } from '@playwright/test';

/** Every realtime AudioContext the page makes, so a stall can be explained. */
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

/** Each context's state and clock, e.g. "running 12.41s". */
const audioClock = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { audioContexts: Array<AudioContext> }).audioContexts
      .map(context => `${context.state} ${context.currentTime.toFixed(2)}s`)
      .join(', '),
  );

test('step into the circle to start the fight', async ({ page }) => {
  // Two musical waits of up to 20 s each need more than the default 30 s.
  test.setTimeout(60_000);
  const errors: Array<string> = [];
  page.on('pageerror', error => errors.push(error.message));
  await watchAudio(page);

  await page.goto('/?seed=42');
  await page.getByRole('button', { name: 'Drop in' }).click();
  const playArea = page.getByRole('main', { name: 'Play area' });
  await expect(playArea.locator('canvas')).toBeVisible();

  // A first run walks through the controls, each step done by doing it.
  const step = (name: string) =>
    expect(page.getByRole('region', { name })).toBeVisible();
  await step('Move');
  // Back, away from the circle, so nothing here steps into it.
  await page.keyboard.down('KeyS');
  await step('Aim and fire');
  await playArea.click();
  await step('Dash');
  await page.keyboard.press('Space');
  await page.keyboard.up('KeyS');
  await step('Switch weapons');
  await page.keyboard.press('Digit2');
  await step('Loot and your bag');
  await page.keyboard.press('Tab');
  await page
    .getByRole('dialog', { name: 'Loadout' })
    .getByRole('button', { name: 'Back to the fight' })
    .click();
  await step('Health and pause');
  await page.keyboard.press('KeyP');
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible();
  await page.keyboard.press('KeyP');
  await expect(page.getByRole('region', { name: 'Ready' })).toHaveText(
    /Now step into the circle to start your run\./,
  );

  // Waits are musical: up to two bar lines (~3.4 s at 140 BPM) before the
  // slam, with room for a CI runner whose audio clock crawls (Firefox's did).
  const musical = { timeout: 20_000 };

  // The circle is straight ahead of the spawn: walk up until it takes.
  await playArea.click();
  await page.keyboard.down('KeyW');
  await expect(page.getByText(/charging/)).toBeVisible(musical);
  await page.keyboard.up('KeyW');

  // A bar of charge, then the slam starts the song on its intro. Bar lines
  // come off the audio clock, so a stall here says what the clock did.
  const before = await audioClock(page);
  await expect(page.getByText(/intro \d:\d\d/))
    .toBeVisible(musical)
    .catch(async (error: Error) => {
      const after = await audioClock(page);
      throw new Error(
        `${error.message}\naudio clock: ${before} at the charge, ${after} 20 s on`,
      );
    });
  // Started: the walkthrough was a first play's, and won't show again.
  expect(
    await page.evaluate(() =>
      localStorage.getItem('bass-weapons:tutorial-seen'),
    ),
  ).toBe('true');
  expect(errors).toEqual([]);
});

import { expect, test } from '@playwright/test';
import { pageErrors } from '../support/game';

test('wait for sound the browser holds back, and start it on a press', async ({
  page,
}) => {
  const errors = pageErrors(page);
  // Act like a browser with no sound output (or strict autoplay rules):
  // every context starts suspended - test browsers allow autoplay, so it
  // wouldn't otherwise - and every resume is held back until the test
  // lets go.
  await page.addInitScript(() => {
    const resume = AudioContext.prototype.resume;
    Object.assign(window, { soundAllowed: false });
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options);
        void this.suspend();
      }
    };
    AudioContext.prototype.resume = function () {
      const allowed = (window as unknown as { soundAllowed: boolean })
        .soundAllowed;
      return allowed ? resume.call(this) : new Promise<void>(() => {});
    };
  });

  await page.goto('/?seed=42');
  await page.getByRole('button', { name: 'Drop in' }).click();
  const blocked = page.getByRole('heading', { name: "Sound couldn't start" });
  await expect(blocked).toBeVisible();

  // Still held back: asking again keeps the game waiting.
  await page.getByRole('button', { name: 'Start sound' }).click();
  await expect(blocked).toBeVisible();

  await page.evaluate(() => Object.assign(window, { soundAllowed: true }));
  await page.getByRole('button', { name: 'Start sound' }).click();
  await expect(blocked).toBeHidden();
  // At the circle: a first run's walkthrough of the controls.
  await expect(page.getByRole('region', { name: 'Move' })).toBeVisible();
  expect(errors).toEqual([]);
});

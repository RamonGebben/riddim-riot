import { expect, type Page } from '@playwright/test';

/** What `riot.rig` takes (see `src/game/rig`). */
export interface Rig {
  level?: number;
  subgenre?: string;
  bpm?: number;
  god?: boolean;
  stress?: boolean;
  skipCircle?: boolean;
  seed?: number;
}

type RiotCommand = 'rig' | 'reset' | 'skip' | 'loot';

/**
 * Call the dev console's `riot`, as a play-tester would. It's there once
 * the game page has hydrated.
 */
export const riot = async (
  page: Page,
  command: RiotCommand,
  ...args: Array<unknown>
) => {
  await page.waitForFunction(() => 'riot' in window);
  return page.evaluate(
    ([name, rest]) =>
      (
        window as unknown as {
          riot: Record<string, (...a: Array<unknown>) => unknown>;
        }
      ).riot[name](...rest),
    [command, args] as const,
  );
};

/** Rig the next run: set before pressing Drop in. */
export const rig = (page: Page, next: Rig) => riot(page, 'rig', next);

/** Errors the page throws, to check none were. */
export const pageErrors = (page: Page) => {
  const errors: Array<string> = [];
  page.on('pageerror', error => errors.push(error.message));
  return errors;
};

/** Press Drop in and wait for the level to be drawn. */
export const dropIn = async (page: Page) => {
  await page.getByRole('button', { name: 'Drop in' }).click();
  const playArea = page.getByRole('main', { name: 'Play area' });
  await expect(playArea.locator('canvas')).toBeVisible();
  return playArea;
};

/**
 * Waits on the music: up to two bar lines, with room for a CI runner whose
 * audio clock crawls (Firefox's did).
 */
export const musical = { timeout: 20_000 };

/** The song's countdown, e.g. "intro 0:13"; 0:00 until the clock ticks. */
export const introLabel = (page: Page) => page.getByText(/intro \d:\d\d/);

/** Seconds left in the intro, as the HUD shows them. */
export const introSeconds = async (page: Page) => {
  const [, minutes, seconds] =
    /intro (\d):(\d\d)/.exec((await introLabel(page).textContent()) ?? '') ??
    [];
  return Number(minutes) * 60 + Number(seconds);
};

/**
 * Into the song, its clock ticking. A skipped circle shows the intro
 * before the first tick, and a bar has to have played before anything
 * can loop it.
 */
export const inTheSong = async (page: Page) => {
  await expect(introLabel(page)).toBeVisible(musical);
  await expect.poll(() => introSeconds(page), musical).toBeGreaterThan(0);
};

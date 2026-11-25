import { expect, test, type Page } from '@playwright/test';
import {
  dropIn,
  inTheSong,
  introSeconds,
  pageErrors,
  rig,
  type Rig,
} from '../support/game';

/** The intro's time left as the song starts, in seconds. */
const startingIntro = async (page: Page, rigged: Rig) => {
  await page.goto('/?seed=42');
  await rig(page, { ...rigged, skipCircle: true, god: true });
  await dropIn(page);
  await inTheSong(page);
  return introSeconds(page);
};

test('the song runs at the level tempo: twice the BPM, half the time', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const errors = pageErrors(page);
  // Dubstep's halftime slowed right down, drum & bass's two-step pushed.
  const slow = await startingIntro(page, { subgenre: 'deep', bpm: 80 });
  const fast = await startingIntro(page, { subgenre: 'neurofunk', bpm: 160 });
  // The same bars at twice the tempo: a little slack for the clock
  // having moved on before the label was read.
  expect(slow / fast).toBeGreaterThan(1.7);
  expect(slow / fast).toBeLessThan(2.3);
  expect(errors).toEqual([]);
});

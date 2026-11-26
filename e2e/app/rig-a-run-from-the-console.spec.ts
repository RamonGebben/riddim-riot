import { expect, test, type Page } from '@playwright/test';
import { pageErrors, riot, rig } from '../support/game';

/** Each subgenre's label and tempo range (see `src/game/genre`). */
const SUBGENRES = {
  deep: { label: 'Deep dubstep', bpm: [138, 140] },
  riddim: { label: 'Riddim', bpm: [140, 140] },
  brostep: { label: 'Brostep', bpm: [140, 145] },
  halfstep: { label: 'Halfstep', bpm: [170, 172] },
  liquid: { label: 'Liquid', bpm: [170, 174] },
  jumpup: { label: 'Jump-up', bpm: [172, 175] },
  neurofunk: { label: 'Neurofunk', bpm: [174, 176] },
} as const;

const startLine = (page: Page) =>
  page.getByText(/ in [A-G]#? (minor|phrygian) · \d+ BPM · 5 levels/);

test('rig the next run from the console, kept until reset', async ({
  page,
}) => {
  const errors = pageErrors(page);
  await page.goto('/?seed=42');
  await rig(page, { level: 4, subgenre: 'neurofunk', bpm: 176, god: true });

  await expect(startLine(page)).toHaveText(/^Neurofunk in .* · 176 BPM/);
  const note = page.getByText(/^Rigged: /);
  await expect(note).toHaveText(
    /^Rigged: level 4 · Neurofunk · 176 BPM · god mode\. This run stays off the board/,
  );

  // Kept on the device through a reload, once the account check has
  // answered: WebKit throws on a request a reload cuts off.
  await page.waitForLoadState('networkidle');
  await page.reload();
  await expect(note).toBeVisible();
  await expect(startLine(page)).toHaveText(/^Neurofunk/);

  await riot(page, 'reset');
  await expect(note).toBeHidden();
  await expect(startLine(page)).toHaveText(/^(Deep dubstep|Riddim) in /);
  expect(errors).toEqual([]);
});

test('every subgenre names itself and plays in its own tempo range', async ({
  page,
}) => {
  await page.goto('/?seed=42');
  for (const [subgenre, { label, bpm }] of Object.entries(SUBGENRES)) {
    await rig(page, { subgenre });
    await expect(startLine(page)).toHaveText(new RegExp(`^${label} in `));
    const text = (await startLine(page).textContent()) ?? '';
    const tempo = Number(/(\d+) BPM/.exec(text)?.[1]);
    expect(tempo, label).toBeGreaterThanOrEqual(bpm[0]);
    expect(tempo, label).toBeLessThanOrEqual(bpm[1]);
  }
});

test('a rig the game would not play is turned away, with a warning', async ({
  page,
}) => {
  const warnings: Array<string> = [];
  page.on('console', message => {
    if (message.type() === 'warning') warnings.push(message.text());
  });
  await page.goto('/?seed=42');
  await rig(page, { level: 9, subgenre: 'polka', bpm: 999 });
  await expect.poll(() => warnings.join('\n')).toMatch(/riot: ignored/);
  await expect(page.getByText(/^Rigged: /)).toBeHidden();
});

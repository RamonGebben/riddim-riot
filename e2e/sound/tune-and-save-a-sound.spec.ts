import { expect, test } from '@playwright/test';

test('tune a sound in the playground and save it to the game', async ({
  page,
}) => {
  const errors: Array<string> = [];
  page.on('pageerror', error => errors.push(error.message));
  // Don't let the test overwrite the real design file.
  let savedBody: unknown = null;
  await page.route('**/__sound-design', async route => {
    if (route.request().method() === 'POST') {
      savedBody = route.request().postDataJSON();
      await route.fulfill({ json: { file: 'src/game/sound/design.json' } });
      return;
    }
    await route.continue();
  });

  // No drafts from earlier runs. Cleared before the page loads rather than
  // with a reload after: a reload cancels the page's fetch of the saved
  // design, which WebKit reports as an error.
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/playground.html');
  await page.getByRole('button', { name: 'Start audio' }).click();
  await expect(page.getByRole('button', { name: 'Start audio' })).toBeHidden();

  await page.getByRole('button', { name: 'Hold' }).click();
  await page.getByRole('button', { name: 'Drop hit' }).click();
  await page.getByRole('spinbutton', { name: 'Unison voices value' }).fill('5');
  await expect(page.getByText('Unsaved changes')).toBeVisible();

  await page.getByRole('button', { name: 'Save to game' }).click();
  await expect(
    page.getByText(/^Saved to src\/game\/sound\/design.json/),
  ).toBeVisible();
  expect(savedBody).toMatchObject({ wobble: { voices: 5 } });
  expect(errors).toEqual([]);
});

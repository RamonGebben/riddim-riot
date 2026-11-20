import { describe, expect, it, vi } from 'vitest';
import { placePath, sharePlace } from '.';

const URL = 'https://bass-weapons.ra-ge.net/leaderboard/RIDDIMRAT';

describe('placePath', () => {
  it('links a name to its place', () => {
    expect(placePath('K_HALFTIME')).toBe('/leaderboard/K_HALFTIME');
  });
});

describe('sharePlace', () => {
  it('uses the share sheet when there is one', async () => {
    const share = vi.fn(async () => {});
    expect(await sharePlace(URL, '2ND', { share })).toBe('shared');
    expect(share).toHaveBeenCalledWith({ url: URL, text: '2ND' });
  });

  it('treats a closed share sheet as nothing happening', async () => {
    const share = vi.fn(async () => {
      throw Object.assign(new Error('closed'), { name: 'AbortError' });
    });
    expect(await sharePlace(URL, '2ND', { share })).toBe('idle');
  });

  it('copies the link without a share sheet', async () => {
    const writeText = vi.fn(async () => {});
    expect(await sharePlace(URL, '2ND', { clipboard: { writeText } })).toBe(
      'copied',
    );
    expect(writeText).toHaveBeenCalledWith(URL);
  });

  it('says so when neither works', async () => {
    const writeText = vi.fn(async () => {
      throw new Error('denied');
    });
    expect(await sharePlace(URL, '2ND', { clipboard: { writeText } })).toBe(
      'failed',
    );
    expect(await sharePlace(URL, '2ND', {})).toBe('failed');
  });
});

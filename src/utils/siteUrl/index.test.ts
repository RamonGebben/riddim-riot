import { describe, expect, it } from 'vitest';
import { siteUrl } from '.';

describe('siteUrl', () => {
  it('uses the production domain Vercel reports', () => {
    expect(siteUrl('riddim-riot.vercel.app')).toBe(
      'https://riddim-riot.vercel.app',
    );
  });

  it('falls back to the custom domain', () => {
    expect(siteUrl(undefined)).toBe('https://riddim-riot.ra-ge.net');
    expect(siteUrl('')).toBe('https://riddim-riot.ra-ge.net');
  });
});

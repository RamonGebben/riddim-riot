import { describe, expect, it } from 'vitest';
import { siteUrl } from '.';

describe('siteUrl', () => {
  it('uses the production domain Vercel reports', () => {
    expect(siteUrl('bass-weapons.vercel.app')).toBe(
      'https://bass-weapons.vercel.app',
    );
  });

  it('falls back to the custom domain', () => {
    expect(siteUrl(undefined)).toBe('https://bass-weapons.ra-ge.net');
    expect(siteUrl('')).toBe('https://bass-weapons.ra-ge.net');
  });
});

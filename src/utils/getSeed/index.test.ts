import { describe, expect, it } from 'vitest';
import { getSeed } from '.';

describe('getSeed', () => {
  it('reads a numeric seed from the query string', () => {
    expect(getSeed('?seed=1234')).toBe(1234);
  });

  it('hashes a word to the same seed every time', () => {
    expect(getSeed('?seed=wobble')).toBe(getSeed('?seed=wobble'));
    expect(getSeed('?seed=wobble')).not.toBe(getSeed('?seed=reese'));
  });

  it('keeps seeds within 32 bits', () => {
    expect(getSeed('?seed=99999999999')).toBeLessThan(2 ** 32);
  });

  it('falls back to a random seed without one', () => {
    expect(getSeed('', () => 0.5)).toBe(2 ** 31);
    expect(getSeed('?seed=', () => 0)).toBe(0);
  });
});

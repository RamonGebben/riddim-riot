import { describe, expect, it } from 'vitest';
import { meterPercent } from '.';

describe('meterPercent', () => {
  it('maps -60..0 dB onto the bar', () => {
    expect(meterPercent(-60)).toBe(0);
    expect(meterPercent(-30)).toBe(50);
    expect(meterPercent(0)).toBe(100);
  });

  it('clamps silence and overs', () => {
    expect(meterPercent(-Infinity)).toBe(0);
    expect(meterPercent(Number.NaN)).toBe(0);
    expect(meterPercent(3)).toBe(100);
  });
});

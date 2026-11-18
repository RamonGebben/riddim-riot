import { describe, expect, it } from 'vitest';
import { gridError, nextGridTime, secondsPerStep } from '.';

describe('secondsPerStep', () => {
  it('splits a beat into four 1/16 steps', () => {
    expect(secondsPerStep(120)).toBe(0.125);
    expect(secondsPerStep(140) * 4).toBeCloseTo(60 / 140);
  });
});

describe('nextGridTime', () => {
  it('picks the next slot after now on the anchored grid', () => {
    expect(
      nextGridTime({ now: 10.03, anchor: 10, stepSeconds: 0.1 }),
    ).toBeCloseTo(10.1);
  });

  it('can land on an already-ticked slot whose audio is still ahead', () => {
    expect(
      nextGridTime({ now: 9.85, anchor: 10, stepSeconds: 0.1 }),
    ).toBeCloseTo(9.9);
  });

  it('skips a slot that is too close to schedule', () => {
    expect(
      nextGridTime({ now: 9.895, anchor: 10, stepSeconds: 0.1 }),
    ).toBeCloseTo(10);
  });
});

describe('gridError', () => {
  it('is how far off the nearest grid point a time lands', () => {
    expect(gridError(10.03, 10, 0.25)).toBeCloseTo(0.03);
    expect(gridError(10.23, 10, 0.25)).toBeCloseTo(-0.02);
    expect(gridError(9.5, 10, 0.25)).toBeCloseTo(0);
  });
});

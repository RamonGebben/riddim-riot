import { describe, expect, it } from 'vitest';
import { secondsPerStep } from '.';

describe('secondsPerStep', () => {
  it('splits a beat into four 1/16 steps', () => {
    expect(secondsPerStep(120)).toBe(0.125);
    expect(secondsPerStep(140) * 4).toBeCloseTo(60 / 140);
  });
});

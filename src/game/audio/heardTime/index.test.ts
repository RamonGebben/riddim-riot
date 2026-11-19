import { describe, expect, it } from 'vitest';
import { heardTime } from '.';

describe('heardTime', () => {
  it('projects the output timestamp forward to now', () => {
    const timestamp = { contextTime: 10, performanceTime: 5000 };
    expect(heardTime(timestamp, 5020, 99)).toBeCloseTo(10.02);
  });

  it('never runs ahead of the audio thread, as after a pause', () => {
    const stale = { contextTime: 10, performanceTime: 5000 };
    expect(heardTime(stale, 65_000, 10.2)).toBe(10.2);
  });

  it('falls back until the browser reports a timestamp', () => {
    expect(heardTime(undefined, 5000, 3.5)).toBe(3.5);
    expect(heardTime({ contextTime: 0, performanceTime: 0 }, 5000, 3.5)).toBe(
      3.5,
    );
  });
});

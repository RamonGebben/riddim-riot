import { describe, expect, it } from 'vitest';
import { heardTime } from '.';

describe('heardTime', () => {
  it('projects the output timestamp forward to now', () => {
    const timestamp = { contextTime: 10, performanceTime: 5000 };
    expect(heardTime(timestamp, 5020, 10.2)).toBeCloseTo(10.02);
  });

  it('never runs ahead of the audio thread, as after a pause', () => {
    const stale = { contextTime: 10, performanceTime: 5000 };
    expect(heardTime(stale, 65_000, 10.2)).toBe(10.2);
  });

  it("ignores a timestamp that trails by more than any latency, as WebKit's on Linux", () => {
    // performanceTime 3.7 s ahead of now: the projection lands near zero.
    const skewed = { contextTime: 3.7, performanceTime: 9930 };
    expect(heardTime(skewed, 6230, 3.71)).toBe(3.71);
  });

  it('falls back until the browser reports a timestamp', () => {
    expect(heardTime(undefined, 5000, 3.5)).toBe(3.5);
    expect(heardTime({ contextTime: 0, performanceTime: 0 }, 5000, 3.5)).toBe(
      3.5,
    );
  });
});

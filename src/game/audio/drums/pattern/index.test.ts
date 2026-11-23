import { describe, expect, it } from 'vitest';
import { generateDrumBar, halfSpeedStep, hitsAt, isFillBar } from '.';

const bars = (seed: number, count: number) =>
  Array.from({ length: count }, (_, bar) => generateDrumBar(seed, bar));

describe('generateDrumBar', () => {
  it('is reproducible from the seed and bar', () => {
    expect(generateDrumBar(42, 5)).toEqual(generateDrumBar(42, 5));
  });

  it('fills every lane with one velocity per 1/16 step', () => {
    Object.values(generateDrumBar(42, 0)).forEach(lane => {
      expect(lane).toHaveLength(16);
      lane.forEach(velocity => {
        expect(velocity).toBeGreaterThanOrEqual(0);
        expect(velocity).toBeLessThanOrEqual(1);
      });
    });
  });

  it('always keeps the halftime backbone: kick on 1, snare on 3', () => {
    bars(7, 64).forEach(bar => {
      expect(bar.kick[0]).toBe(1);
      expect(bar.snare[8]).toBe(1);
      expect(bar.kick[8]).toBe(0);
    });
  });

  it('never lets the closed and open hat hit together', () => {
    bars(7, 64).forEach(bar => {
      bar.openHat.forEach((velocity, step) => {
        if (velocity > 0) expect(bar.hat[step]).toBe(0);
      });
    });
  });

  it('closes each 4-bar phrase with a snare roll and no kicks under it', () => {
    const fill = generateDrumBar(7, 3);
    fill.snare
      .slice(12)
      .forEach(velocity => expect(velocity).toBeGreaterThan(0));
    fill.kick.slice(12).forEach(velocity => expect(velocity).toBe(0));
  });

  it('varies from bar to bar and seed to seed', () => {
    const variety = new Set(bars(7, 16).map(bar => JSON.stringify(bar)));
    expect(variety.size).toBeGreaterThan(4);
    expect(generateDrumBar(1, 0)).not.toEqual(generateDrumBar(2, 0));
  });
});

describe('isFillBar', () => {
  it('marks the last bar of every 4-bar phrase', () => {
    expect([0, 1, 2, 3, 7, 8].map(isFillBar)).toEqual([
      false,
      false,
      false,
      true,
      true,
      false,
    ]);
  });
});

describe('hitsAt', () => {
  it('lists only the voices playing on that step', () => {
    const bar = generateDrumBar(42, 0);
    expect(hitsAt(bar, 8)).toContainEqual({ voice: 'snare', velocity: 1 });
    expect(hitsAt(bar, 0)).toContainEqual({ voice: 'kick', velocity: 1 });
    hitsAt(bar, 5).forEach(hit => expect(hit.velocity).toBeGreaterThan(0));
  });
});

describe('halfSpeedStep', () => {
  it('stretches each pattern bar over two', () => {
    expect(halfSpeedStep({ bar: 10, stepInBar: 0 }, 10)).toEqual({
      bar: 10,
      stepInBar: 0,
    });
    expect(halfSpeedStep({ bar: 10, stepInBar: 8 }, 10)).toEqual({
      bar: 10,
      stepInBar: 4,
    });
    expect(halfSpeedStep({ bar: 11, stepInBar: 0 }, 10)).toEqual({
      bar: 10,
      stepInBar: 8,
    });
    expect(halfSpeedStep({ bar: 12, stepInBar: 2 }, 10)).toEqual({
      bar: 11,
      stepInBar: 1,
    });
  });

  it('rests on the steps in between', () => {
    expect(halfSpeedStep({ bar: 10, stepInBar: 3 }, 10)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { createRng, deriveSeed } from '.';

const take = (seed: number, count: number) => {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => rng.next());
};

describe('createRng', () => {
  it('repeats the same sequence for the same seed', () => {
    expect(take(42, 10)).toEqual(take(42, 10));
  });

  it('gives a different sequence for a different seed', () => {
    expect(take(42, 10)).not.toEqual(take(43, 10));
  });

  it('stays within [0, 1)', () => {
    take(7, 1000).forEach(value => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });
  });

  it('rolls integers within both bounds', () => {
    const rng = createRng(1);
    const rolls = Array.from({ length: 500 }, () => rng.int(2, 4));
    expect(new Set(rolls)).toEqual(new Set([2, 3, 4]));
  });

  it('picks from the list and refuses an empty one', () => {
    const rng = createRng(1);
    expect(['a', 'b']).toContain(rng.pick(['a', 'b']));
    expect(() => rng.pick([])).toThrow();
  });
});

describe('deriveSeed', () => {
  it('is stable for the same keys', () => {
    expect(deriveSeed(42, 3)).toBe(deriveSeed(42, 3));
  });

  it('separates neighbouring keys and seeds', () => {
    const seeds = new Set([
      deriveSeed(42, 0),
      deriveSeed(42, 1),
      deriveSeed(43, 0),
      deriveSeed(42, 0, 1),
    ]);
    expect(seeds.size).toBe(4);
  });
});

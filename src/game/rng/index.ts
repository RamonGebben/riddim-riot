export interface Rng {
  /** A float in [0, 1). */
  next: () => number;
  /** An integer in [min, max], both inclusive. */
  int: (min: number, max: number) => number;
  /** True with probability `p`. */
  chance: (p: number) => boolean;
  pick: <T>(items: ReadonlyArray<T>) => T;
}

/**
 * mulberry32 - small, fast, and good enough for gameplay. Every level, weapon
 * and drum pattern is reproducible from its seed.
 */
export const createRng = (seed: number): Rng => {
  let state = seed >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number) =>
    min + Math.floor(next() * (max - min + 1));

  return {
    next,
    int,
    chance: p => next() < p,
    pick: items => {
      if (items.length === 0) throw new Error('cannot pick from an empty list');
      return items[int(0, items.length - 1)];
    },
  };
};

// murmur3's finalizer: every input bit flips about half the output bits.
const avalanche = (value: number) => {
  const a = Math.imul(value ^ (value >>> 16), 0x85ebca6b);
  const b = Math.imul(a ^ (a >>> 13), 0xc2b2ae35);
  return (b ^ (b >>> 16)) >>> 0;
};

/**
 * Derive an independent seed for a sub-stream (bar 12's drums, slot 2's
 * weapon) so each can be generated on its own, in any order.
 */
export const deriveSeed = (seed: number, ...keys: Array<number>): number =>
  keys.reduce(
    (hash, key) => avalanche(hash ^ avalanche(key + 0x9e3779b9)),
    avalanche(seed),
  );

/**
 * One of `weights`' items, each as likely as its weight: one `rng.next()`,
 * landing in the item whose share of the total it falls in.
 */
export const pickWeighted = <T>(
  rng: Rng,
  weights: ReadonlyArray<readonly [T, number]>,
): T => {
  const ends = weights.reduce<Array<number>>(
    (acc, [, weight]) => [...acc, (acc.at(-1) ?? 0) + weight],
    [],
  );
  const roll = rng.next() * (ends.at(-1) ?? 0);
  const hit = ends.findIndex(end => roll < end);
  return weights[hit === -1 ? weights.length - 1 : hit][0];
};

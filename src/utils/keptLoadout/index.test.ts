import { describe, expect, it } from 'vitest';
import { keepLoadout, loadoutSchema, readKeptLoadout } from '.';

const memory = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
};

const recipes = [
  { seed: 1, oscillator: 'wobble' as const },
  { seed: 2, manufacturer: 'vandal' as const, fx: 'echo' as const },
  { seed: 3 },
];

describe('keptLoadout', () => {
  it('keeps a loadout on the device and reads it back', () => {
    const store = memory();
    expect(readKeptLoadout(store)).toBeNull();
    keepLoadout({ recipes, savedAt: 5 }, store);
    expect(readKeptLoadout(store)).toEqual({ recipes, savedAt: 5 });
  });

  it('ignores anything that is not a loadout', () => {
    const store = memory();
    store.setItem('bass-weapons:loadout', '{"recipes":[{"seed":-1}]}');
    expect(readKeptLoadout(store)).toBeNull();
    store.setItem('bass-weapons:loadout', 'not json');
    expect(readKeptLoadout(store)).toBeNull();
  });

  it('works without storage', () => {
    expect(readKeptLoadout(null)).toBeNull();
    expect(() => keepLoadout({ recipes, savedAt: 1 }, null)).not.toThrow();
  });
});

describe('loadoutSchema', () => {
  it('takes three valid recipes and nothing else', () => {
    expect(loadoutSchema.safeParse(recipes).success).toBe(true);
    expect(loadoutSchema.safeParse(recipes.slice(0, 2)).success).toBe(false);
    expect(
      loadoutSchema.safeParse([...recipes.slice(0, 2), { seed: 3, extra: 1 }])
        .success,
    ).toBe(false);
    expect(
      loadoutSchema.safeParse([...recipes.slice(0, 2), { seed: 3, fx: 'x' }])
        .success,
    ).toBe(false);
  });
});

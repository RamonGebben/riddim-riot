import { describe, expect, it } from 'vitest';
import { readFlashing, reducesFlashing, saveFlashing } from '.';

const memory = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
};

describe('flashing', () => {
  it('has no choice until one is saved', () => {
    const store = memory();
    expect(readFlashing(store)).toBeNull();
    saveFlashing('reduced', store);
    expect(readFlashing(store)).toBe('reduced');
  });

  it('ignores storage that is missing or throws', () => {
    expect(readFlashing(null)).toBeNull();
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readFlashing(broken)).toBeNull();
    expect(() => saveFlashing('full', broken)).not.toThrow();
  });

  it("follows the system's reduced motion until the player chooses", () => {
    expect(reducesFlashing(null, true)).toBe(true);
    expect(reducesFlashing(null, false)).toBe(false);
    expect(reducesFlashing('full', true)).toBe(false);
    expect(reducesFlashing('reduced', false)).toBe(true);
  });
});

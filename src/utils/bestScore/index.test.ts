import { describe, expect, it } from 'vitest';
import { readBest, saveBest } from '.';

const memory = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
};

describe('best score', () => {
  it('starts at 0 and keeps only a better score', () => {
    const store = memory();
    expect(readBest(store)).toBe(0);
    expect(saveBest(1200, store)).toBe(1200);
    expect(saveBest(800, store)).toBe(1200);
    expect(readBest(store)).toBe(1200);
  });

  it('shrugs off storage that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readBest(broken)).toBe(0);
    expect(saveBest(500, broken)).toBe(500);
    expect(readBest(null)).toBe(0);
  });
});

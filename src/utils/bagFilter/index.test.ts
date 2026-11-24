import { describe, expect, it } from 'vitest';
import { readBagFilter, saveBagFilter } from '.';

const memory = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
};

describe('bag filter', () => {
  it('shows all until an engine is saved', () => {
    const store = memory();
    expect(readBagFilter(store)).toBe('all');
    saveBagFilter('laser', store);
    expect(readBagFilter(store)).toBe('laser');
  });

  it('ignores a value it does not know', () => {
    const store = memory();
    store.setItem('bass-weapons:bag-filter', 'synth');
    expect(readBagFilter(store)).toBe('all');
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
    expect(readBagFilter(broken)).toBe('all');
    expect(() => saveBagFilter('beam', broken)).not.toThrow();
  });
});

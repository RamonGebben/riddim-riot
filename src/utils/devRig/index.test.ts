import { describe, expect, it } from 'vitest';
import { readRig, saveRig } from '.';

const memory = () => {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  };
};

describe('dev rig storage', () => {
  it('keeps a rig and forgets an empty one', () => {
    const store = memory();
    expect(readRig(store)).toEqual({});
    saveRig({ level: 4, god: true }, store);
    expect(readRig(store)).toEqual({ level: 4, god: true });
    saveRig({}, store);
    expect(store.items.size).toBe(0);
  });

  it('drops what a valid rig would not hold', () => {
    const store = memory();
    store.setItem('riddim-riot:rig', '{"level":9,"bpm":174,"god":"yes"}');
    expect(readRig(store)).toEqual({ bpm: 174 });
    store.setItem('riddim-riot:rig', 'not json');
    expect(readRig(store)).toEqual({});
  });

  it('shrugs off storage that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readRig(broken)).toEqual({});
    expect(() => saveRig({ god: true }, broken)).not.toThrow();
  });
});

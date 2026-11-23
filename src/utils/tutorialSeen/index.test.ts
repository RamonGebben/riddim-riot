import { describe, expect, it } from 'vitest';
import { readTutorialSeen, saveTutorialSeen } from '.';

const memory = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
};

describe('tutorial seen', () => {
  it('is unseen until saved', () => {
    const store = memory();
    expect(readTutorialSeen(store)).toBe(false);
    saveTutorialSeen(store);
    expect(readTutorialSeen(store)).toBe(true);
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
    expect(readTutorialSeen(broken)).toBe(false);
    expect(() => saveTutorialSeen(broken)).not.toThrow();
    expect(readTutorialSeen(null)).toBe(false);
  });
});

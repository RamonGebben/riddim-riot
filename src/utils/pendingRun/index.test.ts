import { describe, expect, it } from 'vitest';
import { dropPendingRun, keepPendingRun, readPendingRun } from '.';

const memory = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  };
};

const RUN = {
  ticket: 'a.1.sig',
  score: 1_200,
  level: 2,
  kills: 9,
  seed: 42,
  outcome: 'died' as const,
};

describe('pending runs', () => {
  it('keeps a run until it is dropped', () => {
    const store = memory();
    keepPendingRun(RUN, store);
    expect(readPendingRun(store)).toEqual(RUN);
    dropPendingRun(RUN.ticket, store);
    expect(readPendingRun(store)).toBeNull();
  });

  it('only drops the run it was asked to', () => {
    const store = memory();
    keepPendingRun(RUN, store);
    dropPendingRun('another.1.sig', store);
    expect(readPendingRun(store)).toEqual(RUN);
  });

  it('ignores anything that is not a run', () => {
    const store = memory();
    store.setItem('bass-weapons:pending-run', '{"ticket":3}');
    expect(readPendingRun(store)).toBeNull();
    store.setItem('bass-weapons:pending-run', 'not json');
    expect(readPendingRun(store)).toBeNull();
  });

  it('copes with no storage', () => {
    expect(readPendingRun(null)).toBeNull();
    expect(() => keepPendingRun(RUN, null)).not.toThrow();
  });
});

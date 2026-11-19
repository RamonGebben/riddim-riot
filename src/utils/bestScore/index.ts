const KEY = 'bass-weapons:best';

/** Browser storage as far as this needs it; may be missing or throw. */
type Store = Pick<Storage, 'getItem' | 'setItem'>;

const local = (): Store | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/** The best score on this device, 0 when there's none (or no storage). */
export const readBest = (store: Store | null = local()): number => {
  try {
    const saved = Number(store?.getItem(KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  } catch {
    return 0;
  }
};

/** Keep `score` if it beats the best; returns the best either way. */
export const saveBest = (
  score: number,
  store: Store | null = local(),
): number => {
  const best = readBest(store);
  if (score <= best) return best;
  try {
    store?.setItem(KEY, String(score));
  } catch {
    // Private window or storage blocked: the best just isn't kept.
  }
  return score;
};

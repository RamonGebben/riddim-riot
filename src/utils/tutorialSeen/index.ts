const KEY = 'bass-weapons:tutorial-seen';

/** Browser storage as far as this needs it; may be missing or throw. */
type Store = Pick<Storage, 'getItem' | 'setItem'>;

const local = (): Store | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/** Has this device been walked through the controls (or skipped them)? */
export const readTutorialSeen = (store: Store | null = local()): boolean => {
  try {
    return store?.getItem(KEY) === 'true';
  } catch {
    return false;
  }
};

export const saveTutorialSeen = (store: Store | null = local()): void => {
  try {
    store?.setItem(KEY, 'true');
  } catch {
    // Private window or storage blocked: the walkthrough shows next run too.
  }
};

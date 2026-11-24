const KEY = 'bass-weapons:bag-filter';

const ENGINES = ['all', 'wobble', 'laser', 'beam'] as const;

export type BagFilter = (typeof ENGINES)[number];

/** Browser storage as far as this needs it; may be missing or throw. */
type Store = Pick<Storage, 'getItem' | 'setItem'>;

const session = (): Store | null => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const isFilter = (value: string | null | undefined): value is BagFilter =>
  ENGINES.some(engine => engine === value);

/** The engine the bag was last narrowed to this visit; all by default. */
export const readBagFilter = (store: Store | null = session()): BagFilter => {
  try {
    const saved = store?.getItem(KEY);
    return isFilter(saved) ? saved : 'all';
  } catch {
    return 'all';
  }
};

export const saveBagFilter = (
  filter: BagFilter,
  store: Store | null = session(),
): void => {
  try {
    store?.setItem(KEY, filter);
  } catch {
    // Private window or storage blocked: the bag opens on all next time.
  }
};

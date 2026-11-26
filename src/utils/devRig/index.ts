import { cleanRig, isRigged, type Rig } from '~/game/rig';

const KEY = 'riddim-riot:rig';

/** Browser storage as far as this needs it; may be missing or throw. */
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const local = (): Store | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/** The rig set from the console on this device; `{}` when there's none. */
export const readRig = (store: Store | null = local()): Rig => {
  try {
    const saved = store?.getItem(KEY);
    return saved ? cleanRig(JSON.parse(saved)) : {};
  } catch {
    return {};
  }
};

/** Keep `rig` across reloads; an empty one is forgotten. */
export const saveRig = (rig: Rig, store: Store | null = local()) => {
  try {
    if (!isRigged(rig)) store?.removeItem(KEY);
    else store?.setItem(KEY, JSON.stringify(rig));
  } catch {
    // Private window or storage blocked: the rig lasts until a reload.
  }
};

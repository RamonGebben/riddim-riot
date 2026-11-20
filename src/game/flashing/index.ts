const KEY = 'bass-weapons:flashing';

/** Browser storage as far as this needs it; may be missing or throw. */
type Store = Pick<Storage, 'getItem' | 'setItem'>;

/** The player's own choice; null until they make one. */
export type FlashingChoice = 'reduced' | 'full' | null;

const local = (): Store | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const readFlashing = (store: Store | null = local()): FlashingChoice => {
  try {
    const saved = store?.getItem(KEY);
    return saved === 'reduced' || saved === 'full' ? saved : null;
  } catch {
    return null;
  }
};

export const saveFlashing = (
  choice: Exclude<FlashingChoice, null>,
  store: Store | null = local(),
) => {
  try {
    store?.setItem(KEY, choice);
  } catch {
    // Private window or storage blocked: the choice lasts this visit only.
  }
};

/** The player's choice wins; without one, the system's reduced motion. */
export const reducesFlashing = (
  choice: FlashingChoice,
  prefersReducedMotion: boolean,
) => (choice === null ? prefersReducedMotion : choice === 'reduced');

/** Read by every frame the stage draws; the screens set it. */
let reduced = false;

export const flashingReduced = () => reduced;

export const setFlashingReduced = (on: boolean) => {
  reduced = on;
};

export type WeaponAction =
  | { type: 'select'; slot: number }
  | { type: 'cycle'; direction: 1 | -1 }
  | { type: 'reroll' };

const ACTIONS: Record<string, WeaponAction> = {
  Digit1: { type: 'select', slot: 0 },
  Digit2: { type: 'select', slot: 1 },
  Digit3: { type: 'select', slot: 2 },
  KeyQ: { type: 'cycle', direction: -1 },
  KeyE: { type: 'cycle', direction: 1 },
  KeyR: { type: 'reroll' },
};

/** 1-3 pick a slot, Q/E cycle, R rerolls the active one (a PoC test key). */
export const weaponKeyAction = (code: string): WeaponAction | null =>
  ACTIONS[code] ?? null;

/** One weapon change per wheel gesture, not one per scroll event. */
const WHEEL_COOLDOWN_MS = 180;

export const attachWeaponKeys = (
  element: HTMLElement,
  onAction: (action: WeaponAction) => void,
): (() => void) => {
  let lastWheel = 0;

  const onKeyDown = (event: KeyboardEvent) => {
    const action = weaponKeyAction(event.code);
    if (!action || event.repeat) return;
    onAction(action);
  };
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    if (event.timeStamp - lastWheel < WHEEL_COOLDOWN_MS) return;
    lastWheel = event.timeStamp;
    onAction({ type: 'cycle', direction: event.deltaY > 0 ? 1 : -1 });
  };

  window.addEventListener('keydown', onKeyDown);
  element.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    element.removeEventListener('wheel', onWheel);
  };
};

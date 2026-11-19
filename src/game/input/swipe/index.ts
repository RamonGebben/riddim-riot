/** How far a thumb travels up or down, in CSS pixels, to switch weapons. */
export const SWIPE_PIXELS = 48;

/**
 * Which way a vertical drag of `dy` pixels cycles the loadout: down goes
 * down the list (the next slot), up goes back. Null until it's far enough.
 */
export const swipeDirection = (dy: number): 1 | -1 | null => {
  if (Math.abs(dy) < SWIPE_PIXELS) return null;
  return dy > 0 ? 1 : -1;
};

import { describe, expect, it } from 'vitest';
import { swipeDirection, SWIPE_PIXELS } from '.';

describe('swipeDirection', () => {
  it('ignores a thumb wobbling on the fire button', () => {
    expect(swipeDirection(SWIPE_PIXELS - 1)).toBeNull();
    expect(swipeDirection(-(SWIPE_PIXELS - 1))).toBeNull();
  });

  it('cycles forward on a swipe down and back on a swipe up', () => {
    expect(swipeDirection(SWIPE_PIXELS)).toBe(1);
    expect(swipeDirection(-SWIPE_PIXELS)).toBe(-1);
  });
});

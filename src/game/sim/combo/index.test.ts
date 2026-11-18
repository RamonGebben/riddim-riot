import { describe, expect, it } from 'vitest';
import { comboActive, NO_COMBO, registerKill, type Combo } from '.';

const killOn = (beats: Array<number>) =>
  beats.reduce<{ combo: Combo; points: number }>(
    (acc, beat) => {
      const next = registerKill(acc.combo, beat);
      return { combo: next.combo, points: acc.points + next.points };
    },
    { combo: NO_COMBO, points: 0 },
  );

describe('registerKill', () => {
  it('chains kills on the same or the next beat', () => {
    const { combo, points } = killOn([4, 4, 5, 6]);
    expect(combo.count).toBe(4);
    expect(points).toBe(100 + 200 + 300 + 400);
  });

  it('starts over after a beat without a kill', () => {
    expect(killOn([4, 5, 7]).combo.count).toBe(1);
  });

  it('caps the multiplier', () => {
    const long = killOn(Array.from({ length: 12 }, (_, beat) => beat));
    expect(registerKill(long.combo, 12).points).toBe(800);
  });
});

describe('comboActive', () => {
  it('lasts through the next beat only', () => {
    const { combo } = killOn([4]);
    expect(comboActive(combo, 5)).toBe(true);
    expect(comboActive(combo, 6)).toBe(false);
    expect(comboActive(NO_COMBO, 0)).toBe(false);
  });
});

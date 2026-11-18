import { describe, expect, it } from 'vitest';
import { isMoveKey, moveVector } from '.';

describe('moveVector', () => {
  it('maps WASD and the arrows to directions', () => {
    expect(moveVector(new Set(['KeyD']))).toEqual({ x: 1, y: 0 });
    expect(moveVector(new Set(['ArrowUp']))).toEqual({ x: 0, y: -1 });
  });

  it('keeps diagonals at unit length', () => {
    const { x, y } = moveVector(new Set(['KeyW', 'KeyD']));
    expect(Math.hypot(x, y)).toBeCloseTo(1);
    expect(x).toBeGreaterThan(0);
    expect(y).toBeLessThan(0);
  });

  it('cancels opposite keys and ignores the rest', () => {
    expect(moveVector(new Set(['KeyA', 'KeyD', 'Space']))).toEqual({
      x: 0,
      y: 0,
    });
    expect(isMoveKey('Space')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  add,
  angleOf,
  length,
  lerp,
  normalize,
  scale,
  subtract,
  ZERO,
} from '.';

describe('vec', () => {
  it('adds, subtracts and scales', () => {
    expect(add({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
    expect(subtract({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: -2, y: -2 });
    expect(scale({ x: 1, y: -2 }, 3)).toEqual({ x: 3, y: -6 });
  });

  it('normalizes to unit length, leaving zero alone', () => {
    expect(length(normalize({ x: 3, y: 4 }))).toBeCloseTo(1);
    expect(normalize(ZERO)).toEqual(ZERO);
  });

  it('interpolates between two points', () => {
    expect(lerp({ x: 0, y: 0 }, { x: 10, y: -10 }, 0.25)).toEqual({
      x: 2.5,
      y: -2.5,
    });
  });

  it('measures the angle from the x axis', () => {
    expect(angleOf({ x: 0, y: 1 })).toBeCloseTo(Math.PI / 2);
  });
});

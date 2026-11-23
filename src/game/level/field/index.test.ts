import { describe, expect, it } from 'vitest';
import type { Tilemap } from '../tilemap';
import { distanceAt, distanceField, stepDownhill, stepUphill } from '.';

/** `#` wall, anything else floor. */
const mapOf = (rows: Array<string>): Tilemap => ({
  width: rows[0].length,
  height: rows.length,
  tiles: rows.flatMap(row => [...row].map(c => (c === '#' ? 'wall' : 'floor'))),
});

const map = mapOf(['.....', '.###.', '...#.', '##.#.', '.....']);

describe('distanceField', () => {
  const field = distanceField(map, { x: 0, y: 0 });

  it('counts walking distance around walls', () => {
    expect(distanceAt(map, field, { x: 0, y: 0 })).toBe(0);
    expect(distanceAt(map, field, { x: 4, y: 0 })).toBe(4);
    expect(distanceAt(map, field, { x: 2, y: 3 })).toBe(5);
    expect(distanceAt(map, field, { x: 0, y: 4 })).toBe(8);
  });

  it('marks walls and the outside unreachable', () => {
    expect(distanceAt(map, field, { x: 1, y: 1 })).toBe(-1);
    expect(distanceAt(map, field, { x: -1, y: 0 })).toBe(-1);
  });
});

describe('stepDownhill', () => {
  const field = distanceField(map, { x: 0, y: 0 });

  it('steps to the neighbour closest to the origin', () => {
    expect(stepDownhill(map, field, { x: 2, y: 3 })).toEqual({ x: 2, y: 2 });
  });

  it('routes around a wall rather than into it', () => {
    expect(stepDownhill(map, field, { x: 4, y: 2 })).toEqual({ x: 4, y: 1 });
  });

  it('stays put at the origin, or when every way down is blocked', () => {
    expect(stepDownhill(map, field, { x: 0, y: 0 })).toBeNull();
    expect(stepDownhill(map, field, { x: 2, y: 3 }, () => true)).toBeNull();
  });
});

describe('stepUphill', () => {
  const field = distanceField(map, { x: 0, y: 0 });

  it('steps to the neighbour furthest from the origin', () => {
    expect(stepUphill(map, field, { x: 2, y: 2 })).toEqual({ x: 2, y: 3 });
    expect(stepUphill(map, field, { x: 0, y: 0 })).toEqual({ x: 1, y: 0 });
  });

  it('stays put at a dead end, or when every way out is blocked', () => {
    expect(stepUphill(map, field, { x: 0, y: 4 })).toBeNull();
    expect(stepUphill(map, field, { x: 2, y: 2 }, () => true)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { distanceAt, distanceField } from '../field';
import { isWall, tileOf } from '../tilemap';
import { generateLevel } from '.';

const levels = Array.from({ length: 60 }, (_, seed) => generateLevel(seed));

describe('generateLevel', () => {
  it('is reproducible from its seed', () => {
    expect(generateLevel(9)).toEqual(levels[9]);
  });

  it('builds one 3×3 tilemap of rooms', () => {
    const { map, width, height } = levels[0];
    expect(map.tiles).toHaveLength(map.width * map.height);
    expect(width).toBe(map.width * 64);
    expect(height).toBe(map.height * 64);
  });

  it('starts and ends on floor, with a walkable path between them', () => {
    levels.forEach(({ map, start, exit }) => {
      expect(isWall(map, tileOf(start))).toBe(false);
      expect(isWall(map, tileOf(exit))).toBe(false);
      const field = distanceField(map, tileOf(start));
      expect(distanceAt(map, field, tileOf(exit))).toBeGreaterThan(0);
    });
  });

  it('lets the player reach every room', () => {
    levels.forEach(({ map, start }) => {
      const field = distanceField(map, tileOf(start));
      Array.from({ length: 9 }, (_, i) => ({
        x: (i % 3) * 17 + 8,
        y: Math.floor(i / 3) * 11 + 5,
      })).forEach(centre =>
        expect(distanceAt(map, field, centre)).toBeGreaterThanOrEqual(0),
      );
    });
  });

  it('varies layout, key and palette between seeds', () => {
    expect(new Set(levels.map(level => JSON.stringify(level.map))).size).toBe(
      60,
    );
    expect(new Set(levels.map(level => level.key.root)).size).toBeGreaterThan(
      2,
    );
    expect(new Set(levels.map(level => level.palette.name)).size).toBe(4);
  });
});

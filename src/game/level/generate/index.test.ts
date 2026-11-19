import { describe, expect, it } from 'vitest';
import { distanceAt, distanceField } from '../field';
import { isWall, tileOf } from '../tilemap';
import { generateLevel } from '.';

const levels = Array.from({ length: 60 }, (_, seed) => generateLevel(seed));

describe('generateLevel', () => {
  it('is reproducible from its seed', () => {
    expect(generateLevel(9)).toEqual(levels[9]);
  });

  it('builds one walled arena, about twice a screen each way', () => {
    levels.forEach(({ map, width, height }) => {
      expect(map.tiles).toHaveLength(map.width * map.height);
      expect(width).toBe(map.width * 64);
      expect(height).toBe(map.height * 64);
      expect(width).toBeGreaterThan(2000);
      expect(height).toBeGreaterThan(1400);
    });
  });

  it('starts the player on open floor near the pad', () => {
    levels.forEach(({ map, start, pad }) => {
      expect(isWall(map, tileOf(start))).toBe(false);
      expect(isWall(map, tileOf(pad))).toBe(false);
      const field = distanceField(map, tileOf(start));
      expect(distanceAt(map, field, tileOf(pad))).toBe(4);
    });
  });

  it('keeps every floor tile reachable: cover never walls anything off', () => {
    levels.forEach(({ map, start }) => {
      const field = distanceField(map, tileOf(start));
      map.tiles.forEach((tile, i) => {
        if (tile === 'wall') return;
        const pos = { x: i % map.width, y: Math.floor(i / map.width) };
        expect(distanceAt(map, field, pos)).toBeGreaterThanOrEqual(0);
      });
    });
  });

  it('has cover in both styles, one style per level', () => {
    const styles = new Set(levels.map(level => level.style));
    expect(styles).toEqual(new Set(['blocks', 'scattered']));
    levels.forEach(({ map }) => {
      const inner = map.tiles.filter((tile, i) => {
        const x = i % map.width;
        const y = Math.floor(i / map.width);
        const border =
          x === 0 || y === 0 || x === map.width - 1 || y === map.height - 1;
        return tile === 'wall' && !border;
      });
      expect(inner.length).toBeGreaterThan(8);
    });
  });

  it('varies layout, key and palette between seeds', () => {
    expect(
      new Set(levels.map(level => JSON.stringify(level.map))).size,
    ).toBeGreaterThan(50);
    expect(new Set(levels.map(level => level.key.root)).size).toBeGreaterThan(
      2,
    );
    expect(new Set(levels.map(level => level.palette.name)).size).toBe(4);
  });
});

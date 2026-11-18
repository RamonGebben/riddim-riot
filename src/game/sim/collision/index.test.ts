import { describe, expect, it } from 'vitest';
import type { Tilemap } from '../../level';
import { hitsWall, moveCircle } from '.';

/** A 5×5 room: walls all round, one pillar in the middle. */
const map: Tilemap = {
  width: 5,
  height: 5,
  tiles: ['#####', '#...#', '#.#.#', '#...#', '#####'].flatMap(row =>
    [...row].map(c => (c === '#' ? 'wall' : 'floor')),
  ),
};

describe('hitsWall', () => {
  it('detects a circle touching a wall tile, not one clear of it', () => {
    expect(hitsWall(map, { x: 96, y: 96 }, 10)).toBe(false);
    expect(hitsWall(map, { x: 70, y: 96 }, 10)).toBe(true);
  });

  it('treats the map edge as wall', () => {
    expect(hitsWall(map, { x: -5, y: 96 }, 2)).toBe(true);
  });
});

describe('moveCircle', () => {
  it('moves freely across floor', () => {
    expect(moveCircle(map, { x: 96, y: 96 }, { x: 0, y: 40 }, 10)).toEqual({
      x: 96,
      y: 136,
    });
  });

  it('stops at a wall instead of entering it', () => {
    const moved = moveCircle(map, { x: 96, y: 96 }, { x: -100, y: 0 }, 10);
    expect(moved.x).toBeGreaterThanOrEqual(74);
    expect(moved.x).toBeLessThan(80);
  });

  it('slides along a wall when pushed into it diagonally', () => {
    const moved = moveCircle(map, { x: 80, y: 100 }, { x: -30, y: 30 }, 10);
    expect(moved.y).toBeCloseTo(130);
    expect(moved.x).toBeGreaterThanOrEqual(74);
  });

  it('never tunnels through a tile, however fast', () => {
    const moved = moveCircle(map, { x: 96, y: 160 }, { x: 400, y: 0 }, 10);
    expect(hitsWall(map, moved, 10)).toBe(false);
    expect(moved.x).toBeLessThan(128 - 10 + 1);
  });
});

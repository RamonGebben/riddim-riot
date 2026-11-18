import { describe, expect, it } from 'vitest';
import { createRng } from '../../rng';
import { buildRoom, ROOM_HEIGHT, ROOM_WIDTH, TEMPLATE_COUNT } from '.';

const at = (tiles: Array<string>, x: number, y: number) =>
  tiles[y * ROOM_WIDTH + x];
const midX = (ROOM_WIDTH - 1) / 2;
const midY = (ROOM_HEIGHT - 1) / 2;

describe('buildRoom', () => {
  it('walls in a room with no openings', () => {
    const tiles = buildRoom({ rng: createRng(1), openings: new Set() });
    expect(tiles).toHaveLength(ROOM_WIDTH * ROOM_HEIGHT);
    expect(at(tiles, midX, 0)).toBe('wall');
    expect(at(tiles, 0, midY)).toBe('wall');
  });

  it('cuts a 3-wide door in each open side', () => {
    const tiles = buildRoom({
      rng: createRng(1),
      openings: new Set(['north', 'east']),
    });
    expect([-1, 0, 1].map(d => at(tiles, midX + d, 0))).toEqual([
      'floor',
      'floor',
      'floor',
    ]);
    expect(at(tiles, midX + 2, 0)).toBe('wall');
    expect(at(tiles, ROOM_WIDTH - 1, midY)).toBe('floor');
    expect(at(tiles, midX, ROOM_HEIGHT - 1)).toBe('wall');
  });

  it('keeps the centre lines clear in every template, so doors connect', () => {
    Array.from({ length: TEMPLATE_COUNT * 20 }, (_, i) =>
      buildRoom({
        rng: createRng(i),
        openings: new Set(['north', 'south', 'east', 'west']),
        template: i % TEMPLATE_COUNT,
      }),
    ).forEach(tiles => {
      Array.from({ length: ROOM_WIDTH }, (_, x) =>
        expect(at(tiles, x, midY)).toBe('floor'),
      );
      Array.from({ length: ROOM_HEIGHT }, (_, y) =>
        expect(at(tiles, midX, y)).toBe('floor'),
      );
    });
  });
});

import { describe, expect, it } from 'vitest';
import { createRng } from '../../rng';
import { planRoomGrid, roomKey, type RoomGrid } from '.';

const grids = Array.from({ length: 100 }, (_, seed) =>
  planRoomGrid(createRng(seed), { cols: 3, rows: 3 }),
);

/** Rooms reachable from the start by walking through openings. */
const reachable = (grid: RoomGrid) => {
  const step = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
  const visit = (key: string, seen: Set<string>): Set<string> => {
    if (seen.has(key)) return seen;
    const [col, row] = key.split(',').map(Number);
    return [...(grid.openings.get(key) ?? [])].reduce(
      (acc, side) =>
        visit(
          roomKey({ col: col + step[side][0], row: row + step[side][1] }),
          acc,
        ),
      new Set([...seen, key]),
    );
  };
  return visit(roomKey(grid.path[0]), new Set());
};

describe('planRoomGrid', () => {
  it('runs the main path from the top row to the bottom row', () => {
    grids.forEach(({ path }) => {
      expect(path[0].row).toBe(0);
      expect(path[path.length - 1].row).toBe(2);
    });
  });

  it('only ever steps to an adjacent room, never revisiting one', () => {
    grids.forEach(({ path }) => {
      path.slice(1).forEach((room, i) => {
        const prev = path[i];
        expect(
          Math.abs(room.col - prev.col) + Math.abs(room.row - prev.row),
        ).toBe(1);
      });
      expect(new Set(path.map(roomKey)).size).toBe(path.length);
    });
  });

  it('connects every room, side rooms included', () => {
    grids.forEach(grid => expect(reachable(grid).size).toBe(9));
  });

  it('opens doors on both sides of each link', () => {
    grids.forEach(({ path, openings }) => {
      const [a, b] = path;
      if (!b) return;
      const side =
        b.row > a.row
          ? ['south', 'north']
          : b.col > a.col
            ? ['east', 'west']
            : ['west', 'east'];
      expect(openings.get(roomKey(a))?.has(side[0] as 'south')).toBe(true);
      expect(openings.get(roomKey(b))?.has(side[1] as 'north')).toBe(true);
    });
  });

  it('is reproducible from the rng seed', () => {
    expect(planRoomGrid(createRng(5), { cols: 3, rows: 3 })).toEqual(grids[5]);
  });
});

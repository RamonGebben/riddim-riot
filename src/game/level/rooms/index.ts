import type { Rng } from '../../rng';
import type { Tile } from '../tilemap';

export type Side = 'north' | 'east' | 'south' | 'west';

/** Room size in tiles, border included; odd so doors centre exactly. */
export const ROOM_WIDTH = 17;
export const ROOM_HEIGHT = 11;
const DOOR_HALF_WIDTH = 1;
/** Chance each `?` cell becomes a wall. */
const OPTIONAL_WALL = 0.45;

/**
 * Handmade interiors (inside the border): `#` wall, `.` floor, `?` maybe.
 * Every template keeps its centre row and column clear, so all four doors
 * always connect through the middle.
 */
const TEMPLATES = [
  [
    '...............',
    '...............',
    '...............',
    '...............',
    '...............',
    '...............',
    '...............',
    '...............',
    '...............',
  ],
  [
    '...............',
    '..##.......##..',
    '..##.......##..',
    '...............',
    '...............',
    '...............',
    '..##.......##..',
    '..##.......##..',
    '...............',
  ],
  [
    '...............',
    '.??.........??.',
    '.?...#...#...?.',
    '.....#...#.....',
    '...............',
    '.....#...#.....',
    '.?...#...#...?.',
    '.??.........??.',
    '...............',
  ],
  [
    '...............',
    '...#.......#...',
    '...#.......#...',
    '...####.####...',
    '...............',
    '...####.####...',
    '...#.......#...',
    '...#.......#...',
    '...............',
  ],
  [
    '...............',
    '....???.???....',
    '...#.......#...',
    '...#..?.?..#...',
    '...............',
    '...#..?.?..#...',
    '...#.......#...',
    '....???.???....',
    '...............',
  ],
  [
    '...............',
    '.#...........#.',
    '...?.##.##..?..',
    '.?...........?.',
    '...............',
    '.?...........?.',
    '...?.##.##..?..',
    '.#...........#.',
    '...............',
  ],
];

export const TEMPLATE_COUNT = TEMPLATES.length;

const isDoor = (x: number, y: number, openings: ReadonlySet<Side>): boolean => {
  const midX = (ROOM_WIDTH - 1) / 2;
  const midY = (ROOM_HEIGHT - 1) / 2;
  const nearMidX = Math.abs(x - midX) <= DOOR_HALF_WIDTH;
  const nearMidY = Math.abs(y - midY) <= DOOR_HALF_WIDTH;
  if (y === 0) return openings.has('north') && nearMidX;
  if (y === ROOM_HEIGHT - 1) return openings.has('south') && nearMidX;
  if (x === 0) return openings.has('west') && nearMidY;
  if (x === ROOM_WIDTH - 1) return openings.has('east') && nearMidY;
  return false;
};

const isBorder = (x: number, y: number) =>
  x === 0 || y === 0 || x === ROOM_WIDTH - 1 || y === ROOM_HEIGHT - 1;

/**
 * One room's tiles, row by row: a border wall with a 3-wide door on each
 * open side, around a template mirrored at random.
 */
export const buildRoom = ({
  rng,
  openings,
  template,
}: {
  rng: Rng;
  openings: ReadonlySet<Side>;
  /** Defaults to a random one; 0 is the open room. */
  template?: number;
}): Array<Tile> => {
  const rows = TEMPLATES[template ?? rng.int(0, TEMPLATES.length - 1)];
  const flipX = rng.chance(0.5);
  const flipY = rng.chance(0.5);
  const interior = (x: number, y: number) => {
    const row = rows[flipY ? rows.length - 1 - y : y];
    return row[flipX ? row.length - 1 - x : x];
  };

  return Array.from({ length: ROOM_WIDTH * ROOM_HEIGHT }, (_, i) => {
    const x = i % ROOM_WIDTH;
    const y = Math.floor(i / ROOM_WIDTH);
    if (isBorder(x, y)) return isDoor(x, y, openings) ? 'floor' : 'wall';
    const cell = interior(x - 1, y - 1);
    if (cell === '#') return 'wall';
    if (cell === '?') return rng.chance(OPTIONAL_WALL) ? 'wall' : 'floor';
    return 'floor';
  });
};

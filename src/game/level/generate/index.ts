import { rollKey, type Key } from '../../music';
import { pickPalette, type Palette } from '../../palette';
import { createRng, deriveSeed } from '../../rng';
import type { Vec } from '../../vec';
import {
  planRoomGrid,
  roomKey,
  type RoomGrid,
  type RoomPos,
} from '../roomGrid';
import { buildRoom, ROOM_HEIGHT, ROOM_WIDTH } from '../rooms';
import { tileCenter, TILE_SIZE, type Tile, type Tilemap } from '../tilemap';

export interface Level {
  seed: number;
  map: Tilemap;
  grid: RoomGrid;
  /** World point the player starts on. */
  start: Vec;
  exit: Vec;
  key: Key;
  palette: Palette;
  /** World size in pixels. */
  width: number;
  height: number;
}

const COLS = 3;
const ROWS = 3;
/** Separate random streams, so changing one never reshuffles another. */
const STREAM = { layout: 10, key: 11, palette: 12 };

const roomCenter = ({ col, row }: RoomPos): Vec =>
  tileCenter({
    x: col * ROOM_WIDTH + (ROOM_WIDTH - 1) / 2,
    y: row * ROOM_HEIGHT + (ROOM_HEIGHT - 1) / 2,
  });

/**
 * The whole level from its seed: a 3×3 room grid with a guaranteed path
 * from start to exit, stitched into one continuous tilemap, plus the key
 * and palette the level plays and looks in.
 */
export const generateLevel = (seed: number): Level => {
  const rng = createRng(deriveSeed(seed, STREAM.layout));
  const grid = planRoomGrid(rng, { cols: COLS, rows: ROWS });
  const start = grid.path[0];
  const exit = grid.path[grid.path.length - 1];
  const isEnd = (pos: RoomPos) =>
    roomKey(pos) === roomKey(start) || roomKey(pos) === roomKey(exit);

  const rooms = new Map(
    Array.from({ length: COLS * ROWS }, (_, i) => {
      const pos = { col: i % COLS, row: Math.floor(i / COLS) };
      const tiles = buildRoom({
        rng,
        openings: grid.openings.get(roomKey(pos)) ?? new Set(),
        // Start and exit stay open, so arriving and leaving read clearly.
        template: isEnd(pos) ? 0 : undefined,
      });
      return [roomKey(pos), tiles] as const;
    }),
  );

  const width = COLS * ROOM_WIDTH;
  const height = ROWS * ROOM_HEIGHT;
  const tiles = Array.from({ length: width * height }, (_, i): Tile => {
    const x = i % width;
    const y = Math.floor(i / width);
    const room = rooms.get(
      roomKey({
        col: Math.floor(x / ROOM_WIDTH),
        row: Math.floor(y / ROOM_HEIGHT),
      }),
    );
    return room?.[(y % ROOM_HEIGHT) * ROOM_WIDTH + (x % ROOM_WIDTH)] ?? 'wall';
  });

  return {
    seed,
    map: { width, height, tiles },
    grid,
    start: roomCenter(start),
    exit: roomCenter(exit),
    key: rollKey(createRng(deriveSeed(seed, STREAM.key))),
    palette: pickPalette(createRng(deriveSeed(seed, STREAM.palette))),
    width: width * TILE_SIZE,
    height: height * TILE_SIZE,
  };
};

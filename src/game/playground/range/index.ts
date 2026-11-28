import { type Level, TILE_SIZE, tileCenter, type Tile } from '../../level';
import type { Key } from '../../music';
import { PALETTES } from '../../palette';
import { ENEMY_HP, type Enemy } from '../../sim/enemy';
import type { World } from '../../sim/world';

/**
 * The playground's firing range: one open room with the player on the left
 * and a few dummies across from it, so a weapon is heard as it plays in a
 * level - aimed, quantized, landing hits, bursting and reloading - while
 * its knobs turn. Dummies stand still and come back a bar after they fall.
 */

/** In tiles, border walls included: the whole room fits a small window. */
export const RANGE_WIDTH = 15;
export const RANGE_HEIGHT = 11;

/** Where the dummies stand, in tiles. */
export const DUMMY_TILES = [
  { x: 10, y: 3 },
  { x: 11, y: 5 },
  { x: 10, y: 7 },
];

const isBorder = (x: number, y: number) =>
  x === 0 || y === 0 || x === RANGE_WIDTH - 1 || y === RANGE_HEIGHT - 1;

export const rangeLevel = (key: Key): Level => ({
  seed: 1,
  style: 'blocks',
  map: {
    width: RANGE_WIDTH,
    height: RANGE_HEIGHT,
    tiles: Array.from({ length: RANGE_WIDTH * RANGE_HEIGHT }, (_, i): Tile =>
      isBorder(i % RANGE_WIDTH, Math.floor(i / RANGE_WIDTH)) ? 'wall' : 'floor',
    ),
  },
  start: tileCenter({ x: 3, y: 5 }),
  // The circle sits under the dummies' middle one, out of the player's way.
  pad: tileCenter({ x: 7, y: 5 }),
  key,
  palette: PALETTES[0],
  width: RANGE_WIDTH * TILE_SIZE,
  height: RANGE_HEIGHT * TILE_SIZE,
});

/** Ids for dummies: one per spot, so a fallen one comes back as itself. */
const DUMMY_ID = 1_000_000;

const dummy = (spot: number, time: number): Enemy => {
  const at = tileCenter(DUMMY_TILES[spot]);
  return {
    id: DUMMY_ID + spot,
    kind: 'hopper',
    hp: ENEMY_HP,
    from: at,
    to: at,
    hopAt: time,
    hopSeconds: 0,
    spawnAt: time,
    aim: null,
  };
};

/**
 * Stand a dummy back up on each empty spot, appearing at `time`: the next
 * bar line, so it shows its marker as a wave does. Drops are swept away -
 * the range has no loot.
 */
export const restock = (world: World, time: number): World => {
  const standing = new Set(world.enemies.map(enemy => enemy.id));
  const missing = DUMMY_TILES.map((_, spot) => spot).filter(
    spot => !standing.has(DUMMY_ID + spot),
  );
  return {
    ...world,
    enemies: [...world.enemies, ...missing.map(spot => dummy(spot, time))],
    pickups: [],
    hearts: [],
    powerups: [],
  };
};

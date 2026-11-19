import type { Rng } from '../../rng';
import type { Vec } from '../../vec';
import { indexOf, tileCenter, type Tile, type Tilemap } from '../tilemap';

/**
 * A level's cover: a few big blocks to circle around, or scattered pillars
 * and short walls to weave through. One style per level, never mixed.
 */
export type ArenaStyle = 'blocks' | 'scattered';

export const ARENA_STYLES = ['blocks', 'scattered'] satisfies Array<ArenaStyle>;

/** In tiles, border walls included: about twice a laptop screen each way. */
export const ARENA_WIDTH = 37;
export const ARENA_HEIGHT = 25;

const CENTER = { x: (ARENA_WIDTH - 1) / 2, y: (ARENA_HEIGHT - 1) / 2 };
/** The player spawns this many tiles below the pad. */
const START_BELOW = 4;

export interface Arena {
  map: Tilemap;
  /** The trigger circle: it starts the level, and is the exit at the end. */
  pad: Vec;
  start: Vec;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Around the pad and the spawn: kept open so the start reads clearly. */
const CLEAR: Rect = {
  x: CENTER.x - 4,
  y: CENTER.y - 4,
  w: 9,
  h: 9 + START_BELOW - 2,
};

const touches = (a: Rect, b: Rect, gap: number) =>
  a.x - gap < b.x + b.w &&
  b.x - gap < a.x + a.w &&
  a.y - gap < b.y + b.h &&
  b.y - gap < a.y + a.h;

const mirrorX = (rect: Rect): Rect => ({
  ...rect,
  x: ARENA_WIDTH - rect.x - rect.w,
});
const mirrorY = (rect: Rect): Rect => ({
  ...rect,
  y: ARENA_HEIGHT - rect.y - rect.h,
});

/**
 * Place up to `count` pieces, each with its mirror images, wherever they
 * keep `gap` tiles from every other piece and the clear centre. Pieces
 * that never touch can't wall off any floor, so the arena stays one room.
 */
const place = (
  rng: Rng,
  {
    count,
    roll,
    mirror,
    gap,
  }: {
    count: number;
    roll: () => Rect;
    mirror: (rect: Rect) => Array<Rect>;
    gap: number;
  },
): Array<Rect> =>
  Array.from({ length: count * 40 }).reduce<Array<Rect>>(placed => {
    if (placed.length >= count * mirror(CLEAR).length) return placed;
    const copies = mirror(roll());
    const fits = copies.every(
      rect =>
        rect.x >= 2 &&
        rect.y >= 2 &&
        rect.x + rect.w <= ARENA_WIDTH - 2 &&
        rect.y + rect.h <= ARENA_HEIGHT - 2 &&
        !touches(rect, CLEAR, 0) &&
        placed.every(other => !touches(rect, other, gap)),
    );
    // A piece straddling the mirror line would overlap its own copy.
    const distinct = copies.every((rect, i) =>
      copies.every((other, j) => i === j || !touches(rect, other, gap)),
    );
    return fits && distinct ? [...placed, ...copies] : placed;
  }, []);

/** 2-3 mirrored pairs of big blocks: zones to circle around. */
const blocks = (rng: Rng) =>
  place(rng, {
    count: rng.int(2, 3),
    roll: () => {
      const w = rng.int(4, 6);
      const h = rng.int(3, 6);
      // Off the walls, so there's room to run round every side.
      return {
        x: rng.int(5, Math.floor(CENTER.x) - 2 - w),
        y: rng.int(4, ARENA_HEIGHT - 4 - h),
        w,
        h,
      };
    },
    mirror: rect => [rect, mirrorX(rect)],
    gap: 3,
  });

const SCATTER_SHAPES = [
  { w: 1, h: 1 },
  { w: 2, h: 2 },
  { w: 1, h: 3 },
  { w: 3, h: 1 },
  { w: 1, h: 4 },
  { w: 4, h: 1 },
];

/** Pillars and short walls, four-way symmetric: lanes to weave through. */
const scattered = (rng: Rng) =>
  place(rng, {
    count: rng.int(4, 6),
    roll: () => {
      const { w, h } = rng.pick(SCATTER_SHAPES);
      return {
        x: rng.int(2, Math.floor(CENTER.x) - w),
        y: rng.int(2, Math.floor(CENTER.y) - h),
        w,
        h,
      };
    },
    mirror: rect => [
      rect,
      mirrorX(rect),
      mirrorY(rect),
      mirrorX(mirrorY(rect)),
    ],
    gap: 1,
  });

const isBorder = (x: number, y: number) =>
  x === 0 || y === 0 || x === ARENA_WIDTH - 1 || y === ARENA_HEIGHT - 1;

/** One walled room with cover in the given style and the pad at its centre. */
export const buildArena = (rng: Rng, style: ArenaStyle): Arena => {
  const cover = style === 'blocks' ? blocks(rng) : scattered(rng);
  const map: Tilemap = {
    width: ARENA_WIDTH,
    height: ARENA_HEIGHT,
    tiles: Array.from(
      { length: ARENA_WIDTH * ARENA_HEIGHT },
      (): Tile => 'floor',
    ),
  };
  const solid = new Set(
    cover.flatMap(rect =>
      Array.from({ length: rect.w * rect.h }, (_, i) =>
        indexOf(map, {
          x: rect.x + (i % rect.w),
          y: rect.y + Math.floor(i / rect.w),
        }),
      ),
    ),
  );
  const tiles = map.tiles.map((_, i): Tile => {
    const x = i % ARENA_WIDTH;
    const y = Math.floor(i / ARENA_WIDTH);
    return isBorder(x, y) || solid.has(i) ? 'wall' : 'floor';
  });
  return {
    map: { ...map, tiles },
    pad: tileCenter(CENTER),
    start: tileCenter({ x: CENTER.x, y: CENTER.y + START_BELOW }),
  };
};

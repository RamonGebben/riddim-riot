import { rollKey, type Key } from '../../music';
import { pickPalette, type Palette } from '../../palette';
import { createRng, deriveSeed } from '../../rng';
import type { Vec } from '../../vec';
import { ARENA_STYLES, buildArena, type ArenaStyle } from '../arena';
import { TILE_SIZE, type Tilemap } from '../tilemap';

export interface Level {
  seed: number;
  map: Tilemap;
  style: ArenaStyle;
  /** World point the player starts on. */
  start: Vec;
  /** The trigger circle: step in to start, and again to leave. */
  pad: Vec;
  key: Key;
  palette: Palette;
  /** World size in pixels. */
  width: number;
  height: number;
}

/** Separate random streams, so changing one never reshuffles another. */
const STREAM = { layout: 10, key: 11, palette: 12, style: 13 };

/**
 * The whole level from its seed: one arena in a cover style, plus the key
 * and palette the level plays and looks in.
 */
export const generateLevel = (seed: number): Level => {
  const style = createRng(deriveSeed(seed, STREAM.style)).pick(ARENA_STYLES);
  const { map, pad, start } = buildArena(
    createRng(deriveSeed(seed, STREAM.layout)),
    style,
  );
  return {
    seed,
    map,
    style,
    start,
    pad,
    key: rollKey(createRng(deriveSeed(seed, STREAM.key))),
    palette: pickPalette(createRng(deriveSeed(seed, STREAM.palette))),
    width: map.width * TILE_SIZE,
    height: map.height * TILE_SIZE,
  };
};

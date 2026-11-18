import { Graphics } from 'pixi.js';
import type { Bounds } from '../../sim/arena';
import { PALETTE } from '../palette';

const TILE = 64;

/** The floor: a tile grid inside a bright border. Drawn once. */
export const createArenaView = (bounds: Bounds): Graphics => {
  const columns = Array.from(
    { length: Math.floor(bounds.width / TILE) - 1 },
    (_, i) => (i + 1) * TILE,
  );
  const rows = Array.from(
    { length: Math.floor(bounds.height / TILE) - 1 },
    (_, i) => (i + 1) * TILE,
  );

  const view = new Graphics()
    .rect(0, 0, bounds.width, bounds.height)
    .fill(PALETTE.floor);
  columns.forEach(x => view.moveTo(x, 0).lineTo(x, bounds.height));
  rows.forEach(y => view.moveTo(0, y).lineTo(bounds.width, y));
  view.stroke({ width: 1, color: PALETTE.grid });

  return view
    .rect(0, 0, bounds.width, bounds.height)
    .stroke({ width: 4, color: PALETTE.accent });
};

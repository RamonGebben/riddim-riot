import { isWall, TILE_SIZE, tileOf, type Tilemap } from '../../level';
import { add, length, scale, type Vec } from '../../vec';

/** Does a circle overlap any wall tile? */
export const hitsWall = (
  map: Tilemap,
  center: Vec,
  radius: number,
): boolean => {
  const min = tileOf({ x: center.x - radius, y: center.y - radius });
  const max = tileOf({ x: center.x + radius, y: center.y + radius });
  const columns = Array.from(
    { length: max.x - min.x + 1 },
    (_, i) => min.x + i,
  );
  const rows = Array.from({ length: max.y - min.y + 1 }, (_, i) => min.y + i);
  return rows.some(y =>
    columns.some(x => {
      if (!isWall(map, { x, y })) return false;
      // Closest point of the tile to the circle's centre.
      const nearest = {
        x: Math.min(Math.max(center.x, x * TILE_SIZE), (x + 1) * TILE_SIZE),
        y: Math.min(Math.max(center.y, y * TILE_SIZE), (y + 1) * TILE_SIZE),
      };
      return (
        (center.x - nearest.x) ** 2 + (center.y - nearest.y) ** 2 < radius ** 2
      );
    }),
  );
};

/** Small enough that a frame's movement can never tunnel through a tile. */
const SUBSTEP = 4;

/**
 * Move a circle by `delta`, sliding along walls: each sub-step tries each
 * axis on its own, so pushing diagonally into a wall still moves along it.
 */
export const moveCircle = (
  map: Tilemap,
  from: Vec,
  delta: Vec,
  radius: number,
): Vec => {
  const steps = Math.max(1, Math.ceil(length(delta) / SUBSTEP));
  const step = scale(delta, 1 / steps);
  return Array.from({ length: steps }).reduce<Vec>(position => {
    const alongX = add(position, { x: step.x, y: 0 });
    const afterX = hitsWall(map, alongX, radius) ? position : alongX;
    const alongY = add(afterX, { x: 0, y: step.y });
    return hitsWall(map, alongY, radius) ? afterX : alongY;
  }, from);
};

import {
  inBounds,
  indexOf,
  isWall,
  NEIGHBOURS,
  type Tilemap,
  type TilePos,
} from '../tilemap';

/** Walking distance in tiles from `from` to every tile; -1 if unreachable. */
export type DistanceField = Array<number>;

const add = (a: TilePos, b: TilePos): TilePos => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

/**
 * Breadth-first flood from one tile (usually the player's). Enemies walk it
 * downhill, so they find doorways instead of pressing against walls.
 */
export const distanceField = (map: Tilemap, from: TilePos): DistanceField => {
  const field: DistanceField = Array.from(
    { length: map.width * map.height },
    () => -1,
  );
  if (isWall(map, from)) return field;
  field[indexOf(map, from)] = 0;

  // A queue walked by index: the flood touches every tile once.
  const queue: Array<TilePos> = [from];
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    const distance = field[indexOf(map, current)];
    NEIGHBOURS.map(offset => add(current, offset))
      .filter(next => !isWall(map, next) && field[indexOf(map, next)] === -1)
      .forEach(next => {
        field[indexOf(map, next)] = distance + 1;
        queue.push(next);
      });
  }
  return field;
};

export const distanceAt = (
  map: Tilemap,
  field: DistanceField,
  pos: TilePos,
): number => (inBounds(map, pos) ? field[indexOf(map, pos)] : -1);

/**
 * The neighbouring tile one step closer to the field's origin, skipping any
 * in `blocked`; null when there's nowhere closer to go.
 */
export const stepDownhill = (
  map: Tilemap,
  field: DistanceField,
  from: TilePos,
  blocked: (pos: TilePos) => boolean = () => false,
): TilePos | null => {
  const here = distanceAt(map, field, from);
  const closer = NEIGHBOURS.map(offset => add(from, offset))
    .filter(pos => {
      const distance = distanceAt(map, field, pos);
      return distance >= 0 && (here < 0 || distance < here) && !blocked(pos);
    })
    .sort((a, b) => distanceAt(map, field, a) - distanceAt(map, field, b));
  return closer[0] ?? null;
};

/**
 * The way out: the neighbour furthest from the origin, for enemies running
 * from the player. Null when nothing is further, or every way is blocked.
 */
export const stepUphill = (
  map: Tilemap,
  field: DistanceField,
  from: TilePos,
  blocked: (pos: TilePos) => boolean = () => false,
): TilePos | null => {
  const here = distanceAt(map, field, from);
  if (here < 0) return null;
  const further = NEIGHBOURS.map(offset => add(from, offset))
    .filter(pos => distanceAt(map, field, pos) > here && !blocked(pos))
    .sort((a, b) => distanceAt(map, field, b) - distanceAt(map, field, a));
  return further[0] ?? null;
};

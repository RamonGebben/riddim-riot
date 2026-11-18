import type { Vec } from '../../vec';

/** World pixels per tile - and the distance an enemy hops per beat. */
export const TILE_SIZE = 64;

export type Tile = 'floor' | 'wall';

export interface Tilemap {
  /** In tiles. */
  width: number;
  height: number;
  /** Row by row, `width * height` long. */
  tiles: Array<Tile>;
}

export interface TilePos {
  x: number;
  y: number;
}

export const indexOf = (map: Tilemap, { x, y }: TilePos): number =>
  y * map.width + x;

export const inBounds = (map: Tilemap, { x, y }: TilePos): boolean =>
  x >= 0 && y >= 0 && x < map.width && y < map.height;

/** Outside the map counts as wall, so nothing ever leaves it. */
export const isWall = (map: Tilemap, pos: TilePos): boolean =>
  !inBounds(map, pos) || map.tiles[indexOf(map, pos)] === 'wall';

export const tileOf = (point: Vec): TilePos => ({
  x: Math.floor(point.x / TILE_SIZE),
  y: Math.floor(point.y / TILE_SIZE),
});

export const tileCenter = ({ x, y }: TilePos): Vec => ({
  x: (x + 0.5) * TILE_SIZE,
  y: (y + 0.5) * TILE_SIZE,
});

export const NEIGHBOURS: Array<TilePos> = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

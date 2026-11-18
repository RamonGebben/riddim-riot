import type { Rng } from '../../rng';
import type { Side } from '../rooms';

export interface RoomPos {
  col: number;
  row: number;
}

export interface RoomGrid {
  cols: number;
  rows: number;
  /** The main path, start room first, exit room last. */
  path: Array<RoomPos>;
  /** Open sides per room, keyed by `roomKey`. */
  openings: Map<string, Set<Side>>;
}

export const roomKey = ({ col, row }: RoomPos): string => `${col},${row}`;

const OPPOSITE = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
} satisfies Record<Side, Side>;

const sideTowards = (from: RoomPos, to: RoomPos): Side => {
  if (to.row > from.row) return 'south';
  if (to.row < from.row) return 'north';
  return to.col > from.col ? 'east' : 'west';
};

const link = (
  openings: Map<string, Set<Side>>,
  from: RoomPos,
  to: RoomPos,
): Map<string, Set<Side>> => {
  const side = sideTowards(from, to);
  const add = (pos: RoomPos, open: Side) =>
    new Set([...(openings.get(roomKey(pos)) ?? []), open]);
  return new Map([
    ...openings,
    [roomKey(from), add(from, side)],
    [roomKey(to), add(to, OPPOSITE[side])],
  ]);
};

/** Chance the walk drops a row instead of carrying on sideways. */
const DROP_CHANCE = 0.3;

/**
 * Spelunky's main path: start in a random top-row room, wander sideways,
 * drop a row at random or at an edge, and end where it drops off the
 * bottom - so start and exit are always connected.
 */
const walkMainPath = (rng: Rng, cols: number, rows: number) => {
  const start = { col: rng.int(0, cols - 1), row: 0 };

  const step = (path: Array<RoomPos>, direction: 1 | -1): Array<RoomPos> => {
    const current = path[path.length - 1];
    const sideways = { col: current.col + direction, row: current.row };
    const blocked = sideways.col < 0 || sideways.col >= cols;
    if (!blocked && !rng.chance(DROP_CHANCE)) {
      return step([...path, sideways], direction);
    }
    if (current.row === rows - 1) return path;
    const below = { col: current.col, row: current.row + 1 };
    return step([...path, below], rng.pick([1, -1] as const));
  };

  return step([start], rng.pick([1, -1] as const));
};

const neighboursOf = ({ col, row }: RoomPos, cols: number, rows: number) =>
  [
    { col: col + 1, row },
    { col: col - 1, row },
    { col, row: row + 1 },
    { col, row: row - 1 },
  ].filter(
    pos => pos.col >= 0 && pos.row >= 0 && pos.col < cols && pos.row < rows,
  );

/**
 * Side rooms join after the path: each links to one already-connected
 * neighbour, until every room can be walked to.
 */
const connectSideRooms = (
  rng: Rng,
  grid: Omit<RoomGrid, 'openings'>,
  openings: Map<string, Set<Side>>,
): Map<string, Set<Side>> => {
  const all = Array.from({ length: grid.cols * grid.rows }, (_, i) => ({
    col: i % grid.cols,
    row: Math.floor(i / grid.cols),
  }));
  const connect = (
    current: Map<string, Set<Side>>,
    connected: Set<string>,
  ): Map<string, Set<Side>> => {
    const loose = all.filter(pos => !connected.has(roomKey(pos)));
    const joinable = loose.filter(pos =>
      neighboursOf(pos, grid.cols, grid.rows).some(n =>
        connected.has(roomKey(n)),
      ),
    );
    if (joinable.length === 0) return current;
    const room = rng.pick(joinable);
    const anchor = rng.pick(
      neighboursOf(room, grid.cols, grid.rows).filter(n =>
        connected.has(roomKey(n)),
      ),
    );
    return connect(
      link(current, anchor, room),
      new Set([...connected, roomKey(room)]),
    );
  };
  return connect(openings, new Set(grid.path.map(roomKey)));
};

export const planRoomGrid = (
  rng: Rng,
  { cols, rows }: { cols: number; rows: number },
): RoomGrid => {
  const path = walkMainPath(rng, cols, rows);
  const onPath = path
    .slice(1)
    .reduce(
      (openings, room, i) => link(openings, path[i], room),
      new Map<string, Set<Side>>(),
    );
  return {
    cols,
    rows,
    path,
    openings: connectSideRooms(rng, { cols, rows, path }, onPath),
  };
};

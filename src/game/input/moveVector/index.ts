import { normalize, type Vec } from '../../vec';

const DIRECTIONS: Record<string, Vec> = {
  KeyW: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

export const isMoveKey = (code: string): boolean => code in DIRECTIONS;

/**
 * The left stick from held keys (`KeyboardEvent.code`, so it works on any
 * layout): unit length, so diagonals aren't faster.
 */
export const moveVector = (held: ReadonlySet<string>): Vec =>
  normalize(
    [...held]
      .filter(isMoveKey)
      .map(code => DIRECTIONS[code])
      .reduce((sum, dir) => ({ x: sum.x + dir.x, y: sum.y + dir.y }), {
        x: 0,
        y: 0,
      }),
  );

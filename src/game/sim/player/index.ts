import { add, angleOf, lerp, scale, subtract, ZERO, type Vec } from '../../vec';
import type { Bounds } from '../arena';

export interface Player {
  position: Vec;
  velocity: Vec;
  /** Radians, towards the cursor. */
  aim: number;
}

export interface PlayerInput {
  /** Unit-length (or zero) move direction. */
  move: Vec;
  /** The world point the cursor is over. */
  aimAt: Vec;
}

export const PLAYER_RADIUS = 18;
const SPEED = 340;
/** How quickly velocity catches up with the stick; higher is snappier. */
const RESPONSE = 18;

export const spawnPlayer = (bounds: Bounds): Player => ({
  position: { x: bounds.width / 2, y: bounds.height / 2 },
  velocity: ZERO,
  aim: 0,
});

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const keepInside = (position: Vec, bounds: Bounds): Vec => ({
  x: clamp(position.x, PLAYER_RADIUS, bounds.width - PLAYER_RADIUS),
  y: clamp(position.y, PLAYER_RADIUS, bounds.height - PLAYER_RADIUS),
});

/** Advance the player by `dt` seconds. Frame-rate independent. */
export const stepPlayer = (
  player: Player,
  input: PlayerInput,
  dt: number,
  bounds: Bounds,
): Player => {
  const target = scale(input.move, SPEED);
  const velocity = lerp(player.velocity, target, 1 - Math.exp(-RESPONSE * dt));
  const position = keepInside(
    add(player.position, scale(velocity, dt)),
    bounds,
  );
  const toCursor = subtract(input.aimAt, position);
  const aim =
    toCursor.x === 0 && toCursor.y === 0 ? player.aim : angleOf(toCursor);
  return { position, velocity, aim };
};

import type { Tilemap } from '../../level';
import { angleOf, lerp, scale, subtract, ZERO, type Vec } from '../../vec';
import { moveCircle } from '../collision';

export interface Player {
  position: Vec;
  velocity: Vec;
  /** Radians, towards the cursor. */
  aim: number;
}

export interface PlayerInput {
  /** Move direction, at most unit length (a touch stick short of its rim is slower). */
  move: Vec;
  /** The world point the cursor is over. */
  aimAt: Vec;
}

export const PLAYER_RADIUS = 18;
const SPEED = 420;
/** How quickly velocity catches up with the stick; higher is snappier. */
const RESPONSE = 18;

export const spawnPlayer = (position: Vec): Player => ({
  position,
  velocity: ZERO,
  aim: 0,
});

/** Advance the player by `dt` seconds, sliding along walls. Frame-rate independent. */
export const stepPlayer = (
  player: Player,
  input: PlayerInput,
  dt: number,
  map: Tilemap,
): Player => {
  const target = scale(input.move, SPEED);
  const velocity = lerp(player.velocity, target, 1 - Math.exp(-RESPONSE * dt));
  const position = moveCircle(
    map,
    player.position,
    scale(velocity, dt),
    PLAYER_RADIUS,
  );
  const toCursor = subtract(input.aimAt, position);
  const aim =
    toCursor.x === 0 && toCursor.y === 0 ? player.aim : angleOf(toCursor);
  return { position, velocity, aim };
};

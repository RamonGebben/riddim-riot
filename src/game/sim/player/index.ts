import type { Tilemap } from '../../level';
import {
  angleOf,
  length,
  lerp,
  normalize,
  scale,
  subtract,
  ZERO,
  type Vec,
} from '../../vec';
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
  /** Dash pressed this frame (Space, or the touch screen's button). */
  dash?: boolean;
}

/**
 * A dash: a short burst along the stick (or the aim, standing still) that
 * passes through enemies and orbs untouched. Its cooldown is counted in
 * beats, so it comes back in time with the music.
 */
export const DASH = { speed: 1500, seconds: 0.14, cooldownBeats: 2 };

/** Which way a dash goes: where the player is pushing, else where they aim. */
export const dashDirection = (player: Player, input: PlayerInput): Vec =>
  length(input.move) > 0.1
    ? normalize(input.move)
    : { x: Math.cos(player.aim), y: Math.sin(player.aim) };

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
  /** Dashing: this way, at dash speed, whatever the stick says. */
  dashing: Vec | null = null,
): Player => {
  const target = scale(input.move, SPEED);
  const velocity = dashing
    ? scale(dashing, DASH.speed)
    : lerp(player.velocity, target, 1 - Math.exp(-RESPONSE * dt));
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

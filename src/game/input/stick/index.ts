import {
  add,
  length,
  normalize,
  scale,
  subtract,
  ZERO,
  type Vec,
} from '../../vec';

/** A floating touch stick: where the thumb landed and where it is now. */
export interface Stick {
  origin: Vec;
  knob: Vec;
}

/** Rims in CSS pixels from the stick's centre. */
export const STICK_RIMS = {
  /** Inside this, the stick only turns the player. */
  inner: 26,
  /** At this, the player moves at full speed; past it the ring follows. */
  outer: 72,
};
/** Smaller than this is a resting thumb, not a direction. */
const DEAD_ZONE = 6;

export const startStick = (at: Vec): Stick => ({ origin: at, knob: at });

/** Move the knob; dragged past the outer rim, the whole ring comes along. */
export const dragStick = ({ origin }: Stick, to: Vec): Stick => {
  const offset = subtract(to, origin);
  const over = length(offset) - STICK_RIMS.outer;
  if (over <= 0) return { origin, knob: to };
  return { origin: add(origin, scale(normalize(offset), over)), knob: to };
};

/**
 * Inside the inner rim the stick aims without moving; past it the player
 * moves that way too, from standing at the inner rim to full speed at the
 * outer. `aim` is null while the thumb rests, so the facing holds.
 */
export const readStick = ({
  origin,
  knob,
}: Stick): { move: Vec; aim: Vec | null } => {
  const offset = subtract(knob, origin);
  const distance = length(offset);
  if (distance < DEAD_ZONE) return { move: ZERO, aim: null };
  const aim = normalize(offset);
  const { inner, outer } = STICK_RIMS;
  if (distance <= inner) return { move: ZERO, aim };
  const speed = Math.min(1, (distance - inner) / (outer - inner));
  return { move: scale(aim, speed), aim };
};

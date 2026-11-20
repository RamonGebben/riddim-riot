import type { Frame } from '../stage';

/** How much of the kick, shot and hit pulses a calm frame keeps. */
const KEPT = { kick: 0.25, shot: 0.25, hit: 0.3 };

/**
 * A frame with the flashing taken out, for players who reduce it: no shake,
 * no drop flash, and the kick, shot and hit pulses turned well down. The hit
 * keeps a faint tint, so a hit still reads.
 */
export const calmFrame = (frame: Frame): Frame => ({
  ...frame,
  shake: { x: 0, y: 0 },
  kick: frame.kick * KEPT.kick,
  shot: frame.shot * KEPT.shot,
  hit: frame.hit * KEPT.hit,
  drop: 0,
});

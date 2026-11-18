import { STEPS_PER_BEAT } from '../position';

/** How long one 1/16 step lasts at `bpm`. */
export const secondsPerStep = (bpm: number): number =>
  60 / bpm / STEPS_PER_BEAT;

/**
 * The first 1/16 slot that's still at least `margin` seconds away, on the grid
 * anchored at a known step's time (the last tick). It may be a step the clock
 * has already ticked: its audio is still ahead, so it can be scheduled.
 */
export const nextGridTime = ({
  now,
  anchor,
  stepSeconds,
  margin = 0.01,
}: {
  now: number;
  anchor: number;
  stepSeconds: number;
  margin?: number;
}): number => {
  const steps = Math.ceil((now + margin - anchor) / stepSeconds);
  return anchor + steps * stepSeconds;
};

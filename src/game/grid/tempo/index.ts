import { STEPS_PER_BEAT } from '../position';

/** How long one 1/16 step lasts at `bpm`. */
export const secondsPerStep = (bpm: number): number =>
  60 / bpm / STEPS_PER_BEAT;

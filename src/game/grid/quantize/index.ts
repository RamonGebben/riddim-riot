import { STEPS_PER_BAR, STEPS_PER_BEAT } from '../position';

export type Division = '1/1' | '1/2' | '1/4' | '1/8' | '1/16';

export const STEPS_PER_DIVISION = {
  '1/1': STEPS_PER_BAR,
  '1/2': STEPS_PER_BAR / 2,
  '1/4': STEPS_PER_BEAT,
  '1/8': STEPS_PER_BEAT / 2,
  '1/16': 1,
} satisfies Record<Division, number>;

export const isOnGrid = (step: number, division: Division): boolean =>
  step % STEPS_PER_DIVISION[division] === 0;

/** The first step on `division`'s grid at or after `step`. */
export const nextSlot = (step: number, division: Division): number => {
  const size = STEPS_PER_DIVISION[division];
  return Math.ceil(step / size) * size;
};

/** Cooldowns and reloads are counted in beats, so they stay in time at any BPM. */
export const beatsToSteps = (beats: number): number =>
  Math.round(beats * STEPS_PER_BEAT);

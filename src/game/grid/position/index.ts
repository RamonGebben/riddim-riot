export const STEPS_PER_BEAT = 4;
export const BEATS_PER_BAR = 4;
export const STEPS_PER_BAR = STEPS_PER_BEAT * BEATS_PER_BAR;

/** Where a 1/16 step falls in the bar. Everything is zero-based. */
export interface Position {
  bar: number;
  beat: number;
  /** The 1/16 within the beat, 0-3. */
  sixteenth: number;
  /** The 1/16 within the bar, 0-15. */
  stepInBar: number;
}

export const toPosition = (step: number): Position => {
  const stepInBar = step % STEPS_PER_BAR;
  return {
    bar: Math.floor(step / STEPS_PER_BAR),
    beat: Math.floor(stepInBar / STEPS_PER_BEAT),
    sixteenth: stepInBar % STEPS_PER_BEAT,
    stepInBar,
  };
};

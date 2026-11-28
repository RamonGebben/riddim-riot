/** A knob's range: where its value can go and the steps it moves in. */
export interface KnobRange {
  min: number;
  max: number;
  step: number;
  /** Turn on a log scale, as frequencies are heard; needs `min > 0`. */
  log?: boolean;
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/** How far round the knob `value` sits, 0 at the bottom to 1 at the top. */
export const toPosition = (value: number, range: KnobRange): number => {
  const { min, max, log } = range;
  if (max === min) return 0;
  if (log && min > 0) {
    return clamp01(Math.log(value / min) / Math.log(max / min));
  }
  return clamp01((value - min) / (max - min));
};

/** Snap to the range's steps (counted from its min) and keep within it. */
export const snap = (value: number, { min, max, step }: KnobRange): number => {
  const stepped = min + Math.round((value - min) / step) * step;
  // Rounded to the step's decimals, so 0.1 steps don't read 0.30000000004.
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  const rounded = Number(stepped.toFixed(Math.min(decimals, 10)));
  return Math.min(Math.max(rounded, min), max);
};

/** The value at `position` round the knob, snapped to its steps. */
export const fromPosition = (position: number, range: KnobRange): number => {
  const { min, max, log } = range;
  const at = clamp01(position);
  const raw = log && min > 0 ? min * (max / min) ** at : min + (max - min) * at;
  return snap(raw, range);
};

/**
 * One nudge from the keyboard or the wheel: a hundredth of the way round,
 * or a single step when that's bigger (or when `fine`), so a knob of a few
 * whole values still moves on every press.
 */
export const nudge = (
  value: number,
  range: KnobRange,
  direction: 1 | -1,
  { fine = false, coarse = false } = {},
): number => {
  const byStep = snap(value + direction * range.step, range);
  if (fine) return byStep;
  const share = coarse ? 0.1 : 0.01;
  const moved = fromPosition(
    toPosition(value, range) + direction * share,
    range,
  );
  // Whichever goes further, so a coarse step never gets stuck on rounding.
  return direction > 0 ? Math.max(moved, byStep) : Math.min(moved, byStep);
};

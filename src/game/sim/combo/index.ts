/** Kills on consecutive beats chain into a combo that multiplies points. */
export interface Combo {
  count: number;
  /** The beat of the latest kill in the chain. */
  lastBeat: number;
}

export const NO_COMBO: Combo = { count: 0, lastBeat: -Infinity };

export const POINTS_PER_KILL = 100;
export const MAX_MULTIPLIER = 8;

/** Still alive on `beat`: a kill this beat or the next keeps it going. */
export const comboActive = (combo: Combo, beat: number): boolean =>
  combo.count > 0 && beat <= combo.lastBeat + 1;

export const registerKill = (
  combo: Combo,
  beat: number,
): { combo: Combo; points: number } => {
  const count = comboActive(combo, beat) ? combo.count + 1 : 1;
  return {
    combo: { count, lastBeat: beat },
    points: POINTS_PER_KILL * Math.min(count, MAX_MULTIPLIER),
  };
};

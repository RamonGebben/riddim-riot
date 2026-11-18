export type ScaleName = 'minor' | 'phrygian';

/** Semitones above the root for each degree. */
export const SCALES = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
} satisfies Record<ScaleName, Array<number>>;

export interface Key {
  /** Pitch class of the root: 0 = C, 5 = F. */
  root: number;
  scale: ScaleName;
}

/** Fixed until the level seed picks key and scale. */
export const F_MINOR: Key = { root: 5, scale: 'minor' };

/**
 * The MIDI note for a scale degree in `octave` (scientific: F2 = 41). Degrees
 * past the scale wrap into the next octave, negative ones into the one below,
 * so anything built from degrees is in key by construction.
 */
export const degreeToMidi = (
  key: Key,
  degree: number,
  octave: number,
): number => {
  const steps = SCALES[key.scale];
  const wraps = Math.floor(degree / steps.length);
  const index = degree - wraps * steps.length;
  return 12 * (octave + 1 + wraps) + key.root + steps[index];
};

export const midiToHz = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

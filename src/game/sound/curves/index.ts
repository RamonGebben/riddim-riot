/**
 * The shapes the playground draws: what a filter does across the spectrum,
 * an envelope over time, an LFO's sweep and a pitch drop. Pure maths over
 * the sound design's numbers, so a curve on screen is the voice's own
 * shape, not an illustration of it.
 */

export interface Point {
  x: number;
  y: number;
}

/** The audible band the spectrum views span, in Hz. */
export const SPECTRUM = { min: 20, max: 20_000 } as const;

/** Where `hz` sits across the spectrum, 0 at the bottom to 1 at the top. */
export const hzToX = (hz: number): number =>
  Math.log(hz / SPECTRUM.min) / Math.log(SPECTRUM.max / SPECTRUM.min);

/** The frequency at `x` across the spectrum (`hzToX`'s inverse). */
export const xToHz = (x: number): number =>
  SPECTRUM.min * (SPECTRUM.max / SPECTRUM.min) ** x;

export type FilterKind = 'lowpass' | 'highpass' | 'bandpass';

export interface FilterShape {
  kind: FilterKind;
  hz: number;
  /** The biquad's Q. */
  q: number;
  /** dB per octave: each -12 is one more biquad in the cascade. */
  rolloff?: number;
}

const SAMPLE_RATE = 48_000;

/**
 * A biquad's gain at `hz` in dB, from the Audio EQ Cookbook's coefficients
 * - the ones the Web Audio `BiquadFilterNode` uses - cascaded as the voices
 * cascade them.
 */
export const filterGainDb = (
  { kind, hz: cutoff, q, rolloff = -12 }: FilterShape,
  hz: number,
): number => {
  const w0 =
    (2 * Math.PI * Math.min(cutoff, SAMPLE_RATE / 2 - 1)) / SAMPLE_RATE;
  const alpha = Math.sin(w0) / (2 * Math.max(q, 0.0001));
  const cos = Math.cos(w0);
  const b =
    kind === 'lowpass'
      ? [(1 - cos) / 2, 1 - cos, (1 - cos) / 2]
      : kind === 'highpass'
        ? [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2]
        : [alpha, 0, -alpha];
  const a = [1 + alpha, -2 * cos, 1 - alpha];
  const w = (2 * Math.PI * hz) / SAMPLE_RATE;
  // |B(e^jw)| / |A(e^jw)|, with e^-jwn as (cos nw, -sin nw).
  const magnitude = (c: Array<number>) => {
    const re = c[0] + c[1] * Math.cos(w) + c[2] * Math.cos(2 * w);
    const im = -(c[1] * Math.sin(w) + c[2] * Math.sin(2 * w));
    return Math.hypot(re, im);
  };
  const stage = 20 * Math.log10(magnitude(b) / magnitude(a));
  const stages = Math.max(1, Math.round(-rolloff / 12));
  return stage * stages;
};

/** The filter's response across the spectrum, `count` points from 20 Hz up. */
export const filterResponse = (
  shape: FilterShape,
  count = 160,
): Array<{ hz: number; db: number }> =>
  Array.from({ length: count }, (_, i) => {
    const hz = xToHz(i / (count - 1));
    return { hz, db: filterGainDb(shape, hz) };
  });

export interface EnvelopeShape {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

/**
 * Tone's envelope as the gate plays it - a linear attack, exponential decay
 * and release - held for `hold` seconds after the attack, as level (0-1)
 * against seconds. The exponential segments approach their target with a
 * time constant of a third of their length, as Tone's do.
 */
export const envelopePoints = (
  { attack, decay, sustain, release }: EnvelopeShape,
  hold: number,
  perSegment = 24,
): Array<Point> => {
  const approach = (
    from: number,
    to: number,
    start: number,
    length: number,
  ): Array<Point> =>
    Array.from({ length: perSegment }, (_, i) => {
      const t = ((i + 1) / perSegment) * length;
      const settled = length > 0 ? 1 - Math.exp((-3 * t) / length) : 1;
      return { x: start + t, y: from + (to - from) * settled };
    });
  const decayEnd = attack + decay;
  const releaseAt = Math.max(hold, decayEnd);
  const decaying = approach(1, sustain, attack, decay);
  const held = decaying.at(-1)?.y ?? sustain;
  return [
    { x: 0, y: 0 },
    { x: attack, y: 1 },
    ...decaying,
    { x: releaseAt, y: held },
    ...approach(held, 0, releaseAt, release),
  ];
};

/** A one-shot's level falling away over `decay` seconds. */
export const decayPoints = (decay: number, count = 32): Array<Point> =>
  Array.from({ length: count }, (_, i) => {
    const x = (i / (count - 1)) * decay;
    return { x, y: Math.exp((-3 * x) / Math.max(decay, 0.0001)) };
  });

export interface SweepShape {
  /** Hz the sweep bottoms out at and tops out at. */
  min: number;
  max: number;
  /** Start phase in degrees: 270 starts at the bottom. */
  phase: number;
  /** How many LFO cycles to draw. */
  cycles: number;
}

/**
 * The LFO's sine between `min` and `max` Hz, from each shot's start, as Hz
 * against cycles. It's linear in Hz, as the voice drives the cutoff.
 */
export const sweepPoints = (
  { min, max, phase, cycles }: SweepShape,
  count = 96,
): Array<{ cycle: number; hz: number }> =>
  Array.from({ length: count }, (_, i) => {
    const cycle = (i / (count - 1)) * cycles;
    const angle = (phase / 360 + cycle) * 2 * Math.PI;
    return { cycle, hz: (min + max) / 2 + ((max - min) / 2) * Math.sin(angle) };
  });

/**
 * A pitch falling from `multiple` times the note onto it over `seconds` (an
 * exponential ramp), as the multiple against seconds, drawn to `total`.
 */
export const dropPoints = (
  multiple: number,
  seconds: number,
  total: number,
  count = 32,
): Array<Point> =>
  Array.from({ length: count }, (_, i) => {
    const x = (i / (count - 1)) * total;
    const t = Math.min(x / Math.max(seconds, 0.0001), 1);
    return { x, y: multiple ** (1 - t) };
  });

const dbToGain = (db: number) => 10 ** (db / 20);
const gainToDb = (gain: number) => 20 * Math.log10(Math.max(gain, 1e-6));

/**
 * The kick's duck: down by `depthDb` at once, its gain ramping back up
 * linearly over `seconds` as the music bus does it, as dB against seconds
 * across one beat.
 */
export const pumpPoints = (
  depthDb: number,
  seconds: number,
  beatSeconds: number,
  count = 32,
): Array<Point> => {
  const floor = dbToGain(depthDb);
  return Array.from({ length: count }, (_, i) => {
    const x = (i / (count - 1)) * beatSeconds;
    const back = Math.min(x / Math.max(seconds, 0.0001), 1);
    return { x, y: gainToDb(floor + (1 - floor) * back) };
  });
};

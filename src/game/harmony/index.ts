import { degreeToMidi, SCALES, type Key } from '../music';
import { createRng, deriveSeed } from '../rng';

/**
 * A level's harmony, from its seed: a chord progression picked from proven
 * dark ones and varied, voiced so each chord moves as little as possible
 * from the last, plus the seeded patterns the backing layers play over it.
 * Everything is in scale degrees, so it's in key by construction, and no
 * chord is ever diminished in the key's scale.
 */

/** One chord: its root as a scale degree (0 = i), held for `bars`. */
export interface Chord {
  degree: number;
  bars: number;
}

export interface Progression {
  chords: Array<Chord>;
  /** The whole loop's length in bars. */
  bars: number;
}

/**
 * Four-chord loops that work in a dark minor key (0-based degrees: 0 = i,
 * 2 = III, 3 = iv, 4 = v, 5 = VI, 6 = VII, 1 = II). Every one starts home.
 */
export const TEMPLATES: Array<Array<number>> = [
  [0, 5, 2, 6],
  [0, 3, 5, 4],
  [0, 5, 3, 4],
  [0, 6, 5, 6],
  [0, 5, 6, 0],
  [0, 3, 6, 2],
  [0, 2, 5, 6],
  [0, 6, 3, 5],
  [0, 5, 0, 6],
  [0, 3, 0, 5],
  [0, 1, 0, 6],
  [0, 4, 5, 3],
];

/** Chords that can stand in for one another without leaving the mood. */
const SUBSTITUTES: Record<number, Array<number>> = {
  1: [6, 3],
  2: [5, 6],
  3: [5, 1],
  4: [6, 3],
  5: [3, 2],
  6: [4, 2],
};

/** Safe for any key: iv and VI are major or minor in both our scales. */
const FALLBACKS = [5, 3, 6];

const HARMONY_STREAM = 50;

/** Semitones from the chord's root up to its fifth, in `key`'s scale. */
const fifthOf = (key: Key, degree: number) => {
  const steps = SCALES[key.scale];
  const root = steps[degree % 7];
  return (steps[(degree + 4) % 7] - root + 12) % 12;
};

/** A diminished triad (flat fifth) sounds wrong in this music: never used. */
export const isStable = (key: Key, degree: number): boolean =>
  fifthOf(key, degree) === 7;

const stable = (key: Key, degree: number, previous: number) => {
  if (isStable(key, degree)) return degree;
  return FALLBACKS.find(
    fallback => fallback !== previous && isStable(key, fallback),
  )!;
};

/**
 * The level's progression: a template, maybe one chord swapped for a
 * neighbour, made stable in the key, then either one chord a bar (4 bars),
 * two bars each (8), or 4 bars played twice with a turnaround on the end.
 */
export const progressionFor = (seed: number, key: Key): Progression => {
  const rng = createRng(deriveSeed(seed, HARMONY_STREAM));
  const template = rng.pick(TEMPLATES);
  const swapAt = rng.chance(0.4) ? rng.int(1, template.length - 1) : -1;
  const substituted = template.map((degree, i) =>
    i === swapAt ? rng.pick(SUBSTITUTES[degree] ?? [degree]) : degree,
  );
  const degrees = substituted.reduce<Array<number>>(
    (acc, degree, i) => [...acc, stable(key, degree, acc[i - 1] ?? 0)],
    [],
  );
  const shape = rng.pick(['bar', 'double', 'turnaround'] as const);
  if (shape === 'double') {
    return { chords: degrees.map(degree => ({ degree, bars: 2 })), bars: 8 };
  }
  if (shape === 'turnaround') {
    // The second time round, the last chord leans back home.
    const turn = [6, 4, 5].find(
      degree => degree !== degrees[3] && isStable(key, degree),
    )!;
    const loop = [...degrees, ...degrees.slice(0, 3), turn];
    return { chords: loop.map(degree => ({ degree, bars: 1 })), bars: 8 };
  }
  return { chords: degrees.map(degree => ({ degree, bars: 1 })), bars: 4 };
};

/** The chord playing `bar` bars into the progression, looping. */
export const chordAt = (progression: Progression, bar: number): Chord => {
  const into = ((bar % progression.bars) + progression.bars) % progression.bars;
  const { found } = progression.chords.reduce<{
    found: Chord | null;
    start: number;
  }>(
    (acc, chord) =>
      acc.found || into >= acc.start + chord.bars
        ? { ...acc, start: acc.start + chord.bars }
        : { found: chord, start: acc.start + chord.bars },
    { found: null, start: 0 },
  );
  return found ?? progression.chords[0];
};

/**
 * Diatonic steps to move a line onto a chord: the shortest way to its root,
 * so a riff or hook follows the harmony without leaping registers.
 */
export const shiftFor = (degree: number): number =>
  degree <= 3 ? degree : degree - 7;

/**
 * A MIDI note in `key` moved `steps` scale degrees: a riff played on
 * another chord keeps its shape and stays in key.
 */
export const transposeInKey = (
  key: Key,
  midi: number,
  steps: number,
): number => {
  if (steps === 0) return midi;
  const scale = SCALES[key.scale];
  const fromRoot = midi - key.root;
  const octave = Math.floor(fromRoot / 12);
  const pitch = fromRoot - octave * 12;
  const index = scale.indexOf(pitch);
  // Out of key (shouldn't happen): leave it be rather than guess.
  if (index < 0) return midi;
  return degreeToMidi(key, index + steps, octave - 1);
};

/**
 * Each chord of the progression as MIDI notes, every chord voiced in the
 * inversion closest to the one before, so the pad glides instead of jumps.
 * `shape` is the chord's degrees above its root (0, 2, 4 a triad; 6 adds
 * the seventh), around `octave`.
 */
export const voiceProgression = (
  key: Key,
  progression: Progression,
  { shape, octave }: { shape: Array<number>; octave: number },
): Array<Array<number>> => {
  const centre = degreeToMidi(key, 0, octave) + 5;
  const voicings = (degree: number) =>
    shape.map((_, inversion) =>
      shape
        .map((step, i) => {
          const note = degreeToMidi(key, degree + step, octave);
          // Rotate: the lowest `inversion` tones go up an octave.
          return i < inversion ? note + 12 : note;
        })
        .sort((a, b) => a - b),
    );
  const spread = (notes: Array<number>, from: Array<number> | null) =>
    from
      ? notes.reduce((sum, note, i) => sum + Math.abs(note - from[i]), 0)
      : Math.abs(notes.reduce((a, b) => a + b, 0) / notes.length - centre);
  return progression.chords.reduce<Array<Array<number>>>((acc, chord) => {
    const previous = acc[acc.length - 1] ?? null;
    const options = voicings(chord.degree).flatMap(notes => [
      notes,
      notes.map(note => note - 12),
    ]);
    const best = options.reduce((a, b) =>
      spread(b, previous) < spread(a, previous) ? b : a,
    );
    return [...acc, best];
  }, []);
};

/** One note of a pattern: on a 1/16 step of the bar, for some steps. */
export interface PatternNote {
  step: number;
  steps: number;
  /** Scale degrees above the chord's root. */
  degree: number;
}

/**
 * A two-bar lead hook on 1/8s: chord tones on the strong 8ths, scale steps
 * between, a rest or two for breath. The second bar answers the first.
 * Played over each chord from its root, so it follows the harmony.
 */
export const leadFor = (seed: number): Array<Array<PatternNote>> => {
  const rng = createRng(deriveSeed(seed, HARMONY_STREAM, 1));
  const bar = (answer: Array<PatternNote> | null): Array<PatternNote> => {
    const onsets = Array.from(
      { length: 8 },
      (_, slot) => slot === 0 || rng.chance(slot % 2 === 0 ? 0.7 : 0.4),
    );
    const slots = onsets.flatMap((on, slot) => (on ? [slot] : []));
    return slots.map((slot, i) => {
      const next = slots[i + 1] ?? 8;
      const strong = slot % 2 === 0;
      const degree = strong
        ? rng.pick([0, 2, 4, 7])
        : rng.pick([1, 3, 5, 6, 8]);
      // The answer ends somewhere new: a fifth or the octave.
      const last = answer && i === slots.length - 1;
      return {
        step: slot * 2,
        steps: Math.max((next - slot) * 2 - 1, 1),
        degree: last ? rng.pick([4, 7]) : degree,
      };
    });
  };
  const call = bar(null);
  return [call, bar(call)];
};

export type ArpOrder = 'up' | 'down' | 'bounce' | 'skip';

/** The arpeggio's order and rate: one note per `steps` 1/16s. */
export const arpFor = (seed: number): { order: ArpOrder; steps: 1 | 2 } => {
  const rng = createRng(deriveSeed(seed, HARMONY_STREAM, 2));
  return {
    order: rng.pick<ArpOrder>(['up', 'down', 'bounce', 'skip']),
    steps: rng.chance(0.6) ? 1 : 2,
  };
};

/** Which chord note an arpeggio plays at its `n`th note. */
export const arpIndex = (order: ArpOrder, n: number, size: number): number => {
  if (order === 'up') return n % size;
  if (order === 'down') return size - 1 - (n % size);
  if (order === 'skip') return (n * 2 + Math.floor((n * 2) / size)) % size;
  const cycle = Math.max(size * 2 - 2, 1);
  const at = n % cycle;
  return at < size ? at : cycle - at;
};

/** Offbeat stab rhythms in 1/16 steps: always between the kick and snare. */
const STABS: Array<Array<number>> = [
  [2, 6, 10, 14],
  [3, 6, 11, 14],
  [2, 10],
  [6, 14, 15],
  [2, 7, 10, 15],
];

export const stabsFor = (seed: number): Array<number> =>
  createRng(deriveSeed(seed, HARMONY_STREAM, 3)).pick(STABS);

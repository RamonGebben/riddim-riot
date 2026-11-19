import { describe, expect, it } from 'vitest';
import { F_MINOR, SCALES, type Key } from '../music';
import {
  arpIndex,
  chordAt,
  isStable,
  leadFor,
  progressionFor,
  shiftFor,
  stabsFor,
  transposeInKey,
  voiceProgression,
} from '.';

const PHRYGIAN: Key = { root: 4, scale: 'phrygian' };
const seeds = Array.from({ length: 300 }, (_, seed) => seed);

describe('progressionFor', () => {
  it('is reproducible, and differs from seed to seed', () => {
    expect(progressionFor(7, F_MINOR)).toEqual(progressionFor(7, F_MINOR));
    const loops = new Set(
      seeds.map(seed => JSON.stringify(progressionFor(seed, F_MINOR))),
    );
    expect(loops.size).toBeGreaterThan(40);
  });

  it('always starts home and never plays a diminished chord', () => {
    [F_MINOR, PHRYGIAN].forEach(key =>
      seeds.forEach(seed => {
        const { chords, bars } = progressionFor(seed, key);
        expect(chords[0].degree).toBe(0);
        chords.forEach(chord => expect(isStable(key, chord.degree)).toBe(true));
        expect(chords.reduce((sum, chord) => sum + chord.bars, 0)).toBe(bars);
      }),
    );
  });

  it('knows ii is diminished in minor and v in phrygian', () => {
    expect(isStable(F_MINOR, 1)).toBe(false);
    expect(isStable(PHRYGIAN, 4)).toBe(false);
    expect(isStable(PHRYGIAN, 1)).toBe(true);
  });
});

describe('chordAt', () => {
  it('loops the progression bar by bar', () => {
    const progression = {
      chords: [
        { degree: 0, bars: 2 },
        { degree: 5, bars: 2 },
      ],
      bars: 4,
    };
    expect(
      [0, 1, 2, 3, 4, -1].map(bar => chordAt(progression, bar).degree),
    ).toEqual([0, 0, 5, 5, 0, 5]);
  });
});

describe('transposeInKey', () => {
  it('moves a note by scale steps and stays in key', () => {
    const f3 = 53;
    expect(transposeInKey(F_MINOR, f3, 2)).toBe(56); // A flat
    expect(transposeInKey(F_MINOR, f3, -1)).toBe(51); // E flat
    const inKey = new Set(SCALES.minor.map(step => (5 + step) % 12));
    [-3, -2, -1, 1, 2, 3].forEach(steps =>
      expect(inKey.has(transposeInKey(F_MINOR, 60, steps) % 12)).toBe(true),
    );
  });

  it('shifts lines the short way round to a chord', () => {
    expect([0, 2, 3, 4, 5, 6].map(shiftFor)).toEqual([0, 2, 3, -3, -2, -1]);
  });
});

describe('voiceProgression', () => {
  it('moves each chord as little as it can from the last', () => {
    const progression = progressionFor(3, F_MINOR);
    const voiced = voiceProgression(F_MINOR, progression, {
      shape: [0, 2, 4],
      octave: 3,
    });
    expect(voiced).toHaveLength(progression.chords.length);
    voiced.slice(1).forEach((chord, i) => {
      const moved = chord.reduce(
        (sum, note, n) => sum + Math.abs(note - voiced[i][n]),
        0,
      );
      expect(moved).toBeLessThanOrEqual(12);
    });
  });
});

describe('patterns', () => {
  it('writes a two-bar hook that starts on the downbeat, inside the bar', () => {
    const [call, answer] = leadFor(11);
    [call, answer].forEach(bar => {
      expect(bar[0].step).toBe(0);
      bar.forEach(note =>
        expect(note.step + note.steps).toBeLessThanOrEqual(16),
      );
    });
  });

  it('places stabs off the kick and snare', () => {
    seeds
      .slice(0, 50)
      .forEach(seed =>
        stabsFor(seed).forEach(step => expect([0, 8]).not.toContain(step)),
      );
  });

  it('walks an arpeggio through every chord note', () => {
    (['up', 'down', 'bounce', 'skip'] as const).forEach(order => {
      const notes = new Set(
        Array.from({ length: 8 }, (_, n) => arpIndex(order, n, 4)),
      );
      expect(notes).toEqual(new Set([0, 1, 2, 3]));
    });
  });
});

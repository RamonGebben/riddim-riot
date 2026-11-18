import { describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import { degreeToMidi, F_MINOR, keyName, midiToHz, rollKey } from '.';

describe('degreeToMidi', () => {
  it('puts degree 0 on the root', () => {
    expect(degreeToMidi(F_MINOR, 0, 2)).toBe(41);
  });

  it('follows the scale: minor third and fifth', () => {
    expect(degreeToMidi(F_MINOR, 2, 2)).toBe(44);
    expect(degreeToMidi(F_MINOR, 4, 2)).toBe(48);
  });

  it('wraps past the octave in both directions', () => {
    expect(degreeToMidi(F_MINOR, 7, 2)).toBe(53);
    expect(degreeToMidi(F_MINOR, -1, 2)).toBe(39);
  });

  it('only ever lands in the scale', () => {
    const inKey = new Set([0, 2, 3, 5, 7, 8, 10].map(step => (5 + step) % 12));
    Array.from({ length: 30 }, (_, i) => i - 10).forEach(degree =>
      expect(inKey.has(degreeToMidi(F_MINOR, degree, 3) % 12)).toBe(true),
    );
  });
});

describe('midiToHz', () => {
  it('tunes A4 to 440', () => {
    expect(midiToHz(69)).toBe(440);
    expect(midiToHz(41)).toBeCloseTo(87.31, 1);
  });
});

describe('rollKey', () => {
  it('only rolls roots whose octave-1 kick sits between 40 and 56 Hz', () => {
    Array.from({ length: 100 }, (_, seed) => rollKey(createRng(seed))).forEach(
      key => {
        const kick = midiToHz(degreeToMidi(key, 0, 1));
        expect(kick).toBeGreaterThan(40);
        expect(kick).toBeLessThan(56);
      },
    );
  });

  it('names keys', () => {
    expect(keyName(F_MINOR)).toBe('F minor');
  });
});

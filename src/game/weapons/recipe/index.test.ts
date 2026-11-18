import { describe, expect, it } from 'vitest';
import { F_MINOR, type Key } from '../../music';
import { rerollRecipe, weaponFrom } from '.';

const G_MINOR: Key = { root: 7, scale: 'minor' };

describe('weaponFrom', () => {
  it('rolls the same weapon in a new key, transposed', () => {
    const inF = weaponFrom({ seed: 5 }, F_MINOR);
    const inG = weaponFrom({ seed: 5 }, G_MINOR);
    expect(inG.parts).toEqual(inF.parts);
    expect(inG.sound.riff.map((note, i) => note - inF.sound.riff[i])).toEqual(
      inF.sound.riff.map(() => 2),
    );
  });

  it('honours a pinned engine', () => {
    expect(
      weaponFrom({ seed: 5, oscillator: 'laser' }, F_MINOR).parts.oscillator,
    ).toBe('laser');
  });
});

describe('rerollRecipe', () => {
  it('gives a new, reproducible, unpinned recipe', () => {
    const next = rerollRecipe({ seed: 5, oscillator: 'laser' });
    expect(next).toEqual(rerollRecipe({ seed: 5 }));
    expect(next.seed).not.toBe(5);
    expect(next.oscillator).toBeUndefined();
  });
});

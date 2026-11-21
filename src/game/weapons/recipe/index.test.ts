import { describe, expect, it } from 'vitest';
import { F_MINOR, type Key } from '../../music';
import { sameRecipe, weaponFrom } from '.';

const G_MINOR: Key = { root: 7, scale: 'minor' };

describe('sameRecipe', () => {
  it('matches on the seed and every pin', () => {
    expect(sameRecipe({ seed: 5 }, { seed: 5 })).toBe(true);
    expect(sameRecipe({ seed: 5 }, { seed: 6 })).toBe(false);
    expect(sameRecipe({ seed: 5, fx: 'echo' }, { seed: 5 })).toBe(false);
  });
});

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

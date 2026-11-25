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

  it('tells tiers apart, a missing one being tier 1', () => {
    expect(sameRecipe({ seed: 5, tier: 1 }, { seed: 5 })).toBe(true);
    expect(sameRecipe({ seed: 5, tier: 3 }, { seed: 5 })).toBe(false);
  });
});

describe('weaponFrom', () => {
  it('rolls the same weapon in a new key, transposed', () => {
    const inF = weaponFrom({ seed: 5 }, F_MINOR, 1);
    const inG = weaponFrom({ seed: 5 }, G_MINOR, 1);
    expect(inG.parts).toEqual(inF.parts);
    expect(inG.sound.riff.map((note, i) => note - inF.sound.riff[i])).toEqual(
      inF.sound.riff.map(() => 2),
    );
  });

  it('plays a weapon at no more than the level tier, its parts unchanged', () => {
    const recipe = { seed: 5, tier: 4 };
    const early = weaponFrom(recipe, F_MINOR, 1);
    const late = weaponFrom(recipe, F_MINOR, 4);
    expect(early.parts).toEqual(late.parts);
    expect(early.tier).toEqual({ own: 4, playing: 1 });
    expect(late.tier).toEqual({ own: 4, playing: 4 });
    expect(late.projectile.damage).toBeGreaterThan(early.projectile.damage);
    expect(late.projectile.lifetime).toBeGreaterThan(early.projectile.lifetime);
    // The tier is gameplay: the sound is the same.
    expect(late.sound).toEqual(early.sound);
  });

  it('honours a pinned engine', () => {
    expect(
      weaponFrom({ seed: 5, oscillator: 'laser' }, F_MINOR, 1).parts.oscillator,
    ).toBe('laser');
  });
});

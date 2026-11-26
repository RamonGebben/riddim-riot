import { describe, expect, it } from 'vitest';
import { cleanRig, describeRig, isRigged, rigLoot, rigRun, rigStyle } from '.';
import { styleFor } from '../genre';
import { newRun, nextLevel } from '../run';

describe('rig', () => {
  it('keeps only what makes a valid rig', () => {
    expect(
      cleanRig({
        level: 4,
        subgenre: 'liquid',
        bpm: 174,
        god: true,
        stress: false,
        skipCircle: true,
        seed: 12,
      }),
    ).toEqual({
      level: 4,
      subgenre: 'liquid',
      bpm: 174,
      god: true,
      skipCircle: true,
      seed: 12,
    });
    expect(
      cleanRig({ level: 9, subgenre: 'polka', bpm: 2.5, god: 'yes' }),
    ).toEqual({});
    expect(cleanRig(null)).toEqual({});
    expect(isRigged({})).toBe(false);
  });

  it('leaves a run alone with nothing rigged', () => {
    const run = newRun(7);
    expect(rigRun(run, {})).toBe(run);
  });

  it("starts on the rigged level, the loadout at that level's tier", () => {
    const run = rigRun(newRun(7), { level: 4, god: true });
    expect(run.level).toBe(4);
    expect(run.recipes.map(recipe => recipe.tier)).toEqual([4, 4, 4]);
    expect(run.rig).toEqual({ level: 4, god: true });
    // Better weapons than the level's keep their own tier.
    const strong = { ...newRun(7), recipes: [{ seed: 1, tier: 5 }] };
    expect(rigRun(strong, { level: 2 }).recipes[0].tier).toBe(5);
  });

  it('carries the rig to every level after the first', () => {
    const run = rigRun(newRun(7), { subgenre: 'liquid', god: true });
    const next = nextLevel(run, run);
    expect(next.level).toBe(2);
    expect(next.rig).toEqual({ subgenre: 'liquid', god: true });
  });

  it('forces the subgenre and tempo, or keeps what the seed rolled', () => {
    const rolled = styleFor(99, 4);
    expect(rigStyle(rolled, undefined)).toEqual(rolled);
    const forced = rigStyle(rolled, { subgenre: 'riddim' });
    expect(forced.subgenre).toBe('riddim');
    expect(forced.bpm).toBe(140);
    expect(rigStyle(rolled, { bpm: 90 }).bpm).toBe(90);
  });

  it('says what it changes', () => {
    expect(describeRig({ level: 4, subgenre: 'liquid', god: true })).toBe(
      'level 4 · Liquid · god mode',
    );
    expect(describeRig({})).toBe('');
  });

  it('rolls loot of the tier asked, every engine', () => {
    const loot = rigLoot(3, { tier: 5, count: 6 });
    expect(loot).toHaveLength(6);
    expect(new Set(loot.map(recipe => recipe.tier))).toEqual(new Set([5]));
    expect(new Set(loot.map(recipe => recipe.oscillator))).toEqual(
      new Set(['wobble', 'laser', 'beam']),
    );
    expect(rigLoot(3, { tier: 9, count: 1 })[0].tier).toBe(5);
  });
});

import { describe, expect, it } from 'vitest';
import { levelSeed, newRun, nextLevel } from '.';

describe('newRun', () => {
  it('starts on level 1 at full health with one of each engine', () => {
    const run = newRun(42);
    expect(run).toMatchObject({
      seed: 42,
      level: 1,
      hp: 5,
      kills: 0,
      active: 0,
    });
    expect(run.recipes.map(recipe => recipe.oscillator)).toEqual([
      'wobble',
      'laser',
      'beam',
    ]);
  });

  it('is reproducible from its seed', () => {
    expect(newRun(42)).toEqual(newRun(42));
    expect(newRun(42).recipes).not.toEqual(newRun(43).recipes);
  });
});

describe('levelSeed', () => {
  it('plays the run seed on level 1, then a new seed per level', () => {
    const run = newRun(42);
    expect(levelSeed(run)).toBe(42);
    const seeds = [2, 3, 4].map(level => levelSeed({ ...run, level }));
    expect(new Set([42, ...seeds]).size).toBe(4);
  });
});

describe('nextLevel', () => {
  it('carries health, kills, score and the loadout into the next level', () => {
    const run = newRun(42);
    const next = nextLevel(run, {
      hp: 2,
      kills: 17,
      score: 2400,
      recipes: [{ seed: 9 }],
      active: 0,
    });
    expect(next).toEqual({
      ...run,
      level: 2,
      hp: 2,
      kills: 17,
      score: 2400,
      recipes: [{ seed: 9 }],
    });
  });
});

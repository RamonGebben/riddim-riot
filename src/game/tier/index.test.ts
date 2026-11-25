import { describe, expect, it } from 'vitest';
import {
  bossHpScale,
  fxChance,
  lootTier,
  MAX_TIER,
  playsAt,
  scoreMultiplier,
  tierOf,
  waveCap,
  waveEvery,
  weaponScale,
} from '.';

describe('tiers', () => {
  it('follows the level, from 1 to the last', () => {
    expect(tierOf(1)).toBe(1);
    expect(tierOf(3)).toBe(3);
    expect(tierOf(MAX_TIER + 2)).toBe(MAX_TIER);
  });

  it("plays a weapon at no more than the level's tier", () => {
    expect(playsAt(5, 1)).toBe(1);
    expect(playsAt(5, 4)).toBe(4);
    expect(playsAt(2, 4)).toBe(2);
  });

  it('makes weapons stronger with each tier, from no change at tier 1', () => {
    expect(weaponScale(1)).toEqual({ damage: 1, reach: 1, blast: 1 });
    const top = weaponScale(MAX_TIER);
    expect(top.damage).toBeGreaterThan(weaponScale(3).damage);
    expect(top.reach).toBeGreaterThan(1);
    expect(top.blast).toBeGreaterThan(1);
  });

  it('rolls FX more often on better loot, never always', () => {
    expect(fxChance(0.6, 1)).toBe(0.6);
    expect(fxChance(0.6, MAX_TIER)).toBeGreaterThan(0.6);
    expect(fxChance(0.9, MAX_TIER)).toBeLessThan(1);
  });

  it('drops loot at the level tier, a boss one better, up to the top', () => {
    expect(lootTier(2)).toBe(2);
    expect(lootTier(2, { boss: true })).toBe(3);
    expect(lootTier(MAX_TIER, { boss: true })).toBe(MAX_TIER);
  });

  it('gives the boss more health further in', () => {
    expect(bossHpScale(1)).toBe(1);
    expect(bossHpScale(MAX_TIER)).toBeGreaterThan(bossHpScale(2));
    // Less than a weapon of its tier gains: keeping up pays.
    expect(bossHpScale(MAX_TIER)).toBeLessThan(weaponScale(MAX_TIER).damage);
  });

  it('sends waves sooner and bigger further in', () => {
    expect(waveEvery(4, 1)).toBe(4);
    expect(waveEvery(4, MAX_TIER)).toBeLessThan(4);
    expect(waveEvery(8, MAX_TIER)).toBeLessThan(8);
    expect(waveEvery(2, MAX_TIER)).toBe(2);
    expect(waveCap(1)).toBe(14);
    expect(waveCap(MAX_TIER)).toBeGreaterThan(14);
  });

  it('multiplies points by a whole number, so scores stay in hundreds', () => {
    expect(scoreMultiplier(1)).toBe(1);
    expect(Number.isInteger(scoreMultiplier(3))).toBe(true);
    expect(scoreMultiplier(MAX_TIER)).toBe(MAX_TIER);
  });
});

import { describe, expect, it } from 'vitest';
import { kickRecoil, NO_RECOIL, RECOIL, type Recoil } from '.';

/** Fire `count` shots `interval` seconds apart; the scatter of each. */
const burst = (count: number, interval: number, seed = 1) =>
  Array.from({ length: count }).reduce<{
    recoil: Recoil;
    angles: Array<number>;
  }>(
    ({ recoil, angles }, _, i) => {
      const kicked = kickRecoil(recoil, { time: 1 + i * interval, seed });
      return { recoil: kicked.recoil, angles: [...angles, kicked.angle] };
    },
    { recoil: NO_RECOIL, angles: [] },
  ).angles;

const widest = (angles: Array<number>) => Math.max(...angles.map(Math.abs));

describe('kickRecoil', () => {
  it('lets a lone shot fly true', () => {
    expect(Math.abs(kickRecoil(NO_RECOIL, { time: 1, seed: 1 }).angle)).toBe(0);
  });

  it('scatters fast fire more than slow fire', () => {
    const fast = widest(burst(32, 60 / 140 / 4));
    const slow = widest(burst(32, 60 / 140));
    expect(fast).toBeGreaterThan(slow * 3);
  });

  it('stays within the scatter at full heat', () => {
    expect(widest(burst(64, 0.01))).toBeLessThanOrEqual(RECOIL.scatter);
  });

  it('cools off between bursts', () => {
    const hot = kickRecoil(NO_RECOIL, { time: 1, seed: 1 }).recoil;
    const later = kickRecoil(hot, { time: 3, seed: 1 });
    expect(Math.abs(later.angle)).toBeLessThan(0.001);
  });

  it('is the same scatter for the same seed', () => {
    expect(burst(8, 0.1, 7)).toEqual(burst(8, 0.1, 7));
    expect(burst(8, 0.1, 7)).not.toEqual(burst(8, 0.1, 8));
  });
});

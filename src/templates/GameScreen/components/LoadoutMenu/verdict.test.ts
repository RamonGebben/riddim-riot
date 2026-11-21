import { describe, expect, it } from 'vitest';
import { verdictOf, type WeaponStats } from './verdict';

const held: WeaponStats = { perBar: 64, hit: 4, shots: 16, reach: 9, area: 0 };

describe('verdictOf', () => {
  it('calls clearly more damage a bar stronger', () => {
    expect(verdictOf({ ...held, perBar: 72 }, held)).toBe('stronger');
  });

  it('calls clearly less, with nothing else gained, weaker', () => {
    expect(
      verdictOf({ ...held, perBar: 56, hit: 7, shots: 8, reach: 8 }, held),
    ).toBe('weaker');
  });

  it('calls less damage for more reach or blast a trade-off', () => {
    expect(verdictOf({ ...held, perBar: 56, area: 1.5 }, held)).toBe(
      'trade-off',
    );
  });

  it('calls a near match a trade-off', () => {
    expect(verdictOf({ ...held, perBar: 65 }, held)).toBe('trade-off');
  });
});

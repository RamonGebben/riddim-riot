import { describe, expect, it } from 'vitest';
import { dropsOnKill, lootRecipe, nearestPickup, PICKUP_RADIUS } from '.';

describe('dropsOnKill', () => {
  it('is reproducible and rare', () => {
    expect(dropsOnKill(42, 7)).toBe(dropsOnKill(42, 7));
    const drops = Array.from({ length: 2000 }, (_, id) => dropsOnKill(42, id));
    const rate = drops.filter(Boolean).length / drops.length;
    expect(rate).toBeGreaterThan(0.03);
    expect(rate).toBeLessThan(0.09);
  });
});

describe('lootRecipe', () => {
  it('gives each pickup its own weapon', () => {
    expect(lootRecipe(42, 1)).toEqual(lootRecipe(42, 1));
    expect(lootRecipe(42, 1)).not.toEqual(lootRecipe(42, 2));
  });
});

describe('nearestPickup', () => {
  const pickups = [
    { id: 1, position: { x: 100, y: 0 }, recipe: { seed: 1 } },
    { id: 2, position: { x: 20, y: 0 }, recipe: { seed: 2 } },
  ];

  it('picks the closest one in reach', () => {
    expect(nearestPickup(pickups, { x: 0, y: 0 })?.id).toBe(2);
  });

  it('finds nothing out of reach', () => {
    expect(nearestPickup(pickups, { x: 0, y: PICKUP_RADIUS * 3 })).toBeNull();
  });
});

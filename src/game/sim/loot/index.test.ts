import { describe, expect, it } from 'vitest';
import {
  dropOnKill,
  goodLootRecipe,
  heartsInReach,
  lootRecipe,
  nearestPickup,
  PICKUP_RADIUS,
} from '.';

describe('dropOnKill', () => {
  it('is reproducible, and drops weapons and hearts now and then', () => {
    expect(dropOnKill(42, 7)).toBe(dropOnKill(42, 7));
    const drops = Array.from({ length: 4000 }, (_, id) => dropOnKill(42, id));
    const rate = (kind: string) =>
      drops.filter(drop => drop === kind).length / drops.length;
    expect(rate('weapon')).toBeGreaterThan(0.07);
    expect(rate('weapon')).toBeLessThan(0.13);
    expect(rate('heart')).toBeGreaterThan(0.05);
    expect(rate('heart')).toBeLessThan(0.1);
  });
});

describe('goodLootRecipe', () => {
  it('always pins the heavy maker and an FX', () => {
    Array.from({ length: 20 }, (_, id) => goodLootRecipe(42, id)).forEach(
      recipe => {
        expect(recipe.manufacturer).toBe('vandal');
        expect(['distortion', 'echo']).toContain(recipe.fx);
      },
    );
  });
});

describe('heartsInReach', () => {
  it('finds the hearts the player is standing on', () => {
    const hearts = [
      { id: 1, position: { x: 0, y: 0 } },
      { id: 2, position: { x: 300, y: 0 } },
    ];
    expect(heartsInReach(hearts, { x: 10, y: 0 })).toEqual([hearts[0]]);
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

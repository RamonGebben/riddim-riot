import { describe, expect, it } from 'vitest';
import {
  attractHearts,
  attractPickups,
  dropOnKill,
  goodLootRecipe,
  heartsInReach,
  lootRecipe,
  PICKUP_RADIUS,
  pickupsInReach,
} from '.';

describe('dropOnKill', () => {
  it('is reproducible, and drops weapons, hearts and powerups now and then', () => {
    expect(dropOnKill(42, 7)).toBe(dropOnKill(42, 7));
    const drops = Array.from({ length: 4000 }, (_, id) => dropOnKill(42, id));
    const rate = (kind: string) =>
      drops.filter(drop => drop === kind).length / drops.length;
    expect(rate('weapon')).toBeGreaterThan(0.07);
    expect(rate('weapon')).toBeLessThan(0.13);
    expect(rate('heart')).toBeGreaterThan(0.05);
    expect(rate('heart')).toBeLessThan(0.1);
    expect(rate('powerup')).toBeGreaterThan(0.02);
    expect(rate('powerup')).toBeLessThan(0.05);
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

describe('pickupsInReach', () => {
  const pickups = [
    { id: 1, position: { x: 30, y: 0 }, recipe: { seed: 1 } },
    { id: 2, position: { x: 10, y: 0 }, recipe: { seed: 2 } },
    { id: 3, position: { x: 300, y: 0 }, recipe: { seed: 3 } },
  ];

  it('finds the ones in reach, closest first', () => {
    expect(pickupsInReach(pickups, { x: 0, y: 0 }).map(({ id }) => id)).toEqual(
      [2, 1],
    );
  });

  it('finds nothing out of reach', () => {
    expect(pickupsInReach(pickups, { x: 0, y: PICKUP_RADIUS * 3 })).toEqual([]);
  });
});

describe('attractPickups', () => {
  const player = { x: 0, y: 0 };
  const pickup = { id: 3, position: { x: 100, y: 0 }, recipe: { seed: 1 } };

  it('draws weapons in while the bag has room', () => {
    const [drawn] = attractPickups([pickup], {
      player,
      dt: 1 / 60,
      hasRoom: true,
    });
    expect(drawn.position.x).toBeLessThan(100);
  });

  it('leaves them on the floor when the bag is full', () => {
    const [kept] = attractPickups([pickup], {
      player,
      dt: 1 / 60,
      hasRoom: false,
    });
    expect(kept.position.x).toBe(100);
  });
});

describe('attractHearts', () => {
  const player = { x: 0, y: 0 };
  const heart = { id: 3, position: { x: 100, y: 0 } };

  it('draws hearts in while there is health to gain', () => {
    const [drawn] = attractHearts([heart], {
      player,
      dt: 1 / 60,
      canHeal: true,
    });
    expect(drawn.position.x).toBeLessThan(100);
  });

  it('leaves hearts be when there is nothing to heal', () => {
    const [kept] = attractHearts([heart], {
      player,
      dt: 1 / 60,
      canHeal: false,
    });
    expect(kept.position.x).toBe(100);
  });
});

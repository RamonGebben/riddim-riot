import { describe, expect, it } from 'vitest';
import { generateLevel } from '../level';
import { createWorld, placePickup, rulesFor } from '../sim/world';
import { hudOf, initialHud, sameHud } from '.';

describe('hudOf', () => {
  it('shows the run as the world has it', () => {
    const world = createWorld(generateLevel(1), rulesFor({ level: 2 }), {
      hp: 3,
      kills: 7,
    });
    expect(hudOf(world, () => 'gun')).toEqual({
      status: 'playing',
      level: 2,
      hp: 3,
      maxHp: 5,
      kills: 7,
      wavesCleared: 0,
      wavesToClear: 4,
      exitOpen: false,
      pickup: null,
    });
  });

  it('names the weapon the player is standing on', () => {
    const world = createWorld(generateLevel(1));
    const onIt = placePickup(world, { seed: 3 }, world.player.position);
    expect(hudOf(onIt, recipe => `gun ${recipe.seed}`).pickup).toBe('gun 3');
  });
});

describe('initialHud', () => {
  it('starts a level from what the run carries', () => {
    expect(initialHud({ level: 3, hp: 2, kills: 40 })).toMatchObject({
      status: 'playing',
      level: 3,
      hp: 2,
      kills: 40,
    });
  });
});

describe('sameHud', () => {
  it('spots any change', () => {
    const hud = hudOf(createWorld(generateLevel(1)), () => 'gun');
    expect(sameHud(hud, { ...hud })).toBe(true);
    expect(sameHud(hud, { ...hud, kills: 1 })).toBe(false);
  });
});

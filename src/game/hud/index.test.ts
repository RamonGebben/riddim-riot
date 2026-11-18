import { describe, expect, it } from 'vitest';
import { generateLevel } from '../level';
import { createWorld } from '../sim/world';
import { hudOf, sameHud } from '.';

describe('hudOf', () => {
  it('shows the run as the world has it', () => {
    const world = createWorld(generateLevel(1), undefined, { hp: 3, kills: 7 });
    expect(hudOf(world)).toEqual({
      status: 'playing',
      hp: 3,
      maxHp: 5,
      kills: 7,
    });
  });
});

describe('sameHud', () => {
  it('spots any change', () => {
    const hud = hudOf(createWorld(generateLevel(1)));
    expect(sameHud(hud, { ...hud })).toBe(true);
    expect(sameHud(hud, { ...hud, kills: 1 })).toBe(false);
  });
});

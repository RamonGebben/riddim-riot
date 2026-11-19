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
      score: 0,
      combo: 0,
      phase: 'waiting',
      part: null,
      secondsLeft: null,
      boss: false,
      pickup: null,
    });
  });

  it('names the song part and counts it down, beat by beat', () => {
    const world = createWorld(generateLevel(1), rulesFor({ level: 1 }));
    const playing = {
      ...world,
      survival: { ...world.survival, phase: 'song' as const, startBar: 2 },
    };
    // The 16-bar intro from bar 2 ends on beat 72; at 0.5 s a beat.
    const intro = hudOf(playing, () => 'gun', 8, 0.5);
    expect(intro).toMatchObject({ part: 'intro', secondsLeft: 32 });
    expect(hudOf(playing, () => 'gun', 71, 0.5).secondsLeft).toBe(1);
    expect(hudOf(playing, () => 'gun', 72, 0.5).part).toBe('breakdown');
  });

  it('names the weapon the player is standing on', () => {
    const world = createWorld(generateLevel(1));
    const onIt = placePickup(world, { seed: 3 }, world.player.position);
    expect(hudOf(onIt, recipe => `gun ${recipe.seed}`).pickup).toBe('gun 3');
  });
});

describe('initialHud', () => {
  it('starts a level from what the run carries', () => {
    expect(
      initialHud({ level: 3, hp: 2, kills: 40, score: 900 }),
    ).toMatchObject({
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

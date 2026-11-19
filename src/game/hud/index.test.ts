import { describe, expect, it } from 'vitest';
import { generateLevel } from '../level';
import { createWorld, placePickup, rulesFor } from '../sim/world';
import { hudOf, initialHud, sameHud, type PickupView } from '.';

const gun: PickupView = {
  name: 'gun',
  oscillator: 'wobble',
  lfo: '1/8',
  fx: null,
  blasts: false,
};
const describe_ = () => gun;

describe('hudOf', () => {
  it('shows the run as the world has it', () => {
    const world = createWorld(generateLevel(1), rulesFor({ level: 2 }), {
      hp: 3,
      kills: 7,
    });
    expect(hudOf(world, describe_)).toEqual({
      status: 'playing',
      level: 2,
      levels: 5,
      hp: 3,
      maxHp: 5,
      hpCap: 8,
      kills: 7,
      score: 0,
      combo: 0,
      phase: 'waiting',
      part: null,
      secondsLeft: null,
      song: world.rules.song,
      songBar: null,
      boss: null,
      pickup: null,
      dashCooldown: null,
      dashKey: 0,
    });
  });

  it('names the song part and counts it down, beat by beat', () => {
    const world = createWorld(generateLevel(1), rulesFor({ level: 1 }));
    const playing = {
      ...world,
      survival: { ...world.survival, phase: 'song' as const, startBar: 2 },
    };
    // The 16-bar intro from bar 2 ends on beat 72; at 0.5 s a beat.
    const intro = hudOf(playing, describe_, 8, 0.5);
    expect(intro).toMatchObject({
      part: 'intro',
      secondsLeft: 32,
      songBar: 0,
    });
    expect(hudOf(playing, describe_, 71, 0.5).secondsLeft).toBe(1);
    expect(hudOf(playing, describe_, 72, 0.5).part).toBe('breakdown');
  });

  it('names the weapon the player is standing on', () => {
    const world = createWorld(generateLevel(1));
    const onIt = placePickup(world, { seed: 3 }, world.player.position);
    const named = hudOf(onIt, recipe => ({
      ...gun,
      name: `gun ${recipe.seed}`,
    }));
    expect(named.pickup?.name).toBe('gun 3');
  });

  it("shows the boss's health while it's up", () => {
    const world = createWorld(generateLevel(1), rulesFor({ level: 1 }));
    const boss = {
      id: 1,
      kind: 'boss' as const,
      hp: 15,
      from: world.player.position,
      to: world.player.position,
      hopAt: 0,
      hopSeconds: 0.2,
      spawnAt: 0,
      aim: null,
    };
    expect(hudOf(world, describe_).boss).toBeNull();
    expect(hudOf({ ...world, enemies: [boss] }, describe_).boss).toBe(0.5);
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
    const hud = hudOf(createWorld(generateLevel(1)), describe_);
    expect(sameHud(hud, { ...hud })).toBe(true);
    expect(sameHud(hud, { ...hud, kills: 1 })).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { generateLevel } from '../level';
import { createWorld, rulesFor } from '../sim/world';
import { BAG_SIZE } from '../sim/loot';
import { hudOf, initialHud, sameHud } from '.';

describe('hudOf', () => {
  it('shows the run as the world has it', () => {
    const world = createWorld(generateLevel(1), rulesFor({ level: 2 }), {
      hp: 3,
      kills: 7,
    });
    expect(hudOf(world)).toEqual({
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
      bag: 0,
      bagSize: BAG_SIZE,
      dashCooldown: null,
      dashKey: 0,
      moving: false,
      pellet: null,
      halfTime: null,
      chord: null,
    });
  });

  it('counts a running powerup down in whole seconds', () => {
    const world = createWorld(generateLevel(1));
    const powered = {
      ...world,
      powered: { ...world.powered, chord: 10 },
    };
    expect(hudOf(powered, 0, 0.5, 2.2).chord).toBe(8);
    expect(hudOf(powered, 0, 0.5, 10).chord).toBeNull();
    expect(hudOf(powered, 0, 0.5, 2.2).pellet).toBeNull();
  });

  it('tells walking from easing to a stop', () => {
    const world = createWorld(generateLevel(1));
    const at = (x: number) =>
      hudOf({ ...world, player: { ...world.player, velocity: { x, y: 0 } } });
    expect(at(420).moving).toBe(true);
    expect(at(20).moving).toBe(false);
  });

  it('names the song part and counts it down, beat by beat', () => {
    const world = createWorld(generateLevel(1), rulesFor({ level: 1 }));
    const playing = {
      ...world,
      survival: { ...world.survival, phase: 'song' as const, startBar: 2 },
    };
    // The 16-bar intro from bar 2 ends on beat 72; at 0.5 s a beat.
    const intro = hudOf(playing, 8, 0.5);
    expect(intro).toMatchObject({
      part: 'intro',
      secondsLeft: 32,
      songBar: 0,
    });
    expect(hudOf(playing, 71, 0.5).secondsLeft).toBe(1);
    expect(hudOf(playing, 72, 0.5).part).toBe('breakdown');
  });

  it('counts what the bag holds', () => {
    const world = createWorld(generateLevel(1), rulesFor({ level: 1 }), {
      bag: [{ seed: 3 }, { seed: 4 }],
    });
    expect(hudOf(world).bag).toBe(2);
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
    expect(hudOf(world).boss).toBeNull();
    expect(hudOf({ ...world, enemies: [boss] }).boss).toBe(0.5);
  });
});

describe('initialHud', () => {
  it('starts a level from what the run carries', () => {
    expect(
      initialHud({
        level: 3,
        hp: 2,
        kills: 40,
        score: 900,
        bag: [{ seed: 1 }],
      }),
    ).toMatchObject({
      status: 'playing',
      level: 3,
      hp: 2,
      kills: 40,
      bag: 1,
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

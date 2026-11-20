import { describe, expect, it } from 'vitest';
import {
  distanceAt,
  distanceField,
  generateLevel,
  isWall,
  tileCenter,
  tileOf,
  TILE_SIZE,
  type Level,
} from '../../level';
import { createRng } from '../../rng';
import type { Enemy } from '../enemy';
import { BONUS_HEARTS } from '../loot';
import {
  createWorld,
  hpCap,
  isExitOpen,
  onBar,
  onBeat,
  placePickup,
  LEVEL_CLEAR_BONUS,
  PLAYER_MAX_HP,
  queueShot,
  rulesFor,
  stepWorld,
  takePickup,
  type World,
} from '.';

const level: Level = generateLevel(3);
const start = level.start;
const still = { move: { x: 0, y: 0 }, aimAt: { x: start.x + 500, y: start.y } };
const shot = (time: number) => ({
  time,
  angle: 0,
  spec: {
    kind: 'blob' as const,
    speed: 1000,
    radius: 9,
    damage: 1,
    lifetime: 0.5,
    spread: 0,
  },
});

const enemyAt = (id: number, at: { x: number; y: number }, hp = 2): Enemy => ({
  id,
  kind: 'hopper',
  hp,
  hopSeconds: 0.11,
  aim: null,
  from: at,
  to: at,
  hopAt: 0,
  spawnAt: 0,
});

const withEnemies = (world: World, enemies: Array<Enemy>): World => ({
  ...world,
  enemies,
});

const fieldFromPlayer = distanceField(level.map, tileOf(start));
const walk = (point: { x: number; y: number }) =>
  distanceAt(level.map, fieldFromPlayer, tileOf(point));

describe('createWorld', () => {
  it('puts the player on the level start', () => {
    expect(createWorld(level).player.position).toEqual(start);
  });
});

const stepInto = (world: World, at: { x: number; y: number }, now = 1) =>
  stepWorld(
    { ...world, player: { ...world.player, position: at } },
    { input: still, dt: 1 / 60, now },
  ).world;

/** Stepped in, charged over a bar and slammed: the fight is on at bar 2. */
const fighting = (rules = rulesFor({ level: 1 })) => {
  const charged = onBar(stepInto(createWorld(level, rules), level.pad), {
    bar: 1,
    time: 2,
    rng: createRng(1),
  });
  return onBar(charged, { bar: 2, time: 4, rng: createRng(1) });
};

describe('the circle', () => {
  it('waits for the player, sending nobody', () => {
    const rng = createRng(1);
    const idle = onBar(createWorld(level), { bar: 40, time: 80, rng });
    expect(idle.enemies).toEqual([]);
    expect(idle.survival.phase).toBe('waiting');
  });

  it('charges once the player steps in, and slams a bar line later', () => {
    const stepped = stepInto(createWorld(level), level.pad, 1.2);
    expect(stepped.survival).toMatchObject({
      phase: 'charging',
      steppedAt: 1.2,
    });
    const slammed = fighting();
    expect(slammed.survival).toMatchObject({ phase: 'song', startBar: 2 });
    expect(slammed.enemies).toHaveLength(2);
  });

  it('ignores the player standing anywhere else', () => {
    const elsewhere = stepInto(createWorld(level), start);
    expect(elsewhere.survival.phase).toBe('waiting');
  });
});

describe('onBar', () => {
  it('keeps waves at one hit to kill on later levels', () => {
    fighting(rulesFor({ level: 5 })).enemies.forEach(enemy =>
      expect(enemy.hp - 0.001).toBeLessThan(0),
    );
  });

  it('spawns where the player can see, when it knows the view', () => {
    const charged = onBar(stepInto(createWorld(level), level.pad), {
      bar: 1,
      time: 2,
      rng: createRng(1),
    });
    const view = { center: level.pad, size: { x: 1400, y: 720 } };
    const slammed = onBar(charged, {
      bar: 2,
      time: 4,
      rng: createRng(1),
      view,
    });
    expect(slammed.enemies.length).toBeGreaterThan(0);
    slammed.enemies.forEach(enemy => {
      expect(Math.abs(enemy.to.x - view.center.x)).toBeLessThanOrEqual(
        view.size.x / 2 - TILE_SIZE,
      );
      expect(Math.abs(enemy.to.y - view.center.y)).toBeLessThanOrEqual(
        view.size.y / 2 - TILE_SIZE,
      );
    });
  });

  it('brings the boss on the last drop, far from the player', () => {
    const playing = fighting();
    const drop3 = onBar(
      { ...playing, survival: { ...playing.survival, lastWaveBar: 81 } },
      { bar: 82, time: 164, rng: createRng(3) },
    );
    const boss = drop3.enemies.find(enemy => enemy.kind === 'boss');
    expect(boss?.hp).toBe(30);
    const away = Math.hypot(
      boss!.to.x - drop3.player.position.x,
      boss!.to.y - drop3.player.position.y,
    );
    expect(away).toBeGreaterThanOrEqual(8 * TILE_SIZE);
  });

  it('opens the exit in the outro once the boss is down', () => {
    const playing = fighting();
    const outro = {
      ...playing,
      enemies: [],
      survival: { ...playing.survival, bossSent: true, lastWaveBar: 114 },
    };
    const open = onBar(outro, { bar: 114, time: 228, rng: createRng(3) });
    expect(isExitOpen(open)).toBe(true);
  });

  it('fills the level to the enemy cap in stress mode, from the first bar', () => {
    const world = createWorld(level, rulesFor({ level: 1, stress: true }));
    const filled = onBar(world, { bar: 0, time: 0, rng: createRng(1) });
    expect(filled.enemies).toHaveLength(30);
    expect(
      onBar(filled, { bar: 1, time: 1, rng: createRng(2) }).enemies,
    ).toHaveLength(30);
  });

  it('spawns anywhere on floor, but never right on top of the player', () => {
    const world = fighting();
    expect(world.enemies.length).toBeGreaterThan(0);
    world.enemies.forEach(enemy => {
      expect(isWall(level.map, tileOf(enemy.to))).toBe(false);
      const away = Math.hypot(
        enemy.to.x - world.player.position.x,
        enemy.to.y - world.player.position.y,
      );
      expect(away).toBeGreaterThanOrEqual(4 * TILE_SIZE);
    });
  });

  it('telegraphs spawns: they appear a moment after the bar line', () => {
    const charged = onBar(stepInto(createWorld(level), level.pad), {
      bar: 1,
      time: 2,
      rng: createRng(1),
    });
    const slammed = onBar(charged, {
      bar: 2,
      time: 4,
      rng: createRng(1),
      telegraphSeconds: 0.8,
    });
    slammed.enemies.forEach(enemy => expect(enemy.spawnAt).toBe(4.8));
  });
});

describe('onBeat', () => {
  it('hops each enemy one tile closer along the flow field', () => {
    const spawned = fighting();
    const hopped = onBeat(spawned, { time: 5, beat: 0 });
    hopped.enemies.forEach((enemy, i) => {
      const before = spawned.enemies[i];
      expect(walk(enemy.to)).toBe(walk(before.to) - 1);
      const moved = Math.hypot(
        enemy.to.x - before.to.x,
        enemy.to.y - before.to.y,
      );
      expect(moved).toBe(TILE_SIZE);
    });
  });

  it('never lands two enemies on the same tile', () => {
    const t = tileOf(start);
    // Two enemies side by side, both one step from the same tile.
    const a = tileCenter({ x: t.x + 2, y: t.y });
    const b = tileCenter({ x: t.x + 2, y: t.y + 1 });
    const world = onBeat(
      withEnemies(createWorld(level), [enemyAt(1, a), enemyAt(2, b)]),
      { time: 1, beat: 0 },
    );
    const landing = world.enemies.map(enemy => JSON.stringify(enemy.to));
    expect(new Set(landing).size).toBe(2);
  });

  it('lets a queue of enemies all move up at once', () => {
    const t = tileOf(start);
    const queue = [2, 3, 4].map((dx, i) =>
      enemyAt(i + 1, tileCenter({ x: t.x + dx, y: t.y })),
    );
    const world = onBeat(withEnemies(createWorld(level), queue), {
      time: 1,
      beat: 0,
    });
    world.enemies.forEach((enemy, i) =>
      expect(enemy.to.x).toBe(queue[i].to.x - TILE_SIZE),
    );
  });
});

describe('chargers', () => {
  const t = tileOf(start);
  const charger = (x: number): Enemy => ({
    ...enemyAt(1, tileCenter({ x: t.x + x, y: t.y })),
    kind: 'charger',
  });

  it('line up on the snare, then dash four tiles on the downbeat', () => {
    const world = withEnemies(createWorld(level), [charger(6)]);
    const aimed = onBeat(world, { time: 1, beat: 2 });
    expect(aimed.enemies[0].aim?.x).toBeCloseTo(-1);
    expect(aimed.enemies[0].to).toEqual(world.enemies[0].to);

    const dashed = onBeat(aimed, { time: 2, beat: 0 });
    const [enemy] = dashed.enemies;
    expect(enemy.aim).toBeNull();
    expect(enemy.hopSeconds).toBe(0.18);
    expect(enemy.from.x - enemy.to.x).toBeCloseTo(4 * TILE_SIZE);
  });

  it('walk in on beat 2 when not lined up, and hold still otherwise', () => {
    const world = withEnemies(createWorld(level), [charger(6)]);
    expect(onBeat(world, { time: 1, beat: 1 }).enemies[0].to.x).toBe(
      world.enemies[0].to.x - TILE_SIZE,
    );
    expect(onBeat(world, { time: 1, beat: 3 }).enemies[0]).toBe(
      world.enemies[0],
    );
  });
});

describe('stepWorld', () => {
  it('fires a queued shot once it sounds, not before', () => {
    const world = queueShot(createWorld(level), shot(2));
    const early = stepWorld(world, { input: still, dt: 1 / 60, now: 1.9 });
    expect(early.world.projectiles).toEqual([]);
    const onTime = stepWorld(early.world, { input: still, dt: 1 / 60, now: 2 });
    expect(onTime.world.projectiles).toHaveLength(1);
  });

  it('reports a kill where the enemy died', () => {
    const target = { x: start.x + 50, y: start.y };
    const world = queueShot(
      withEnemies(createWorld(level), [enemyAt(9, target, 1)]),
      shot(1),
    );
    const { kills } = stepWorld(world, { input: still, dt: 1 / 60, now: 1 });
    expect(kills).toEqual([target]);
  });

  it('stops projectiles at walls', () => {
    // Long-lived shots aimed at the arena's east wall.
    const world = queueShot(createWorld(level), {
      ...shot(0),
      spec: { ...shot(0).spec, lifetime: 5 },
    });
    const flown = Array.from({ length: 150 }, (_, i) => i).reduce(
      (current, i) =>
        stepWorld(current, { input: still, dt: 1 / 60, now: i / 60 }).world,
      world,
    );
    expect(flown.projectiles).toEqual([]);
  });

  it('counts kills', () => {
    const target = { x: start.x + 50, y: start.y };
    const world = queueShot(
      withEnemies(createWorld(level, undefined, { kills: 4 }), [
        enemyAt(9, target, 1),
      ]),
      shot(1),
    );
    expect(
      stepWorld(world, { input: still, dt: 1 / 60, now: 1 }).world.kills,
    ).toBe(5);
  });

  it('scores kills, more for kills chained on consecutive beats', () => {
    const at = (x: number) => ({ x: start.x + x, y: start.y });
    const firstKill = stepWorld(
      queueShot(
        withEnemies(createWorld(level), [enemyAt(1, at(50), 1)]),
        shot(1),
      ),
      { input: still, dt: 1 / 60, now: 1, beat: 4 },
    ).world;
    expect(firstKill.score).toBe(100);
    const chained = stepWorld(
      queueShot(withEnemies(firstKill, [enemyAt(2, at(50), 1)]), shot(1.5)),
      { input: still, dt: 1 / 60, now: 1.5, beat: 5 },
    ).world;
    expect(chained.combo.count).toBe(2);
    expect(chained.score).toBe(300);
  });

  it('costs a hit point per hit, and the run ends at zero', () => {
    const near = { x: start.x + 10, y: start.y };
    const fresh = createWorld(level);
    expect(fresh.hp).toBe(PLAYER_MAX_HP);
    const hit = stepWorld(withEnemies(fresh, [enemyAt(1, near)]), {
      input: still,
      dt: 1 / 60,
      now: 1,
    });
    expect(hit.world.hp).toBe(PLAYER_MAX_HP - 1);
    expect(hit.world.status).toBe('playing');

    const lastHit = stepWorld(
      withEnemies({ ...hit.world, hp: 1 }, [enemyAt(2, near)]),
      { input: still, dt: 1 / 60, now: 2 },
    );
    expect(lastHit.world.hp).toBe(0);
    expect(lastHit.world.status).toBe('dead');
  });

  it('freezes once the run is over', () => {
    const dead = {
      ...queueShot(createWorld(level), shot(0)),
      status: 'dead' as const,
    };
    const after = stepWorld(dead, {
      input: { ...still, move: { x: 1, y: 0 } },
      dt: 1 / 60,
      now: 1,
    });
    expect(after.world).toBe(dead);
  });

  it('drops a good weapon and hearts where the boss falls', () => {
    const at = { x: start.x + 50, y: start.y };
    const boss: Enemy = { ...enemyAt(9, at, 1), kind: 'boss' };
    const { world } = stepWorld(
      queueShot(withEnemies(createWorld(level), [boss]), shot(1)),
      { input: still, dt: 1 / 60, now: 1 },
    );
    expect(world.pickups).toHaveLength(1);
    expect(world.pickups[0].recipe).toMatchObject({ manufacturer: 'vandal' });
    expect(world.hearts).toHaveLength(2);
  });

  it('heals on walking over a heart, only with health to heal', () => {
    const heart = { id: 99, position: start };
    const hurt = { ...createWorld(level), hp: 3, hearts: [heart] };
    const healed = stepWorld(hurt, { input: still, dt: 1 / 60, now: 1 });
    expect(healed.world.hp).toBe(4);
    expect(healed.world.hearts).toEqual([]);
    expect(healed.healed).toEqual([start]);

    const cap = hpCap(createWorld(level));
    const capped = { ...createWorld(level), hp: cap, hearts: [heart] };
    const kept = stepWorld(capped, { input: still, dt: 1 / 60, now: 1 });
    expect(kept.world.hp).toBe(cap);
    expect(kept.world.hearts).toEqual([heart]);
  });

  it('stacks bonus hearts on full health, up to the cap', () => {
    const heart = { id: 99, position: start };
    const full = { ...createWorld(level), hearts: [heart] };
    const bonus = stepWorld(full, { input: still, dt: 1 / 60, now: 1 });
    expect(bonus.world.hp).toBe(PLAYER_MAX_HP + 1);
    expect(hpCap(full)).toBe(PLAYER_MAX_HP + BONUS_HEARTS);
  });

  it('pulls hearts in from nearby, but leaves far ones be', () => {
    const near = { id: 98, position: { x: start.x + 120, y: start.y } };
    const far = { id: 99, position: { x: start.x + 400, y: start.y } };
    const hurt = { ...createWorld(level), hp: 3, hearts: [near, far] };
    const pulled = stepWorld(hurt, { input: still, dt: 1 / 60, now: 1 });
    const [drawn, left] = pulled.world.hearts;
    expect(drawn.position.x).toBeLessThan(near.position.x);
    expect(left.position).toEqual(far.position);
  });

  it('leaves weapons where they fell', () => {
    const beside = { x: start.x + 60, y: start.y };
    const dropped = placePickup(createWorld(level), { seed: 7 }, beside);
    const after = stepWorld(dropped, { input: still, dt: 1 / 60, now: 1 });
    expect(after.world.pickups[0].position).toEqual(beside);
  });

  it('bursts a slow shot at the end of its range', () => {
    const lobbed = {
      ...shot(1),
      spec: {
        ...shot(1).spec,
        lifetime: 0.1,
        detonates: true,
        splash: { radius: 96, damage: 1, knockback: 40 },
      },
    };
    const world = queueShot(createWorld(level), lobbed);
    const flying = stepWorld(world, { input: still, dt: 1 / 60, now: 1 });
    expect(flying.blasts).toEqual([]);
    const spent = stepWorld(flying.world, {
      input: still,
      dt: 1 / 60,
      now: 1.2,
    });
    expect(spent.blasts).toHaveLength(1);
    expect(spent.world.projectiles).toEqual([]);
  });

  it("fires the boss's ring of orbs on the snare, and they hurt", () => {
    const far = { x: start.x + 4 * TILE_SIZE, y: start.y };
    const boss: Enemy = { ...enemyAt(1, far, 30), kind: 'boss' };
    const world = withEnemies(createWorld(level), [boss]);
    const woundUp = onBeat(world, {
      time: 1,
      beat: 1,
      bar: 0,
      beatSeconds: 0.4,
    });
    expect(woundUp.enemies[0].windupUntil).toBeCloseTo(1.4);
    expect(woundUp.hostiles).toEqual([]);
    const fired = onBeat(woundUp, { time: 1.4, beat: 2, bar: 0 });
    expect(fired.hostiles.length).toBeGreaterThan(8);

    const orb = {
      ...fired.hostiles[0],
      from: start,
      velocity: { x: 0, y: 0 },
      firedAt: 2,
      expiresAt: 5,
    };
    const hit = stepWorld(
      { ...world, hostiles: [orb] },
      { input: still, dt: 1 / 60, now: 2 },
    );
    expect(hit.world.hp).toBe(PLAYER_MAX_HP - 1);
    expect(hit.world.hostiles).toEqual([]);
  });

  it("doesn't dash before the first press, even on a clock short of zero", () => {
    const after = stepWorld(createWorld(level), {
      input: still,
      dt: 1 / 60,
      now: -0.001,
    });
    expect(after.world.player.position).toEqual(start);
  });

  it('dashes along the stick, then waits out its cooldown in beats', () => {
    const go = { ...still, move: { x: 0, y: -1 }, dash: true };
    const dashed = stepWorld(createWorld(level), {
      input: go,
      dt: 1 / 60,
      now: 1,
      beatSeconds: 0.5,
    });
    const moved = start.y - dashed.world.player.position.y;
    expect(moved).toBeGreaterThan(20);
    expect(dashed.world.dash.readyAt).toBeCloseTo(2);
    const again = stepWorld(dashed.world, {
      input: go,
      dt: 1 / 60,
      now: 1.5,
      beatSeconds: 0.5,
    });
    expect(again.world.dash).toBe(dashed.world.dash);
  });

  it('passes through enemies and orbs while dashing', () => {
    const near = { x: start.x + 10, y: start.y };
    const world = withEnemies(createWorld(level), [enemyAt(1, near)]);
    const dashing = { ...world, dash: { ...world.dash, until: 2, readyAt: 3 } };
    const through = stepWorld(dashing, { input: still, dt: 1 / 60, now: 1 });
    expect(through.world.hp).toBe(PLAYER_MAX_HP);
    expect(through.world.enemies).toHaveLength(1);
  });

  it('lets the boss shrug off contact: it hits, but stays', () => {
    const near = { x: start.x + 10, y: start.y };
    const boss: Enemy = { ...enemyAt(1, near, 30), kind: 'boss' };
    const hit = stepWorld(withEnemies(createWorld(level), [boss]), {
      input: still,
      dt: 1 / 60,
      now: 1,
    });
    expect(hit.world.hp).toBe(PLAYER_MAX_HP - 1);
    expect(hit.world.enemies).toHaveLength(1);
  });

  it('puts weapons down and picks them up', () => {
    const world = placePickup(createWorld(level), { seed: 7 }, start);
    expect(world.pickups).toEqual([
      { id: expect.any(Number), position: start, recipe: { seed: 7 } },
    ]);
    expect(takePickup(world, world.pickups[0].id).pickups).toEqual([]);
  });

  it('only lets the player out once the final wave has fallen', () => {
    const onPad = {
      ...fighting(),
      enemies: [],
      player: { ...createWorld(level).player, position: level.pad },
    };
    const shut = stepWorld(onPad, { input: still, dt: 1 / 60, now: 1 });
    expect(isExitOpen(onPad)).toBe(false);
    expect(shut.world.status).toBe('playing');

    const ready = {
      ...onPad,
      survival: { ...onPad.survival, phase: 'clear' as const },
    };
    expect(isExitOpen(ready)).toBe(true);
    expect(
      stepWorld(ready, { input: still, dt: 1 / 60, now: 1 }).world.status,
    ).toBe('cleared');
  });

  it('pays a bonus for taking the exit', () => {
    const ready = {
      ...fighting(),
      enemies: [],
      score: 2_300,
      player: { ...createWorld(level).player, position: level.pad },
      survival: { ...fighting().survival, phase: 'clear' as const },
    };
    const cleared = stepWorld(ready, { input: still, dt: 1 / 60, now: 1 });
    expect(cleared.world.score).toBe(2_300 + LEVEL_CLEAR_BONUS);
    // A level that's over doesn't step again, so it can't pay twice.
    expect(
      stepWorld(cleared.world, { input: still, dt: 1 / 60, now: 2 }).world
        .score,
    ).toBe(2_300 + LEVEL_CLEAR_BONUS);
  });

  it('hits the player once, then gives a moment of invulnerability', () => {
    const near = { x: start.x + 10, y: start.y };
    const hit = stepWorld(withEnemies(createWorld(level), [enemyAt(1, near)]), {
      input: still,
      dt: 1 / 60,
      now: 1,
    });
    expect(hit.playerHit).not.toBeNull();
    const again = stepWorld(withEnemies(hit.world, [enemyAt(2, near)]), {
      input: still,
      dt: 1 / 60,
      now: 1.2,
    });
    expect(again.playerHit).toBeNull();
  });
});

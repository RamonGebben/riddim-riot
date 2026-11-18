import { describe, expect, it } from 'vitest';
import {
  distanceAt,
  distanceField,
  generateLevel,
  tileCenter,
  tileOf,
  TILE_SIZE,
  type Level,
} from '../../level';
import { createRng } from '../../rng';
import type { Enemy } from '../enemy';
import {
  createWorld,
  isExitOpen,
  onBar,
  onBeat,
  PLAYER_MAX_HP,
  queueShot,
  rulesFor,
  stepWorld,
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
  hp,
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

describe('onBar', () => {
  it('runs waves on the song: intro, fight, clear, next wave', () => {
    const rng = createRng(1);
    const world = createWorld(level);
    expect(onBar(world, { bar: 1, time: 1, rng }).enemies).toEqual([]);
    const fighting = onBar(world, { bar: 2, time: 2, rng });
    expect(fighting.enemies).toHaveLength(3);
    expect(fighting.waves.phase).toBe('fight');

    const cleared = onBar(
      { ...fighting, enemies: [] },
      { bar: 5, time: 5, rng },
    );
    expect(cleared.waves).toMatchObject({ phase: 'cleared', cleared: 1 });
    const next = onBar(cleared, { bar: 9, time: 9, rng });
    expect(next.enemies).toHaveLength(5);
  });

  it('gives enemies more hit points on later levels', () => {
    const world = createWorld(level, rulesFor({ level: 3 }));
    const fighting = onBar(world, { bar: 1, time: 1, rng: createRng(1) });
    fighting.enemies.forEach(enemy => expect(enemy.hp).toBe(3));
  });

  it('fills the level to the enemy cap in stress mode, from the first bar', () => {
    const world = createWorld(level, rulesFor({ level: 1, stress: true }));
    const filled = onBar(world, { bar: 0, time: 0, rng: createRng(1) });
    expect(filled.enemies).toHaveLength(30);
    expect(
      onBar(filled, { bar: 1, time: 1, rng: createRng(2) }).enemies,
    ).toHaveLength(30);
  });

  it('spawns 10-18 tiles away by walking distance, on floor', () => {
    const world = onBar(createWorld(level), {
      bar: 20,
      time: 1,
      rng: createRng(2),
    });
    expect(world.enemies.length).toBeGreaterThan(0);
    world.enemies.forEach(enemy => {
      expect(walk(enemy.to)).toBeGreaterThanOrEqual(10);
      expect(walk(enemy.to)).toBeLessThanOrEqual(18);
    });
  });
});

describe('onBeat', () => {
  it('hops each enemy one tile closer along the flow field', () => {
    const far = createWorld(level);
    const spawned = onBar(far, { bar: 20, time: 0, rng: createRng(4) });
    const hopped = onBeat(spawned, 1);
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
      1,
    );
    const landing = world.enemies.map(enemy => JSON.stringify(enemy.to));
    expect(new Set(landing).size).toBe(2);
  });

  it('lets a queue of enemies all move up at once', () => {
    const t = tileOf(start);
    const queue = [2, 3, 4].map((dx, i) =>
      enemyAt(i + 1, tileCenter({ x: t.x + dx, y: t.y })),
    );
    const world = onBeat(withEnemies(createWorld(level), queue), 1);
    world.enemies.forEach((enemy, i) =>
      expect(enemy.to.x).toBe(queue[i].to.x - TILE_SIZE),
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
    const t = tileOf(start);
    // The start room is open; its east border wall is a few tiles away.
    const world = queueShot(createWorld(level), shot(0));
    const flown = Array.from({ length: 30 }, (_, i) => i).reduce(
      (current, i) =>
        stepWorld(current, { input: still, dt: 1 / 60, now: i / 60 }).world,
      world,
    );
    flown.projectiles.forEach(projectile =>
      expect(tileOf(projectile.position).x).toBeLessThan(t.x + 9),
    );
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

  it('keeps the exit shut until enough waves are cleared', () => {
    const onPad = {
      ...createWorld(level),
      player: { ...createWorld(level).player, position: level.exit },
    };
    const shut = stepWorld(onPad, { input: still, dt: 1 / 60, now: 1 });
    expect(isExitOpen(onPad)).toBe(false);
    expect(shut.world.status).toBe('playing');

    const ready = {
      ...onPad,
      waves: { ...onPad.waves, cleared: onPad.rules.wavesToClear },
    };
    expect(isExitOpen(ready)).toBe(true);
    expect(
      stepWorld(ready, { input: still, dt: 1 / 60, now: 1 }).world.status,
    ).toBe('cleared');
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

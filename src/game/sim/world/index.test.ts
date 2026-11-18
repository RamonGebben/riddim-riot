import { describe, expect, it } from 'vitest';
import { createRng } from '../../rng';
import { TILE, type Enemy } from '../enemy';
import {
  createWorld,
  onBar,
  onBeat,
  queueShot,
  stepWorld,
  type World,
} from '.';

const bounds = { width: 2048, height: 1536 };
const still = { move: { x: 0, y: 0 }, aimAt: { x: 2000, y: 768 } };

const withEnemy = (world: World, x: number, hp = 2): World => {
  const enemy: Enemy = {
    id: 99,
    hp,
    from: { x, y: 768 },
    to: { x, y: 768 },
    hopAt: 0,
    spawnAt: 0,
  };
  return { ...world, enemies: [enemy] };
};

describe('onBar', () => {
  it('keeps the first bars quiet, then spawns growing waves', () => {
    const world = createWorld(bounds);
    const rng = createRng(1);
    expect(onBar(world, { bar: 1, time: 1, rng }).enemies).toEqual([]);
    const first = onBar(world, { bar: 2, time: 2, rng });
    expect(first.enemies).toHaveLength(1);
    expect(first.nextId).toBe(2);
    expect(onBar(first, { bar: 6, time: 6, rng }).enemies).toHaveLength(4);
  });
});

describe('onBeat', () => {
  it('hops every enemy a tile towards the player', () => {
    const world = onBeat(withEnemy(createWorld(bounds), 1024 + 300), 1);
    expect(world.enemies[0].to.x).toBe(1024 + 300 - TILE);
  });
});

describe('stepWorld', () => {
  it('fires a queued shot once it sounds, not before', () => {
    const world = queueShot(createWorld(bounds), 2);
    const early = stepWorld(world, { input: still, dt: 1 / 60, now: 1.9 });
    expect(early.world.projectiles).toEqual([]);
    const onTime = stepWorld(early.world, {
      input: still,
      dt: 1 / 60,
      now: 2,
    });
    expect(onTime.world.projectiles).toHaveLength(1);
    expect(onTime.world.pendingShots).toEqual([]);
  });

  it('reports a kill where the enemy died', () => {
    const start = queueShot(withEnemy(createWorld(bounds), 1024 + 50, 1), 1);
    const { kills, world } = stepWorld(start, {
      input: still,
      dt: 1 / 60,
      now: 1,
    });
    expect(kills).toEqual([{ x: 1074, y: 768 }]);
    expect(world.enemies).toEqual([]);
  });

  it('hits the player once, then gives a moment of invulnerability', () => {
    const start = withEnemy(createWorld(bounds), 1024 + 10);
    const hit = stepWorld(start, { input: still, dt: 1 / 60, now: 1 });
    expect(hit.playerHit).not.toBeNull();
    expect(hit.world.enemies).toEqual([]);

    const again = stepWorld(withEnemy(hit.world, 1024 + 10), {
      input: still,
      dt: 1 / 60,
      now: 1.2,
    });
    expect(again.playerHit).toBeNull();
  });
});

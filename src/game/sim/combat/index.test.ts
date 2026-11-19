import { describe, expect, it } from 'vitest';
import type { Enemy } from '../enemy';
import type { Projectile } from '../projectile';
import { resolveContacts, resolveHits } from '.';

const enemy = (id: number, x: number, hp = 2): Enemy => ({
  id,
  kind: 'hopper',
  hp,
  hopSeconds: 0.11,
  aim: null,
  from: { x, y: 0 },
  to: { x, y: 0 },
  hopAt: 0,
  spawnAt: 0,
});

const shotAt = (x: number, damage = 1): Projectile => ({
  kind: 'blob',
  radius: 9,
  damage,
  position: { x, y: 0 },
  velocity: { x: 1, y: 0 },
  expiresAt: 10,
});

describe('resolveHits', () => {
  it('spends a projectile on the first enemy it touches', () => {
    const result = resolveHits([shotAt(100)], [enemy(1, 105)], 1);
    expect(result.projectiles).toEqual([]);
    expect(result.enemies[0].hp).toBe(1);
    expect(result.killed).toEqual([]);
  });

  it('kills an enemy at zero hp and reports where it died', () => {
    const result = resolveHits([shotAt(100)], [enemy(1, 105, 1)], 1);
    expect(result.enemies).toEqual([]);
    expect(result.killed).toEqual([
      { enemy: expect.objectContaining({ id: 1 }), position: { x: 105, y: 0 } },
    ]);
  });

  it('lets misses fly on, and two shots can share a kill', () => {
    const result = resolveHits(
      [shotAt(100), shotAt(102), shotAt(900)],
      [enemy(1, 105)],
      1,
    );
    expect(result.projectiles).toEqual([shotAt(900)]);
    expect(result.killed).toHaveLength(1);
  });

  it("deals the projectile's own damage", () => {
    const result = resolveHits([shotAt(100, 0.5)], [enemy(1, 105)], 1);
    expect(result.enemies[0].hp).toBe(1.5);
  });

  it('ignores enemies that have not spawned yet', () => {
    const later = { ...enemy(1, 105), spawnAt: 5 };
    expect(resolveHits([shotAt(100)], [later], 1).projectiles).toHaveLength(1);
  });
});

describe('resolveContacts', () => {
  it('bursts enemies that reach the player', () => {
    const result = resolveContacts(
      { x: 0, y: 0 },
      [enemy(1, 20), enemy(2, 400)],
      1,
    );
    expect(result.enemies.map(e => e.id)).toEqual([2]);
    expect(result.touched.map(t => t.enemy.id)).toEqual([1]);
  });
});

describe('resolveHits with a splashing shot', () => {
  it('reports where it hit, for its blast', () => {
    const splash = { radius: 64, damage: 0.5, knockback: 40 };
    const result = resolveHits(
      [{ ...shotAt(100), splash }, shotAt(300)],
      [enemy(1, 105), enemy(2, 305)],
      1,
    );
    expect(result.impacts).toEqual([{ position: { x: 100, y: 0 }, splash }]);
  });
});

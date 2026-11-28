import { describe, expect, it } from 'vitest';
import { isWall, tileOf } from '../../level';
import { createWorld, rulesFor, stepWorld } from '../../sim/world';
import { DUMMY_TILES, rangeLevel, restock } from '.';

const key = { root: 5, scale: 'minor' } as const;
const rules = { ...rulesFor({ level: 1, god: true, skipCircle: true }) };

describe('the firing range', () => {
  const level = rangeLevel(key);

  it('is one open room, walled round', () => {
    expect(isWall(level.map, { x: 0, y: 0 })).toBe(true);
    expect(isWall(level.map, tileOf(level.start))).toBe(false);
    DUMMY_TILES.forEach(tile => expect(isWall(level.map, tile)).toBe(false));
  });

  it('stands a dummy on every spot', () => {
    const world = restock(createWorld(level, rules), 2);
    expect(world.enemies).toHaveLength(DUMMY_TILES.length);
    expect(world.enemies.every(enemy => enemy.spawnAt === 2)).toBe(true);
  });

  it('only puts back the dummies that fell', () => {
    const world = restock(createWorld(level, rules), 0);
    const [, ...standing] = world.enemies;
    const again = restock({ ...world, enemies: standing }, 5);
    expect(again.enemies).toHaveLength(DUMMY_TILES.length);
    expect(again.enemies.filter(enemy => enemy.spawnAt === 5)).toHaveLength(1);
    expect(again.enemies.map(enemy => enemy.id).toSorted()).toEqual(
      world.enemies.map(enemy => enemy.id).toSorted(),
    );
  });

  it('keeps its dummies where they stand as the world steps', () => {
    const world = restock(createWorld(level, rules), 0);
    const { world: after } = stepWorld(world, {
      input: { move: { x: 0, y: 0 }, aimAt: { x: 0, y: 0 } },
      dt: 1 / 60,
      now: 1,
    });
    expect(after.enemies.map(enemy => enemy.to)).toEqual(
      world.enemies.map(enemy => enemy.to),
    );
    expect(after.status).toBe('playing');
  });
});

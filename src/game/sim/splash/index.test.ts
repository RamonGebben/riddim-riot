import { describe, expect, it } from 'vitest';
import { tileCenter, type Tilemap } from '../../level';
import type { Enemy } from '../enemy';
import { enemyPosition } from '../enemy';
import { KNOCKBACK_SECONDS, resolveBlasts } from '.';

// An open 10×10 room walled at the edges.
const size = 10;
const map: Tilemap = {
  width: size,
  height: size,
  tiles: Array.from({ length: size * size }, (_, i) => {
    const x = i % size;
    const y = Math.floor(i / size);
    return x === 0 || y === 0 || x === size - 1 || y === size - 1
      ? 'wall'
      : 'floor';
  }),
};
const center = tileCenter({ x: 5, y: 5 });

const enemy = (id: number, dx: number, hp = 2): Enemy => ({
  id,
  kind: 'charger',
  hp,
  hopSeconds: 0.11,
  aim: { x: 1, y: 0 },
  from: { x: center.x + dx, y: center.y },
  to: { x: center.x + dx, y: center.y },
  hopAt: 0,
  spawnAt: 0,
});

const blast = {
  position: center,
  splash: { radius: 80, damage: 1, knockback: 40 },
};

describe('resolveBlasts', () => {
  it('damages everything in reach and leaves the rest', () => {
    const result = resolveBlasts(
      [blast],
      [enemy(1, 30), enemy(2, 200)],
      map,
      1,
    );
    expect(result.enemies.map(e => e.hp)).toEqual([1, 2]);
  });

  it('shoves enemies straight away from the blast and breaks a charge', () => {
    const [shoved] = resolveBlasts([blast], [enemy(1, 30)], map, 1).enemies;
    expect(shoved.aim).toBeNull();
    const landed = enemyPosition(shoved, 1 + KNOCKBACK_SECONDS);
    expect(landed.x).toBeCloseTo(center.x + 70);
    expect(landed.y).toBeCloseTo(center.y);
  });

  it('kills at zero hp', () => {
    const result = resolveBlasts([blast], [enemy(1, -20, 1)], map, 1);
    expect(result.enemies).toEqual([]);
    expect(result.killed).toHaveLength(1);
  });
});

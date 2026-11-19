import { describe, expect, it } from 'vitest';
import { tileCenter, TILE_SIZE, type Tilemap } from '../../level';
import type { Enemy } from '../enemy';
import { spawnPlayer } from '../player';
import { fireBeam, resolveBeams, type Beam } from '.';

const enemy = (id: number, x: number, y = 0, hp = 1): Enemy => ({
  id,
  kind: 'hopper',
  hp,
  hopSeconds: 0.11,
  aim: null,
  from: { x, y },
  to: { x, y },
  hopAt: 0,
  spawnAt: 0,
});

const ray = (overrides: Partial<Beam> = {}): Beam => ({
  origin: { x: 0, y: 0 },
  direction: { x: 1, y: 0 },
  angle: 0,
  length: 400,
  radius: 9,
  damage: 0.5,
  expiresAt: 1,
  ...overrides,
});

describe('resolveBeams', () => {
  it('pierces: every enemy along the ray takes the damage', () => {
    const result = resolveBeams(
      [ray()],
      [enemy(1, 100, 0, 2), enemy(2, 300, 0, 2)],
      0.5,
    );
    expect(result.enemies.map(e => e.hp)).toEqual([1.5, 1.5]);
  });

  it('misses what is off to the side or past its reach', () => {
    const result = resolveBeams(
      [ray()],
      [enemy(1, 100, 80), enemy(2, 600, 0), enemy(3, -60, 0)],
      0.5,
    );
    expect(result.killed).toEqual([]);
  });

  it('kills at zero hp and reports where', () => {
    const result = resolveBeams([ray({ damage: 1 })], [enemy(1, 200)], 0.5);
    expect(result.enemies).toEqual([]);
    expect(result.killed[0].position).toEqual({ x: 200, y: 0 });
  });
});

describe('fireBeam', () => {
  // A corridor 10 tiles long with a wall at tile 6.
  const width = 10;
  const tiles = Array.from({ length: width * 3 }, (_, i) => {
    const x = i % width;
    const y = Math.floor(i / width);
    const wall = y !== 1 || x === 0 || x === 6 || x === width - 1;
    return wall ? 'wall' : 'floor';
  });
  const map: Tilemap = { width, height: 3, tiles };
  const player = spawnPlayer(tileCenter({ x: 1, y: 1 }));

  it('stops at the first wall', () => {
    const beam = fireBeam(
      player,
      {
        time: 0,
        angle: 0,
        spec: {
          kind: 'beam',
          speed: 2000,
          lifetime: 1,
          radius: 9,
          damage: 1,
          spread: 0,
        },
      },
      map,
    );
    const end = beam.origin.x + beam.length;
    expect(end).toBeLessThanOrEqual(6 * TILE_SIZE);
    expect(end).toBeGreaterThan(5 * TILE_SIZE);
  });
});

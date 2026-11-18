import { describe, expect, it } from 'vitest';
import { createRng } from '../../rng';
import { length, subtract } from '../../vec';
import {
  enemyPosition,
  HOP_SECONDS,
  isSpawned,
  MAX_ENEMIES,
  planHop,
  spawnWave,
  TILE,
  waveSize,
  type Enemy,
} from '.';

const bounds = { width: 2048, height: 1536 };

const enemyAt = (x: number, y: number): Enemy => ({
  id: 1,
  hp: 2,
  from: { x, y },
  to: { x, y },
  hopAt: 0,
  spawnAt: 0,
});

describe('planHop', () => {
  it('hops one tile towards the target, starting at the beat', () => {
    const hopped = planHop(enemyAt(0, 0), { x: 500, y: 0 }, 2);
    expect(hopped.from).toEqual({ x: 0, y: 0 });
    expect(hopped.to).toEqual({ x: TILE, y: 0 });
    expect(hopped.hopAt).toBe(2);
  });

  it('lands on a target closer than a tile', () => {
    expect(planHop(enemyAt(0, 0), { x: 10, y: 0 }, 1).to).toEqual({
      x: 10,
      y: 0,
    });
  });

  it('waits until it has spawned', () => {
    const unspawned = { ...enemyAt(0, 0), spawnAt: 5 };
    expect(planHop(unspawned, { x: 500, y: 0 }, 4)).toBe(unspawned);
  });
});

describe('enemyPosition', () => {
  const hopping = planHop(enemyAt(0, 0), { x: 500, y: 0 }, 1);

  it('stands still until the beat, then lands within the hop', () => {
    expect(enemyPosition(hopping, 0.99)).toEqual({ x: 0, y: 0 });
    expect(enemyPosition(hopping, 1 + HOP_SECONDS / 2).x).toBeGreaterThan(
      TILE / 2,
    );
    expect(enemyPosition(hopping, 1 + HOP_SECONDS)).toEqual({ x: TILE, y: 0 });
  });
});

describe('waveSize', () => {
  it('grows every two bars up to six', () => {
    expect([0, 2, 4, 20].map(bar => waveSize(bar, 0))).toEqual([1, 2, 3, 6]);
  });

  it('never takes the arena past the cap', () => {
    expect(waveSize(20, MAX_ENEMIES - 2)).toBe(2);
    expect(waveSize(20, MAX_ENEMIES)).toBe(0);
  });
});

describe('spawnWave', () => {
  const wave = (seed: number) =>
    spawnWave({
      rng: createRng(seed),
      count: 5,
      firstId: 10,
      around: { x: 1024, y: 768 },
      bounds,
      time: 3,
    });

  it('is reproducible from the seed, with sequential ids', () => {
    expect(wave(1)).toEqual(wave(1));
    expect(wave(1).map(enemy => enemy.id)).toEqual([10, 11, 12, 13, 14]);
  });

  it('spawns away from the player and inside the arena', () => {
    wave(2).forEach(enemy => {
      expect(length(subtract(enemy.to, { x: 1024, y: 768 }))).toBeGreaterThan(
        300,
      );
      expect(enemy.to.x).toBeGreaterThanOrEqual(TILE);
      expect(enemy.to.y).toBeLessThanOrEqual(bounds.height - TILE);
    });
  });

  it('appears at the bar time', () => {
    const [enemy] = wave(3);
    expect(isSpawned(enemy, 2.99)).toBe(false);
    expect(isSpawned(enemy, 3)).toBe(true);
  });
});

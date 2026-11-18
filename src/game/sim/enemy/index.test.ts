import { describe, expect, it } from 'vitest';
import { createRng } from '../../rng';
import {
  enemyPosition,
  HOP_SECONDS,
  isSpawned,
  planHop,
  spawnWave,
  type Enemy,
} from '.';

const TILE = 64;

const enemyAt = (x: number, y: number): Enemy => ({
  id: 1,
  kind: 'hopper',
  hp: 2,
  hopSeconds: HOP_SECONDS,
  aim: null,
  from: { x, y },
  to: { x, y },
  hopAt: 0,
  spawnAt: 0,
});

describe('planHop', () => {
  it('hops from where it stands to the next tile, starting at the beat', () => {
    const hopped = planHop(enemyAt(0, 0), { x: TILE, y: 0 }, 2);
    expect(hopped.from).toEqual({ x: 0, y: 0 });
    expect(hopped.to).toEqual({ x: TILE, y: 0 });
    expect(hopped.hopAt).toBe(2);
  });

  it('can take its own time, for a dash', () => {
    const dashed = planHop(enemyAt(0, 0), { x: 4 * TILE, y: 0 }, 2, 0.18);
    expect(enemyPosition(dashed, 2.18)).toEqual({ x: 4 * TILE, y: 0 });
    expect(enemyPosition(dashed, 2.09).x).toBeGreaterThan(2 * TILE);
  });

  it('waits until it has spawned', () => {
    const unspawned = { ...enemyAt(0, 0), spawnAt: 5 };
    expect(planHop(unspawned, { x: TILE, y: 0 }, 4)).toBe(unspawned);
  });
});

describe('enemyPosition', () => {
  const hopping = planHop(enemyAt(0, 0), { x: TILE, y: 0 }, 1);

  it('stands still until the beat, then lands within the hop', () => {
    expect(enemyPosition(hopping, 0.99)).toEqual({ x: 0, y: 0 });
    expect(enemyPosition(hopping, 1 + HOP_SECONDS / 2).x).toBeGreaterThan(
      TILE / 2,
    );
    expect(enemyPosition(hopping, 1 + HOP_SECONDS)).toEqual({ x: TILE, y: 0 });
  });
});

describe('spawnWave', () => {
  const candidates = Array.from({ length: 20 }, (_, i) => ({
    x: i * TILE,
    y: 0,
  }));
  const wave = (seed: number) =>
    spawnWave({
      rng: createRng(seed),
      count: 5,
      firstId: 10,
      candidates,
      time: 3,
    });

  it('is reproducible from the seed, with sequential ids', () => {
    expect(wave(1)).toEqual(wave(1));
    expect(wave(1).map(enemy => enemy.id)).toEqual([10, 11, 12, 13, 14]);
  });

  it('puts each enemy on a different candidate spot', () => {
    const spots = wave(2).map(enemy => JSON.stringify(enemy.to));
    expect(new Set(spots).size).toBe(5);
    spots.forEach(spot =>
      expect(candidates.map(c => JSON.stringify(c))).toContain(spot),
    );
  });

  it('spawns fewer when there are fewer spots', () => {
    expect(
      spawnWave({
        rng: createRng(1),
        count: 5,
        firstId: 1,
        candidates: candidates.slice(0, 2),
        time: 0,
      }),
    ).toHaveLength(2);
  });

  it('mixes chargers in, tougher than hoppers', () => {
    const mixed = spawnWave({
      rng: createRng(4),
      count: 20,
      firstId: 1,
      candidates,
      time: 0,
      hp: 2,
      chargerChance: 0.5,
    });
    const chargers = mixed.filter(enemy => enemy.kind === 'charger');
    expect(chargers.length).toBeGreaterThan(3);
    expect(chargers.length).toBeLessThan(17);
    chargers.forEach(enemy => expect(enemy.hp).toBe(3));
    expect(wave(1).every(enemy => enemy.kind === 'hopper')).toBe(true);
  });

  it('appears at the bar time', () => {
    const [enemy] = wave(3);
    expect(isSpawned(enemy, 2.99)).toBe(false);
    expect(isSpawned(enemy, 3)).toBe(true);
  });
});

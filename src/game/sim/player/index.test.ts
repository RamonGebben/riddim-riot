import { describe, expect, it } from 'vitest';
import type { Tilemap } from '../../level';
import { spawnPlayer, stepPlayer, type Player, type PlayerInput } from '.';

/** 16×13 tiles of floor inside a wall border. */
const map: Tilemap = {
  width: 16,
  height: 13,
  tiles: Array.from({ length: 16 * 13 }, (_, i) => {
    const x = i % 16;
    const y = Math.floor(i / 16);
    return x === 0 || y === 0 || x === 15 || y === 12 ? 'wall' : 'floor';
  }),
};
const start = { x: 512, y: 416 };
const still: PlayerInput = { move: { x: 0, y: 0 }, aimAt: { x: 600, y: 416 } };

const simulate = (player: Player, input: PlayerInput, seconds: number) =>
  Array.from({ length: Math.round(seconds * 60) }).reduce<Player>(
    current => stepPlayer(current, input, 1 / 60, map),
    player,
  );

describe('stepPlayer', () => {
  it('spawns where the level says', () => {
    expect(spawnPlayer(start).position).toEqual(start);
  });

  it('moves along the stick', () => {
    const moved = simulate(
      spawnPlayer(start),
      { ...still, move: { x: 1, y: 0 } },
      0.25,
    );
    expect(moved.position.x).toBeGreaterThan(560);
    expect(moved.position.y).toBeCloseTo(416);
  });

  it('comes to a stop quickly once the stick is released', () => {
    const running = simulate(
      spawnPlayer(start),
      { ...still, move: { x: 1, y: 0 } },
      0.25,
    );
    const stopped = simulate(running, still, 0.3);
    expect(Math.abs(stopped.velocity.x)).toBeLessThan(5);
  });

  it('is frame-rate independent', () => {
    const input = { ...still, move: { x: 0, y: 1 } };
    const at60 = simulate(spawnPlayer(start), input, 0.25);
    const at30 = Array.from({ length: 8 }).reduce<Player>(
      current => stepPlayer(current, input, 1 / 32, map),
      spawnPlayer(start),
    );
    expect(at30.position.y).toBeCloseTo(at60.position.y, -1);
  });

  it('is stopped by walls', () => {
    const pushed = simulate(
      spawnPlayer(start),
      { ...still, move: { x: -1, y: 0 } },
      5,
    );
    expect(pushed.position.x).toBeGreaterThanOrEqual(64 + 18);
    expect(pushed.position.x).toBeLessThan(64 + 18 + 5);
  });

  it('aims at the cursor', () => {
    const aimed = stepPlayer(
      spawnPlayer(start),
      { ...still, aimAt: { x: 512, y: 0 } },
      1 / 60,
      map,
    );
    expect(aimed.aim).toBeCloseTo(-Math.PI / 2);
  });
});

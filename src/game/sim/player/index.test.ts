import { describe, expect, it } from 'vitest';
import { spawnPlayer, stepPlayer, type Player, type PlayerInput } from '.';

const bounds = { width: 1000, height: 800 };
const still: PlayerInput = { move: { x: 0, y: 0 }, aimAt: { x: 600, y: 400 } };

const simulate = (player: Player, input: PlayerInput, seconds: number) =>
  Array.from({ length: Math.round(seconds * 60) }).reduce<Player>(
    current => stepPlayer(current, input, 1 / 60, bounds),
    player,
  );

describe('stepPlayer', () => {
  it('spawns in the middle of the arena', () => {
    expect(spawnPlayer(bounds).position).toEqual({ x: 500, y: 400 });
  });

  it('moves along the stick', () => {
    const moved = simulate(
      spawnPlayer(bounds),
      { ...still, move: { x: 1, y: 0 } },
      0.5,
    );
    expect(moved.position.x).toBeGreaterThan(600);
    expect(moved.position.y).toBeCloseTo(400);
  });

  it('comes to a stop quickly once the stick is released', () => {
    const running = simulate(
      spawnPlayer(bounds),
      { ...still, move: { x: 1, y: 0 } },
      0.5,
    );
    const stopped = simulate(running, still, 0.3);
    expect(Math.abs(stopped.velocity.x)).toBeLessThan(5);
  });

  it('is frame-rate independent', () => {
    const input = { ...still, move: { x: 0, y: 1 } };
    const at60 = simulate(spawnPlayer(bounds), input, 0.25);
    const at30 = Array.from({ length: 8 }).reduce<Player>(
      current => stepPlayer(current, input, 1 / 32, bounds),
      spawnPlayer(bounds),
    );
    expect(at30.position.y).toBeCloseTo(at60.position.y, -1);
  });

  it('stays inside the arena', () => {
    const pushed = simulate(
      spawnPlayer(bounds),
      { ...still, move: { x: -1, y: 0 } },
      5,
    );
    expect(pushed.position.x).toBe(18);
  });

  it('aims at the cursor', () => {
    const aimed = stepPlayer(
      spawnPlayer(bounds),
      { ...still, aimAt: { x: 500, y: 0 } },
      1 / 60,
      bounds,
    );
    expect(aimed.aim).toBeCloseTo(-Math.PI / 2);
  });
});

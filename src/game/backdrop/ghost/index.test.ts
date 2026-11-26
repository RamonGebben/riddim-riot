import { describe, expect, it } from 'vitest';
import { ghostAt } from '.';

const origin = { x: 500, y: 400 };
/** Halftime kicks at 170 BPM: the demo follows any tempo. */
const SHOT_SECONDS = (60 / 170) * 2;
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

describe('ghostAt', () => {
  it('fires from the circle on the kick', () => {
    const { projectiles } = ghostAt(SHOT_SECONDS * 3, origin, SHOT_SECONDS);
    expect(projectiles).toHaveLength(1);
    expect(distance(projectiles[0].position, origin)).toBeCloseTo(0);
  });

  it('lands the shot on its target at the next kick', () => {
    const late = ghostAt(SHOT_SECONDS * 4 - 1e-6, origin, SHOT_SECONDS);
    const [shot] = late.projectiles;
    const target = late.enemies[0];
    expect(distance(shot.position, target.to)).toBeLessThan(1);
    const next = ghostAt(SHOT_SECONDS * 4, origin, SHOT_SECONDS);
    expect(next.bursts[0].time).toBeCloseTo(SHOT_SECONDS * 4);
    expect(distance(next.bursts[0].position, target.to)).toBeCloseTo(0);
  });

  it('keeps two targets up: the one under fire and the next', () => {
    const { enemies } = ghostAt(SHOT_SECONDS * 5.5, origin, SHOT_SECONDS);
    expect(enemies).toHaveLength(2);
    expect(new Set(enemies.map(enemy => enemy.id)).size).toBe(2);
    enemies.forEach(enemy =>
      expect(enemy.spawnAt).toBeLessThanOrEqual(SHOT_SECONDS * 5.5),
    );
  });

  it('aims at the target under fire', () => {
    const ghost = ghostAt(SHOT_SECONDS * 2.5, origin, SHOT_SECONDS);
    const target = ghost.enemies[0].to;
    expect(Math.cos(ghost.aim)).toBeCloseTo(
      (target.x - origin.x) / distance(target, origin),
    );
  });
});

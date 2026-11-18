import { describe, expect, it } from 'vitest';
import type { ProjectileSpec } from '../../weapons';
import { advanceProjectiles, fireProjectile } from '.';

const player = {
  position: { x: 100, y: 100 },
  velocity: { x: 0, y: 0 },
  aim: 0,
};
const spec: ProjectileSpec = {
  kind: 'blob',
  speed: 1000,
  radius: 9,
  damage: 1,
  lifetime: 0.5,
  spread: 0,
};

describe('projectiles', () => {
  it("leave the barrel along the aim, carrying the weapon's damage", () => {
    const shot = fireProjectile(player, { time: 1, spec, angle: 0 });
    expect(shot.position.x).toBeGreaterThan(100);
    expect(shot.position.y).toBeCloseTo(100);
    expect(shot.velocity.x).toBeCloseTo(1000);
    expect(shot.damage).toBe(1);
  });

  it('can stray off the aim', () => {
    const shot = fireProjectile(player, { time: 1, spec, angle: Math.PI / 2 });
    expect(shot.velocity.y).toBeCloseTo(1000);
  });

  it('fly for their lifetime, then fizzle out', () => {
    const shot = fireProjectile(player, { time: 1, spec, angle: 0 });
    const [moved] = advanceProjectiles([shot], 0.1, 1.1);
    expect(moved.position.x).toBeCloseTo(shot.position.x + 100);
    expect(advanceProjectiles([shot], 0.1, 1.5)).toEqual([]);
  });
});

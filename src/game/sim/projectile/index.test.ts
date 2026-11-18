import { describe, expect, it } from 'vitest';
import { advanceProjectiles, fireProjectile } from '.';

const player = {
  position: { x: 100, y: 100 },
  velocity: { x: 0, y: 0 },
  aim: 0,
};

describe('projectiles', () => {
  it('leave the barrel along the aim', () => {
    const shot = fireProjectile(player, 1);
    expect(shot.position.x).toBeGreaterThan(100);
    expect(shot.position.y).toBeCloseTo(100);
    expect(shot.velocity.x).toBeGreaterThan(0);
  });

  it('fly and then fizzle out', () => {
    const shot = fireProjectile(player, 1);
    const [moved] = advanceProjectiles([shot], 0.1, 1.1);
    expect(moved.position.x).toBeGreaterThan(shot.position.x + 100);
    expect(advanceProjectiles([shot], 0.1, 2)).toEqual([]);
  });
});

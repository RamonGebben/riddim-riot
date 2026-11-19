import { describe, expect, it } from 'vitest';
import type { Enemy } from '../enemy';
import { assistAim } from '.';

const enemy = (id: number, x: number, y: number, spawnAt = 0): Enemy => ({
  id,
  kind: 'hopper',
  hp: 1,
  hopSeconds: 0.11,
  aim: null,
  from: { x, y },
  to: { x, y },
  hopAt: 0,
  spawnAt,
});

const assist = (enemies: Array<Enemy>, cone = 0.2) =>
  assistAim({ aim: 0, from: { x: 0, y: 0 }, enemies, now: 1, cone });

describe('assistAim', () => {
  it('pulls a near miss onto the enemy', () => {
    const off = Math.atan2(10, 300);
    const aim = assist([enemy(1, 300, 10)]);
    expect(aim).toBeGreaterThan(off * 0.8);
    expect(aim).toBeLessThan(off);
  });

  it('pulls less the further off the enemy is, and not at all past the cone', () => {
    const near = assist([enemy(1, 300, 20)]) / Math.atan2(20, 300);
    const far = assist([enemy(1, 300, 50)]) / Math.atan2(50, 300);
    expect(far).toBeLessThan(near);
    expect(assist([enemy(1, 300, 80)])).toBe(0);
  });

  it('picks the enemy nearest the aim line', () => {
    const aim = assist([enemy(1, 300, -40), enemy(2, 300, 15)]);
    expect(aim).toBeGreaterThan(0);
  });

  it('turns the short way across ±π', () => {
    const aim = assistAim({
      aim: Math.PI - 0.02,
      from: { x: 0, y: 0 },
      enemies: [enemy(1, -300, -6)],
      now: 1,
      cone: 0.2,
    });
    expect(aim).toBeGreaterThan(Math.PI - 0.02);
  });

  it('ignores enemies out of reach, not yet spawned, or with no cone', () => {
    expect(assist([enemy(1, 2000, 10)])).toBe(0);
    expect(assist([enemy(1, 300, 10, 5)])).toBe(0);
    expect(assist([enemy(1, 300, 10)], 0)).toBe(0);
  });
});

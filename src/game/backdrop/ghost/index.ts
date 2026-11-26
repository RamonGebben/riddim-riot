import type { Burst } from '../../render/fxView';
import type { Enemy } from '../../sim/enemy';
import type { Projectile } from '../../sim/projectile';
import { add, scale, subtract, type Vec } from '../../vec';

/** How far from the circle the targets stand, in world px. */
const REACH = 240;
/** Each target this far round from the last: they never line up. */
const TURN = 2.4;

/** The silent demo the start page plays round the circle at `time`. */
export interface Ghost {
  aim: number;
  enemies: Array<Enemy>;
  projectiles: Array<Projectile>;
  bursts: Array<Burst>;
}

const spot = (origin: Vec, n: number, reach = REACH): Vec => ({
  x: origin.x + Math.cos(n * TURN) * reach,
  y: origin.y + Math.sin(n * TURN) * reach,
});

/**
 * Shot `n` fires at the circle on kick `n` and hits target `n` on kick
 * `n + 1`, bursting it. Target `n` hops in on kick `n - 1`, so two stand at
 * a time: the one under fire and the next. `kickSeconds` is the time from
 * one halftime kick to the next, the level's tempo. Pure, so the page can
 * scrub it.
 */
export const ghostAt = (
  time: number,
  origin: Vec,
  kickSeconds: number,
): Ghost => {
  const n = Math.floor(time / kickSeconds);
  const fired = n * kickSeconds;
  const target = spot(origin, n);
  const flown = (time - fired) / kickSeconds;
  const velocity = scale(subtract(target, origin), 1 / kickSeconds);
  const enemy = (i: number): Enemy => ({
    id: i + 1_000_000,
    kind: 'hopper',
    hp: 1,
    from: spot(origin, i, REACH * 1.4),
    to: spot(origin, i),
    hopAt: (i - 1) * kickSeconds,
    hopSeconds: kickSeconds / 2,
    spawnAt: (i - 1) * kickSeconds,
    aim: null,
  });
  const shot: Projectile = {
    kind: 'blob',
    position: add(origin, scale(velocity, time - fired)),
    velocity,
    radius: 7,
    damage: 1,
    expiresAt: fired + kickSeconds,
  };
  return {
    aim: n * TURN,
    enemies: [enemy(n), enemy(n + 1)],
    projectiles: flown < 1 ? [shot] : [],
    bursts: [{ position: spot(origin, n - 1), time: fired }],
  };
};

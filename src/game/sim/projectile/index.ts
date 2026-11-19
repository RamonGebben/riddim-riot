import { isWall, tileOf, type Tilemap } from '../../level';
import type { ProjectileKind, ProjectileSpec, Splash } from '../../weapons';
import { add, scale, type Vec } from '../../vec';
import { PLAYER_RADIUS, type Player } from '../player';

export interface Projectile {
  kind: ProjectileKind;
  position: Vec;
  velocity: Vec;
  radius: number;
  damage: number;
  /** Audio time it fizzles out. */
  expiresAt: number;
  splash?: Splash;
  /** Bursts at the end of its range or on a wall, not only on a hit. */
  detonates?: boolean;
}

/** A shot leaves the barrel at the moment it sounds, `angle` off the aim. */
export const fireProjectile = (
  player: Player,
  { time, spec, angle }: { time: number; spec: ProjectileSpec; angle: number },
): Projectile => {
  const heading = player.aim + angle;
  const direction = { x: Math.cos(heading), y: Math.sin(heading) };
  return {
    kind: spec.kind,
    position: add(player.position, scale(direction, PLAYER_RADIUS * 1.9)),
    velocity: scale(direction, spec.speed),
    radius: spec.radius,
    damage: spec.damage,
    expiresAt: time + spec.lifetime,
    ...(spec.splash ? { splash: spec.splash } : {}),
    ...(spec.detonates ? { detonates: true } : {}),
  };
};

export const advanceProjectiles = (
  projectiles: Array<Projectile>,
  dt: number,
  now: number,
): Array<Projectile> =>
  projectiles
    .filter(projectile => projectile.expiresAt > now)
    .map(projectile => ({
      ...projectile,
      position: add(projectile.position, scale(projectile.velocity, dt)),
    }));

/**
 * One frame of flight: what's still flying, and the detonating shots that
 * ran out of range or reached a wall - they burst where they last were.
 */
export const flyProjectiles = (
  projectiles: Array<Projectile>,
  { dt, now, map }: { dt: number; now: number; map: Tilemap },
): { flying: Array<Projectile>; spent: Array<Projectile> } =>
  projectiles.reduce<{
    flying: Array<Projectile>;
    spent: Array<Projectile>;
  }>(
    (acc, projectile) => {
      const [moved] = advanceProjectiles([projectile], dt, now);
      if (moved && !isWall(map, tileOf(moved.position))) {
        return { ...acc, flying: [...acc.flying, moved] };
      }
      return projectile.detonates
        ? { ...acc, spent: [...acc.spent, projectile] }
        : acc;
    },
    { flying: [], spent: [] },
  );

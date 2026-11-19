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

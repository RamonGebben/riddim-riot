import { add, scale, type Vec } from '../../vec';
import { PLAYER_RADIUS, type Player } from '../player';

export const PROJECTILE_RADIUS = 9;
const SPEED = 1100;
const LIFETIME = 0.5;

export interface Projectile {
  position: Vec;
  velocity: Vec;
  /** Audio time it fizzles out. */
  expiresAt: number;
}

/** A shot leaves the barrel at the moment it sounds. */
export const fireProjectile = (player: Player, time: number): Projectile => {
  const direction = { x: Math.cos(player.aim), y: Math.sin(player.aim) };
  return {
    position: add(player.position, scale(direction, PLAYER_RADIUS * 1.9)),
    velocity: scale(direction, SPEED),
    expiresAt: time + LIFETIME,
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

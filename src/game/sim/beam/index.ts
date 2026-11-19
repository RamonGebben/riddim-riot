import { isWall, TILE_SIZE, tileOf, type Tilemap } from '../../level';
import { add, length, scale, subtract, type Vec } from '../../vec';
import { ENEMY_RADIUS, enemyPosition, isSpawned, type Enemy } from '../enemy';
import { PLAYER_RADIUS, type Player } from '../player';
import type { PendingShot } from '../world';

/** One 1/16 tick of a beam: a ray from the barrel that stops at a wall. */
export interface Beam {
  origin: Vec;
  /** Unit vector. */
  direction: Vec;
  /** Radians off the aim, so it's drawn following the player. */
  angle: number;
  length: number;
  radius: number;
  damage: number;
  /** Audio time it stops being drawn - just past the next tick. */
  expiresAt: number;
}

/** A tick is ~0.11s at 140: held a touch longer, the ticks read as one. */
export const BEAM_LINGER_SECONDS = 0.13;
const MARCH = TILE_SIZE / 8;

/** How far a ray gets from `origin` before a wall, up to `max`. */
const reach = (map: Tilemap, origin: Vec, direction: Vec, max: number) => {
  const steps = Math.ceil(max / MARCH);
  const blocked = Array.from({ length: steps }, (_, i) => (i + 1) * MARCH).find(
    distance => isWall(map, tileOf(add(origin, scale(direction, distance)))),
  );
  // The last step still in the open.
  return blocked === undefined ? max : Math.min(blocked - MARCH, max);
};

export const fireBeam = (
  player: Player,
  { time, spec, angle }: PendingShot,
  map: Tilemap,
): Beam => {
  const heading = player.aim + angle;
  const direction = { x: Math.cos(heading), y: Math.sin(heading) };
  const origin = add(player.position, scale(direction, PLAYER_RADIUS * 1.9));
  return {
    origin,
    direction,
    angle,
    length: reach(map, origin, direction, spec.speed * spec.lifetime),
    radius: spec.radius,
    damage: spec.damage,
    expiresAt: time + BEAM_LINGER_SECONDS,
  };
};

const distanceToRay = (point: Vec, beam: Beam) => {
  const offset = subtract(point, beam.origin);
  const along = Math.min(
    Math.max(offset.x * beam.direction.x + offset.y * beam.direction.y, 0),
    beam.length,
  );
  return length(
    subtract(point, add(beam.origin, scale(beam.direction, along))),
  );
};

/** A beam pierces: every live enemy it touches takes its damage. */
export const resolveBeams = (
  beams: Array<Beam>,
  enemies: Array<Enemy>,
  now: number,
): {
  enemies: Array<Enemy>;
  killed: Array<{ enemy: Enemy; position: Vec }>;
} => {
  const damaged = beams.reduce(
    (acc, beam) =>
      acc.map(enemy =>
        enemy.hp > 0 &&
        isSpawned(enemy, now) &&
        distanceToRay(enemyPosition(enemy, now), beam) <=
          beam.radius + ENEMY_RADIUS
          ? { ...enemy, hp: enemy.hp - beam.damage }
          : enemy,
      ),
    enemies,
  );
  return {
    enemies: damaged.filter(enemy => enemy.hp > 0),
    killed: damaged
      .filter(enemy => enemy.hp <= 0)
      .map(enemy => ({ enemy, position: enemyPosition(enemy, now) })),
  };
};

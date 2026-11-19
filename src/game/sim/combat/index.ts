import { length, subtract, type Vec } from '../../vec';
import { ENEMY_RADIUS, enemyPosition, isSpawned, type Enemy } from '../enemy';
import { PLAYER_RADIUS } from '../player';
import type { Splash } from '../../weapons';
import type { Projectile } from '../projectile';

const overlaps = (a: Vec, b: Vec, reach: number) =>
  length(subtract(a, b)) <= reach;

export interface HitResult {
  projectiles: Array<Projectile>;
  enemies: Array<Enemy>;
  killed: Array<{ enemy: Enemy; position: Vec }>;
  /** Where splashing projectiles hit, for their bursts. */
  impacts: Array<{ position: Vec; splash: Splash }>;
}

/** Each projectile damages the first live enemy it touches, then is spent. */
export const resolveHits = (
  projectiles: Array<Projectile>,
  enemies: Array<Enemy>,
  now: number,
): HitResult => {
  const result = projectiles.reduce<{
    projectiles: Array<Projectile>;
    enemies: Array<Enemy>;
    impacts: HitResult['impacts'];
  }>(
    (acc, projectile) => {
      const target = acc.enemies.find(
        enemy =>
          enemy.hp > 0 &&
          isSpawned(enemy, now) &&
          overlaps(
            projectile.position,
            enemyPosition(enemy, now),
            projectile.radius + ENEMY_RADIUS,
          ),
      );
      if (!target) {
        return { ...acc, projectiles: [...acc.projectiles, projectile] };
      }
      const { splash } = projectile;
      return {
        ...acc,
        impacts: splash
          ? [...acc.impacts, { position: projectile.position, splash }]
          : acc.impacts,
        enemies: acc.enemies.map(enemy =>
          enemy === target
            ? { ...enemy, hp: enemy.hp - projectile.damage }
            : enemy,
        ),
      };
    },
    { projectiles: [], enemies, impacts: [] },
  );

  return {
    projectiles: result.projectiles,
    enemies: result.enemies.filter(enemy => enemy.hp > 0),
    killed: result.enemies
      .filter(enemy => enemy.hp <= 0)
      .map(enemy => ({ enemy, position: enemyPosition(enemy, now) })),
    impacts: result.impacts,
  };
};

export interface ContactResult {
  enemies: Array<Enemy>;
  /** Enemies that reached the player - they burst on contact. */
  touched: Array<{ enemy: Enemy; position: Vec }>;
}

export const resolveContacts = (
  player: Vec,
  enemies: Array<Enemy>,
  now: number,
): ContactResult => {
  const touches = (enemy: Enemy) =>
    isSpawned(enemy, now) &&
    overlaps(player, enemyPosition(enemy, now), PLAYER_RADIUS + ENEMY_RADIUS);

  return {
    enemies: enemies.filter(enemy => !touches(enemy)),
    touched: enemies
      .filter(touches)
      .map(enemy => ({ enemy, position: enemyPosition(enemy, now) })),
  };
};

import type { Tilemap } from '../../level';
import { length, normalize, scale, subtract, type Vec } from '../../vec';
import type { Splash } from '../../weapons';
import { moveCircle } from '../collision';
import {
  enemyPosition,
  isSpawned,
  planHop,
  radiusOf,
  type Enemy,
} from '../enemy';

/** How long a shove takes - a quick stagger, shorter than a hop. */
export const KNOCKBACK_SECONDS = 0.09;

export interface Blast {
  position: Vec;
  splash: Splash;
}

/**
 * Every live enemy within a blast's radius takes its damage and is shoved
 * straight away from it, stopping at walls. A shove also breaks a
 * charger's lined-up dash: a crushed shot into a crowd buys room.
 */
export const resolveBlasts = (
  blasts: Array<Blast>,
  enemies: Array<Enemy>,
  map: Tilemap,
  now: number,
): {
  enemies: Array<Enemy>;
  killed: Array<{ enemy: Enemy; position: Vec }>;
} => {
  const blasted = blasts.reduce(
    (acc, { position: center, splash }) =>
      acc.map(enemy => {
        if (enemy.hp <= 0 || !isSpawned(enemy, now)) return enemy;
        const at = enemyPosition(enemy, now);
        const away = subtract(at, center);
        if (length(away) > splash.radius + radiusOf(enemy)) return enemy;
        // Too heavy to shove: the boss only takes the damage.
        if (enemy.kind === 'boss') {
          return { ...enemy, hp: enemy.hp - splash.damage };
        }
        // Dead centre has no "away": shove it along x.
        const direction = length(away) > 0 ? normalize(away) : { x: 1, y: 0 };
        const landing = moveCircle(
          map,
          at,
          scale(direction, splash.knockback),
          radiusOf(enemy),
        );
        const shoved = planHop(enemy, landing, now, KNOCKBACK_SECONDS);
        return {
          ...shoved,
          from: shoved === enemy ? enemy.from : at,
          aim: null,
          hp: enemy.hp - splash.damage,
        };
      }),
    enemies,
  );
  return {
    enemies: blasted.filter(enemy => enemy.hp > 0),
    killed: blasted
      .filter(enemy => enemy.hp <= 0)
      .map(enemy => ({ enemy, position: enemyPosition(enemy, now) })),
  };
};

import { angleOf, length, subtract, type Vec } from '../../vec';
import { enemyPosition, isSpawned, type Enemy } from '../enemy';

/** Half-angles of the cone the aim bends within, by input. */
export const AIM_ASSIST = {
  /** A thumb on a stick is a blunt pointer. */
  touch: 0.2,
  /** A mouse is exact; this only forgives a near miss. */
  mouse: 0.1,
};
/** Enemies further than this don't pull: roughly a screen away. */
const REACH = 640;

/** The signed turn from `from` to `to`, in -π..π. */
const turn = (from: number, to: number) =>
  Math.atan2(Math.sin(to - from), Math.cos(to - from));

/**
 * Bend `aim` towards the live enemy nearest the aim line, if one is within
 * `cone` radians of it. The pull is full on a near-hit and fades to none at
 * the cone's edge, so the aim never snaps as enemies cross it.
 */
export const assistAim = ({
  aim,
  from,
  enemies,
  now,
  cone,
}: {
  aim: number;
  from: Vec;
  enemies: Array<Enemy>;
  now: number;
  cone: number;
}): number => {
  if (cone <= 0) return aim;
  const offsets = enemies
    .filter(enemy => enemy.hp > 0 && isSpawned(enemy, now))
    .map(enemy => subtract(enemyPosition(enemy, now), from))
    .filter(offset => length(offset) <= REACH)
    .map(offset => turn(aim, angleOf(offset)))
    .filter(offset => Math.abs(offset) < cone);
  if (offsets.length === 0) return aim;
  const nearest = offsets.reduce((best, offset) =>
    Math.abs(offset) < Math.abs(best) ? offset : best,
  );
  return aim + nearest * (1 - Math.abs(nearest) / cone);
};

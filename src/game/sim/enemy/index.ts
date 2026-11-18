import type { Rng } from '../../rng';
import {
  add,
  length,
  lerp,
  normalize,
  scale,
  subtract,
  type Vec,
} from '../../vec';
import type { Bounds } from '../arena';

/** One tile per beat. */
export const TILE = 64;
export const ENEMY_RADIUS = 16;
export const ENEMY_HP = 2;
/** How long a step's hop takes; the rest of the beat it stands still. */
export const HOP_SECONDS = 0.11;
export const MAX_ENEMIES = 30;

/**
 * Movement is stored as the current hop - where from, where to, and the
 * audio time it starts - so the position at any moment is a pure function of
 * the audio clock and lands exactly on the beat.
 */
export interface Enemy {
  id: number;
  hp: number;
  from: Vec;
  to: Vec;
  hopAt: number;
  /** When it appears; it can't move or be hit before then. */
  spawnAt: number;
}

const easeOut = (t: number) => 1 - (1 - t) ** 3;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/** 0 before the hop, 1 once it's landed. */
export const hopProgress = (enemy: Enemy, now: number): number =>
  easeOut(clamp01((now - enemy.hopAt) / HOP_SECONDS));

export const enemyPosition = (enemy: Enemy, now: number): Vec =>
  lerp(enemy.from, enemy.to, hopProgress(enemy, now));

export const isSpawned = (enemy: Enemy, now: number): boolean =>
  now >= enemy.spawnAt;

/** On a beat: hop one tile towards the target (or onto it, if closer). */
export const planHop = (enemy: Enemy, target: Vec, time: number): Enemy => {
  if (time < enemy.spawnAt) return enemy;
  const toTarget = subtract(target, enemy.to);
  const distance = Math.min(TILE, length(toTarget));
  return {
    ...enemy,
    from: enemy.to,
    to: add(enemy.to, scale(normalize(toTarget), distance)),
    hopAt: time,
  };
};

/** Wave size grows every two bars, capped so the arena never passes 30. */
export const waveSize = (bar: number, alive: number): number =>
  Math.max(0, Math.min(1 + Math.floor(bar / 2), 6, MAX_ENEMIES - alive));

const MIN_SPAWN_DISTANCE = 420;
const MAX_SPAWN_DISTANCE = 760;

const spawnPoint = (rng: Rng, around: Vec, bounds: Bounds): Vec => {
  const angle = rng.next() * Math.PI * 2;
  const distance =
    MIN_SPAWN_DISTANCE + rng.next() * (MAX_SPAWN_DISTANCE - MIN_SPAWN_DISTANCE);
  const point = add(around, {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  });
  return {
    x: Math.min(Math.max(point.x, TILE), bounds.width - TILE),
    y: Math.min(Math.max(point.y, TILE), bounds.height - TILE),
  };
};

export const spawnWave = ({
  rng,
  count,
  firstId,
  around,
  bounds,
  time,
}: {
  rng: Rng;
  count: number;
  firstId: number;
  /** The player: enemies appear in a ring around them. */
  around: Vec;
  bounds: Bounds;
  time: number;
}): Array<Enemy> =>
  Array.from({ length: count }, (_, i) => {
    const position = spawnPoint(rng, around, bounds);
    return {
      id: firstId + i,
      hp: ENEMY_HP,
      from: position,
      to: position,
      hopAt: time,
      spawnAt: time,
    };
  });

import type { Rng } from '../../rng';
import { lerp, type Vec } from '../../vec';

export const ENEMY_RADIUS = 16;
/**
 * Hoppers and chargers go down to any hit: every shot, echo, blast and beam
 * tick does more damage than this. Only the boss has health to wear down.
 */
export const ENEMY_HP = Number.MIN_VALUE;
/** A charger's dash: four tiles, much faster than a hop. */
export const DASH_TILES = 4;
export const DASH_SECONDS = 0.18;
/** How long a step's hop takes; the rest of the beat it stands still. */
export const HOP_SECONDS = 0.11;
export const MAX_ENEMIES = 30;
/** The last drop's boss: a big hopper that soaks hits and steps on half beats. */
export const BOSS_RADIUS = ENEMY_RADIUS * 2.2;

/**
 * Movement is stored as the current hop - where from, where to, and the
 * audio time it starts - so the position at any moment is a pure function of
 * the audio clock and lands exactly on the beat.
 */
/**
 * Hoppers walk a tile every beat. Chargers line up on the snare (beat 3)
 * and dash on the next downbeat, so they're read by the rhythm. The boss
 * walks on beats 1 and 3, shrugs off contact and always drops good loot.
 */
export type EnemyKind = 'hopper' | 'charger' | 'boss';

export const radiusOf = (enemy: Pick<Enemy, 'kind'>): number =>
  enemy.kind === 'boss' ? BOSS_RADIUS : ENEMY_RADIUS;

export interface Enemy {
  id: number;
  kind: EnemyKind;
  hp: number;
  from: Vec;
  to: Vec;
  hopAt: number;
  /** How long the current hop takes. */
  hopSeconds: number;
  /** When it appears; it can't move or be hit before then. */
  spawnAt: number;
  /** A charger's locked-in dash direction (unit length), shown as a tell. */
  aim: Vec | null;
  /** The boss swells until this audio time: its volley fires then. */
  windupUntil?: number;
}

const easeOut = (t: number) => 1 - (1 - t) ** 3;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/** 0 before the hop, 1 once it's landed. */
export const hopProgress = (enemy: Enemy, now: number): number =>
  easeOut(clamp01((now - enemy.hopAt) / enemy.hopSeconds));

export const enemyPosition = (enemy: Enemy, now: number): Vec =>
  lerp(enemy.from, enemy.to, hopProgress(enemy, now));

export const isSpawned = (enemy: Enemy, now: number): boolean =>
  now >= enemy.spawnAt;

/** On a beat: hop to `to` (the next tile on its way to the player). */
export const planHop = (
  enemy: Enemy,
  to: Vec,
  time: number,
  seconds: number = HOP_SECONDS,
): Enemy => {
  if (time < enemy.spawnAt) return enemy;
  return { ...enemy, from: enemy.to, to, hopAt: time, hopSeconds: seconds };
};

/** A wave on distinct spots picked from `candidates` (spawnable tiles). */
export const spawnWave = ({
  rng,
  count,
  firstId,
  candidates,
  time,
  chargerChance = 0,
}: {
  rng: Rng;
  count: number;
  firstId: number;
  candidates: Array<Vec>;
  time: number;
  /** Share of the wave that comes as chargers. */
  chargerChance?: number;
}): Array<Enemy> => {
  const picked = candidates
    .map(position => ({ position, order: rng.next() }))
    .sort((a, b) => a.order - b.order)
    .slice(0, count);
  return picked.map(({ position }, i) => {
    const kind: EnemyKind = rng.chance(chargerChance) ? 'charger' : 'hopper';
    return {
      id: firstId + i,
      kind,
      hp: ENEMY_HP,
      from: position,
      to: position,
      hopAt: time,
      hopSeconds: HOP_SECONDS,
      spawnAt: time,
      aim: null,
    };
  });
};

/** The boss, appearing at `time` on `position`. */
export const spawnBoss = ({
  id,
  position,
  time,
  hp,
}: {
  id: number;
  position: Vec;
  time: number;
  hp: number;
}): Enemy => ({
  id,
  kind: 'boss',
  hp,
  from: position,
  to: position,
  hopAt: time,
  hopSeconds: HOP_SECONDS * 2,
  spawnAt: time,
  aim: null,
});

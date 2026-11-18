import type { Rng } from '../../rng';
import { lerp, type Vec } from '../../vec';

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

/** On a beat: hop to `to` (the next tile on its way to the player). */
export const planHop = (enemy: Enemy, to: Vec, time: number): Enemy => {
  if (time < enemy.spawnAt) return enemy;
  return { ...enemy, from: enemy.to, to, hopAt: time };
};

/** Wave size grows every two bars, capped so the arena never passes 30. */
export const waveSize = (bar: number, alive: number): number =>
  Math.max(0, Math.min(1 + Math.floor(bar / 2), 6, MAX_ENEMIES - alive));

/** A wave on distinct spots picked from `candidates` (spawnable tiles). */
export const spawnWave = ({
  rng,
  count,
  firstId,
  candidates,
  time,
}: {
  rng: Rng;
  count: number;
  firstId: number;
  candidates: Array<Vec>;
  time: number;
}): Array<Enemy> => {
  const picked = candidates
    .map(position => ({ position, order: rng.next() }))
    .sort((a, b) => a.order - b.order)
    .slice(0, count);
  return picked.map(({ position }, i) => ({
    id: firstId + i,
    hp: ENEMY_HP,
    from: position,
    to: position,
    hopAt: time,
    spawnAt: time,
  }));
};

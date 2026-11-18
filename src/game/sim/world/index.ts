import type { Rng } from '../../rng';
import type { Vec } from '../../vec';
import type { Bounds } from '../arena';
import { resolveContacts, resolveHits } from '../combat';
import { planHop, spawnWave, waveSize, type Enemy } from '../enemy';
import {
  spawnPlayer,
  stepPlayer,
  type Player,
  type PlayerInput,
} from '../player';
import type { ProjectileSpec } from '../../weapons';
import {
  advanceProjectiles,
  fireProjectile,
  type Projectile,
} from '../projectile';

/** A shot scheduled on the audio clock; it leaves the barrel at `time`. */
export interface PendingShot {
  time: number;
  spec: ProjectileSpec;
  /** Radians off the aim. */
  angle: number;
}

export interface World {
  bounds: Bounds;
  player: Player;
  enemies: Array<Enemy>;
  projectiles: Array<Projectile>;
  /** Shots scheduled on the audio clock that haven't sounded yet. */
  pendingShots: Array<PendingShot>;
  nextId: number;
  /** A hit can't land again until this audio time. */
  invulnerableUntil: number;
}

/** Bars of breathing room before the first wave. */
const QUIET_BARS = 2;
const INVULNERABLE_SECONDS = 0.6;

export const createWorld = (bounds: Bounds): World => ({
  bounds,
  player: spawnPlayer(bounds),
  enemies: [],
  projectiles: [],
  pendingShots: [],
  nextId: 1,
  invulnerableUntil: 0,
});

export const queueShot = (world: World, shot: PendingShot): World => ({
  ...world,
  pendingShots: [...world.pendingShots, shot],
});

/** On every beat: each enemy hops a tile towards the player. */
export const onBeat = (world: World, time: number): World => ({
  ...world,
  enemies: world.enemies.map(enemy =>
    planHop(enemy, world.player.position, time),
  ),
});

/** On every bar line: a wave, growing as the track goes on. */
export const onBar = (
  world: World,
  { bar, time, rng }: { bar: number; time: number; rng: Rng },
): World => {
  if (bar < QUIET_BARS) return world;
  const count = waveSize(bar - QUIET_BARS, world.enemies.length);
  const wave = spawnWave({
    rng,
    count,
    firstId: world.nextId,
    around: world.player.position,
    bounds: world.bounds,
    time,
  });
  return {
    ...world,
    enemies: [...world.enemies, ...wave],
    nextId: world.nextId + count,
  };
};

export interface FrameResult {
  world: World;
  kills: Array<Vec>;
  /** Where an enemy hit the player, if one did this frame. */
  playerHit: Vec | null;
}

/**
 * One animation frame. Movement integrates over `dt`; everything musical
 * (shots, hops, spawns) is read at `now` on the audio clock.
 */
export const stepWorld = (
  world: World,
  { input, dt, now }: { input: PlayerInput; dt: number; now: number },
): FrameResult => {
  const player = stepPlayer(world.player, input, dt, world.bounds);
  const due = world.pendingShots.filter(shot => shot.time <= now);
  const fired = due.map(shot => fireProjectile(player, shot));
  const projectiles = advanceProjectiles(
    [...world.projectiles, ...fired],
    dt,
    now,
  );

  const hits = resolveHits(projectiles, world.enemies, now);
  const contacts = resolveContacts(player.position, hits.enemies, now);
  const canBeHit = now >= world.invulnerableUntil;
  const playerHit = canBeHit ? (contacts.touched[0]?.position ?? null) : null;

  return {
    world: {
      ...world,
      player,
      projectiles: hits.projectiles,
      enemies: contacts.enemies,
      pendingShots: world.pendingShots.filter(shot => shot.time > now),
      invulnerableUntil: playerHit
        ? now + INVULNERABLE_SECONDS
        : world.invulnerableUntil,
    },
    kills: hits.killed.map(kill => kill.position),
    playerHit,
  };
};

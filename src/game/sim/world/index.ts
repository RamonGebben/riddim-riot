import {
  distanceAt,
  distanceField,
  isWall,
  stepDownhill,
  tileCenter,
  tileOf,
  type Level,
  type TilePos,
} from '../../level';
import type { Rng } from '../../rng';
import type { Vec } from '../../vec';
import type { ProjectileSpec } from '../../weapons';
import { resolveContacts, resolveHits } from '../combat';
import {
  MAX_ENEMIES,
  planHop,
  spawnWave,
  waveSize,
  type Enemy,
} from '../enemy';
import {
  spawnPlayer,
  stepPlayer,
  type Player,
  type PlayerInput,
} from '../player';
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

/** How the waves come. */
export interface WaveRules {
  /** Bars of breathing room before the first wave. */
  quietBars: number;
  /** Stress test: top the level up to the enemy cap every bar. */
  fill: boolean;
}

export const DEFAULT_RULES: WaveRules = { quietBars: 2, fill: false };

export interface World {
  level: Level;
  rules: WaveRules;
  player: Player;
  enemies: Array<Enemy>;
  projectiles: Array<Projectile>;
  /** Shots scheduled on the audio clock that haven't sounded yet. */
  pendingShots: Array<PendingShot>;
  nextId: number;
  /** A hit can't land again until this audio time. */
  invulnerableUntil: number;
}

const INVULNERABLE_SECONDS = 0.6;
/**
 * Waves appear this many tiles away, walking: off-screen, usually a room
 * or two over, so they arrive on the beat rather than pop in close.
 */
const SPAWN_DISTANCE = { min: 10, max: 18 };

export const createWorld = (
  level: Level,
  rules: WaveRules = DEFAULT_RULES,
): World => ({
  level,
  rules,
  player: spawnPlayer(level.start),
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

const tileKey = ({ x, y }: TilePos) => `${x},${y}`;

/**
 * On every beat: each enemy hops one tile along the flow field towards the
 * player, never onto a tile another enemy holds. The nearest move first and
 * free their tile as they go, so a line of them flows through a doorway.
 */
export const onBeat = (world: World, time: number): World => {
  const { map } = world.level;
  const field = distanceField(map, tileOf(world.player.position));
  const distance = (enemy: Enemy) => distanceAt(map, field, tileOf(enemy.to));
  const nearestFirst = [...world.enemies].sort(
    (a, b) => distance(a) - distance(b),
  );

  const { hops } = nearestFirst.reduce<{
    hops: Map<number, Enemy>;
    taken: Set<string>;
  }>(
    (acc, enemy) => {
      const here = tileOf(enemy.to);
      const next = stepDownhill(map, field, here, pos =>
        acc.taken.has(tileKey(pos)),
      );
      if (!next) return acc;
      const taken = new Set(acc.taken);
      taken.delete(tileKey(here));
      taken.add(tileKey(next));
      return {
        hops: new Map(acc.hops).set(
          enemy.id,
          planHop(enemy, tileCenter(next), time),
        ),
        taken,
      };
    },
    {
      hops: new Map(),
      taken: new Set(world.enemies.map(enemy => tileKey(tileOf(enemy.to)))),
    },
  );

  return {
    ...world,
    enemies: world.enemies.map(enemy => hops.get(enemy.id) ?? enemy),
  };
};

/** Floor tiles a fresh wave may appear on: far enough, and unoccupied. */
const spawnSpots = (world: World): Array<Vec> => {
  const { map } = world.level;
  const field = distanceField(map, tileOf(world.player.position));
  const occupied = new Set(
    world.enemies.map(enemy => tileKey(tileOf(enemy.to))),
  );
  return field.flatMap((distance, index) => {
    const pos = { x: index % map.width, y: Math.floor(index / map.width) };
    const inRange =
      distance >= SPAWN_DISTANCE.min && distance <= SPAWN_DISTANCE.max;
    return inRange && !occupied.has(tileKey(pos)) ? [tileCenter(pos)] : [];
  });
};

/** On every bar line: a wave, growing as the track goes on. */
export const onBar = (
  world: World,
  { bar, time, rng }: { bar: number; time: number; rng: Rng },
): World => {
  const { quietBars, fill } = world.rules;
  if (bar < quietBars) return world;
  const alive = world.enemies.length;
  const count = fill ? MAX_ENEMIES - alive : waveSize(bar - quietBars, alive);
  if (count === 0) return world;
  const wave = spawnWave({
    rng,
    count,
    firstId: world.nextId,
    candidates: spawnSpots(world),
    time,
  });
  return {
    ...world,
    enemies: [...world.enemies, ...wave],
    nextId: world.nextId + wave.length,
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
  const { map } = world.level;
  const player = stepPlayer(world.player, input, dt, map);
  const due = world.pendingShots.filter(shot => shot.time <= now);
  const fired = due.map(shot => fireProjectile(player, shot));
  const projectiles = advanceProjectiles(
    [...world.projectiles, ...fired],
    dt,
    now,
  ).filter(projectile => !isWall(map, tileOf(projectile.position)));

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

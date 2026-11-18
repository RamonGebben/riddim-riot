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
import { length, subtract, type Vec } from '../../vec';
import type { ProjectileSpec } from '../../weapons';
import { resolveContacts, resolveHits } from '../combat';
import {
  ENEMY_HP,
  MAX_ENEMIES,
  planHop,
  spawnWave,
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
import { advanceWaves, INITIAL_WAVES, waveSize, type Waves } from '../waves';

/** A shot scheduled on the audio clock; it leaves the barrel at `time`. */
export interface PendingShot {
  time: number;
  spec: ProjectileSpec;
  /** Radians off the aim. */
  angle: number;
}

/** How a level plays: its waves and how hard they hit. */
export interface WaveRules {
  /** 1-based level within the run; waves grow with it. */
  level: number;
  /** Bars of breathing room before the first wave. */
  quietBars: number;
  /** Waves to clear before the exit opens. */
  wavesToClear: number;
  enemyHp: number;
  /** Stress test: top the level up to the enemy cap every bar. */
  fill: boolean;
}

/** Each level is a little longer and a little tougher than the last. */
export const rulesFor = ({
  level,
  stress = false,
}: {
  level: number;
  stress?: boolean;
}): WaveRules => ({
  level,
  quietBars: stress ? 0 : level === 1 ? 2 : 1,
  wavesToClear: 2 + level,
  enemyHp: ENEMY_HP + 0.5 * (level - 1),
  fill: stress,
});

export const DEFAULT_RULES: WaveRules = rulesFor({ level: 1 });

/** `cleared`: the player took the exit. */
export type WorldStatus = 'playing' | 'dead' | 'cleared';

export interface World {
  level: Level;
  rules: WaveRules;
  status: WorldStatus;
  player: Player;
  hp: number;
  maxHp: number;
  kills: number;
  waves: Waves;
  enemies: Array<Enemy>;
  projectiles: Array<Projectile>;
  /** Shots scheduled on the audio clock that haven't sounded yet. */
  pendingShots: Array<PendingShot>;
  nextId: number;
  /** A hit can't land again until this audio time. */
  invulnerableUntil: number;
}

const INVULNERABLE_SECONDS = 0.6;
/** How close to the exit pad's centre counts as standing on it. */
const EXIT_RADIUS = 40;
export const PLAYER_MAX_HP = 5;
/**
 * Waves appear this many tiles away, walking: off-screen, usually a room
 * or two over, so they arrive on the beat rather than pop in close.
 */
const SPAWN_DISTANCE = { min: 10, max: 18 };

export const createWorld = (
  level: Level,
  rules: WaveRules = DEFAULT_RULES,
  /** Carried over from the previous level of a run. */
  { hp = PLAYER_MAX_HP, kills = 0 }: { hp?: number; kills?: number } = {},
): World => ({
  level,
  rules,
  status: 'playing',
  player: spawnPlayer(level.start),
  hp,
  maxHp: PLAYER_MAX_HP,
  kills,
  waves: INITIAL_WAVES,
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

export const isExitOpen = (world: World): boolean =>
  world.waves.cleared >= world.rules.wavesToClear;

const spawn = (
  world: World,
  { count, time, rng }: { count: number; time: number; rng: Rng },
): World => {
  if (count === 0) return world;
  const wave = spawnWave({
    rng,
    count,
    firstId: world.nextId,
    candidates: spawnSpots(world),
    time,
    hp: world.rules.enemyHp,
  });
  return {
    ...world,
    enemies: [...world.enemies, ...wave],
    nextId: world.nextId + wave.length,
  };
};

/**
 * On every bar line: the wave lifecycle moves on (see `advanceWaves`), so
 * waves arrive, clear and return on the song's structure.
 */
export const onBar = (
  world: World,
  { bar, time, rng }: { bar: number; time: number; rng: Rng },
): World => {
  if (world.status !== 'playing') return world;
  const { rules } = world;
  const alive = world.enemies.length;
  if (rules.fill) {
    return spawn(world, { count: MAX_ENEMIES - alive, time, rng });
  }

  const next = advanceWaves(world.waves, {
    bar,
    alive,
    quietBars: rules.quietBars,
  });
  const advanced = { ...world, waves: next.waves };
  if (!next.spawn) return advanced;
  const size = waveSize({ sent: world.waves.sent, level: rules.level, alive });
  const count = next.spawn === 'wave' ? size : Math.ceil(size / 2);
  return spawn(advanced, { count, time, rng });
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
  // A finished run freezes where it ended.
  if (world.status !== 'playing') return { world, kills: [], playerHit: null };

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
  const hp = playerHit ? world.hp - 1 : world.hp;
  const onExit =
    isExitOpen(world) &&
    length(subtract(player.position, world.level.exit)) <= EXIT_RADIUS;
  const status = hp <= 0 ? 'dead' : onExit ? 'cleared' : 'playing';

  return {
    world: {
      ...world,
      status,
      hp,
      kills: world.kills + hits.killed.length,
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

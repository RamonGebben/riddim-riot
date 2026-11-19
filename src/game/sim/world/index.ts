import {
  distanceAt,
  distanceField,
  isWall,
  TILE_SIZE,
  stepDownhill,
  tileCenter,
  tileOf,
  type Level,
  type TilePos,
} from '../../level';
import type { Rng } from '../../rng';
import { length, normalize, scale, subtract, type Vec } from '../../vec';
import type { ProjectileSpec, WeaponRecipe } from '../../weapons';
import { fireBeam, resolveBeams, type Beam } from '../beam';
import { resolveContacts, resolveHits } from '../combat';
import { resolveBlasts, type Blast } from '../splash';
import {
  DASH_SECONDS,
  DASH_TILES,
  ENEMY_HP,
  ENEMY_RADIUS,
  MAX_ENEMIES,
  planHop,
  spawnWave,
  type Enemy,
} from '../enemy';
import { moveCircle } from '../collision';
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
import { NO_COMBO, registerKill, type Combo } from '../combo';
import { dropsOnKill, lootRecipe, type Pickup } from '../loot';
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
  /** Share of each wave after the first that comes as chargers. */
  chargerChance: number;
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
  chargerChance: Math.min(0.25 + 0.05 * (level - 1), 0.45),
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
  score: number;
  combo: Combo;
  waves: Waves;
  enemies: Array<Enemy>;
  pickups: Array<Pickup>;
  /** Where the latest kill fell - a cleared wave drops its reward there. */
  lastKill: Vec | null;
  projectiles: Array<Projectile>;
  /** Beam ticks still being drawn; their damage landed when they fired. */
  beams: Array<Beam>;
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
  {
    hp = PLAYER_MAX_HP,
    kills = 0,
    score = 0,
  }: { hp?: number; kills?: number; score?: number } = {},
): World => ({
  level,
  rules,
  status: 'playing',
  player: spawnPlayer(level.start),
  hp,
  maxHp: PLAYER_MAX_HP,
  kills,
  score,
  combo: NO_COMBO,
  waves: INITIAL_WAVES,
  enemies: [],
  pickups: [],
  lastKill: null,
  projectiles: [],
  beams: [],
  pendingShots: [],
  nextId: 1,
  invulnerableUntil: 0,
});

export const queueShot = (world: World, shot: PendingShot): World => ({
  ...world,
  pendingShots: [...world.pendingShots, shot],
});

const tileKey = ({ x, y }: TilePos) => `${x},${y}`;

/** How near (walking, in tiles) a charger has to be to line up a dash. */
const CHARGE_RANGE = 8;

/**
 * A charger's beat: line up on beat 3 (the snare) if near enough, dash on
 * the downbeat after. Returns null when it walks this beat instead.
 */
const chargerBeat = (
  world: World,
  enemy: Enemy,
  { time, beat, distance }: { time: number; beat: number; distance: number },
): Enemy | null => {
  if (time < enemy.spawnAt) return enemy;
  if (beat === 0 && enemy.aim) {
    const dash = scale(enemy.aim, DASH_TILES * TILE_SIZE);
    const landing = moveCircle(world.level.map, enemy.to, dash, ENEMY_RADIUS);
    return { ...planHop(enemy, landing, time, DASH_SECONDS), aim: null };
  }
  if (beat === 2 && distance >= 0 && distance <= CHARGE_RANGE) {
    const aim = normalize(subtract(world.player.position, enemy.to));
    return { ...enemy, aim };
  }
  // Closes in on beat 2 - and on beat 4 too while it's still far off.
  const walks = beat === 1 || (beat === 3 && distance > CHARGE_RANGE);
  return walks && !enemy.aim ? null : enemy;
};

/**
 * On every beat: enemies act on the clock. Hoppers hop one tile along the
 * flow field towards the player, never onto a tile another enemy holds -
 * the nearest move first and free their tile as they go, so a line of them
 * flows through a doorway. Chargers line up and dash (see `chargerBeat`).
 */
export const onBeat = (
  world: World,
  { time, beat }: { time: number; beat: number },
): World => {
  const { map } = world.level;
  const field = distanceField(map, tileOf(world.player.position));
  const distance = (enemy: Enemy) => distanceAt(map, field, tileOf(enemy.to));
  const special = new Map(
    world.enemies.flatMap(enemy => {
      if (enemy.kind !== 'charger') return [];
      const acted = chargerBeat(world, enemy, {
        time,
        beat,
        distance: distance(enemy),
      });
      return acted ? [[enemy.id, acted] as const] : [];
    }),
  );
  const nearestFirst = world.enemies
    .filter(enemy => !special.has(enemy.id))
    .sort((a, b) => distance(a) - distance(b));

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
    enemies: world.enemies.map(
      enemy => special.get(enemy.id) ?? hops.get(enemy.id) ?? enemy,
    ),
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

/** Put a weapon on the ground. */
export const placePickup = (
  world: World,
  recipe: WeaponRecipe,
  position: Vec,
): World => ({
  ...world,
  pickups: [...world.pickups, { id: world.nextId, position, recipe }],
  nextId: world.nextId + 1,
});

/** Lift a weapon off the ground (the loadout swaps it in). */
export const takePickup = (world: World, id: number): World => ({
  ...world,
  pickups: world.pickups.filter(pickup => pickup.id !== id),
});

const dropLoot = (world: World, position: Vec): World =>
  placePickup(world, lootRecipe(world.level.seed, world.nextId), position);

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
    // The first wave of a level is hoppers only, to read the beat first.
    chargerChance:
      world.rules.fill || world.waves.sent > 1 ? world.rules.chargerChance : 0,
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
  const justCleared = next.waves.cleared > world.waves.cleared;
  const rewarded = justCleared
    ? dropLoot(world, world.lastKill ?? world.player.position)
    : world;
  const advanced = { ...rewarded, waves: next.waves };
  if (!next.spawn) return advanced;
  const size = waveSize({ sent: world.waves.sent, level: rules.level, alive });
  const count = next.spawn === 'wave' ? size : Math.ceil(size / 2);
  return spawn(advanced, { count, time, rng });
};

export interface FrameResult {
  world: World;
  kills: Array<Vec>;
  /** Crushed shots that burst this frame. */
  blasts: Array<Blast>;
  /** Where an enemy hit the player, if one did this frame. */
  playerHit: Vec | null;
}

/**
 * One animation frame. Movement integrates over `dt`; everything musical
 * (shots, hops, spawns) is read at `now` on the audio clock, and `beat` is
 * the beat `now` falls in, for chaining kills into a combo.
 */
export const stepWorld = (
  world: World,
  {
    input,
    dt,
    now,
    beat = 0,
  }: { input: PlayerInput; dt: number; now: number; beat?: number },
): FrameResult => {
  // A finished run freezes where it ended.
  if (world.status !== 'playing') {
    return { world, kills: [], blasts: [], playerHit: null };
  }

  const { map } = world.level;
  const player = stepPlayer(world.player, input, dt, map);
  const due = world.pendingShots.filter(shot => shot.time <= now);
  const isBeam = (shot: PendingShot) => shot.spec.kind === 'beam';
  const fired = due
    .filter(shot => !isBeam(shot))
    .map(shot => fireProjectile(player, shot));
  const firedBeams = due
    .filter(isBeam)
    .map(shot => fireBeam(player, shot, map));
  const projectiles = advanceProjectiles(
    [...world.projectiles, ...fired],
    dt,
    now,
  ).filter(projectile => !isWall(map, tileOf(projectile.position)));

  const beamed = resolveBeams(firedBeams, world.enemies, now);
  const shot = resolveHits(projectiles, beamed.enemies, now);
  const blasts = shot.impacts;
  const blasted = resolveBlasts(blasts, shot.enemies, map, now);
  const hits = {
    projectiles: shot.projectiles,
    enemies: blasted.enemies,
    killed: [...beamed.killed, ...shot.killed, ...blasted.killed],
  };
  const contacts = resolveContacts(player.position, hits.enemies, now);
  const canBeHit = now >= world.invulnerableUntil;
  const playerHit = canBeHit ? (contacts.touched[0]?.position ?? null) : null;
  const hp = playerHit ? world.hp - 1 : world.hp;
  const onExit =
    isExitOpen(world) &&
    length(subtract(player.position, world.level.exit)) <= EXIT_RADIUS;
  const status = hp <= 0 ? 'dead' : onExit ? 'cleared' : 'playing';
  const killedAt = hits.killed.map(kill => kill.position);
  // Every kill this frame lands on the same beat, each extending the chain.
  const scored = hits.killed.reduce(
    acc => {
      const next = registerKill(acc.combo, beat);
      return { combo: next.combo, score: acc.score + next.points };
    },
    { combo: world.combo, score: world.score },
  );
  const looted = hits.killed
    .filter(kill => dropsOnKill(world.level.seed, kill.enemy.id))
    .reduce((acc, kill) => dropLoot(acc, kill.position), world);

  return {
    world: {
      ...looted,
      lastKill: killedAt[killedAt.length - 1] ?? world.lastKill,
      status,
      hp,
      kills: world.kills + hits.killed.length,
      score: scored.score,
      combo: scored.combo,
      player,
      projectiles: hits.projectiles,
      beams: [...world.beams, ...firedBeams].filter(
        beam => beam.expiresAt > now,
      ),
      enemies: contacts.enemies,
      pendingShots: world.pendingShots.filter(shot => shot.time > now),
      invulnerableUntil: playerHit
        ? now + INVULNERABLE_SECONDS
        : world.invulnerableUntil,
    },
    kills: hits.killed.map(kill => kill.position),
    blasts,
    playerHit,
  };
};

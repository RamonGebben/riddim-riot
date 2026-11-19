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
  HOP_SECONDS,
  planHop,
  spawnBoss,
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
import {
  BOSS_HEARTS,
  dropOnKill,
  goodLootRecipe,
  heartsInReach,
  lootRecipe,
  type Heart,
  type Pickup,
} from '../loot';
import {
  advanceSurvival,
  INITIAL_SURVIVAL,
  songFor,
  songFrom,
  stepIn,
  waveSize,
  type SongSection,
  type Survival,
} from '../survival';

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
  /** The song the level plays, part by part (see `songFor`). */
  song: Array<SongSection>;
  enemyHp: number;
  bossHp: number;
  /** Share of each wave after the first that comes as chargers. */
  chargerChance: number;
  /** Stress test: skip the circle and top the level up to the cap every bar. */
  fill: boolean;
}

/** The boss appears at least this far away, so it walks in on the drop. */
const BOSS_MIN_TILES = 8;

/** Each level is a little longer and a little tougher than the last. */
export const rulesFor = ({
  level,
  stress = false,
}: {
  level: number;
  stress?: boolean;
}): WaveRules => ({
  level,
  song: songFor(level),
  enemyHp: ENEMY_HP + 0.5 * (level - 1),
  bossHp: 30 + 12 * (level - 1),
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
  survival: Survival;
  enemies: Array<Enemy>;
  pickups: Array<Pickup>;
  hearts: Array<Heart>;
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
/** How close to the pad's centre counts as standing in the circle. */
export const PAD_RADIUS = 48;
export const PLAYER_MAX_HP = 5;
/**
 * Enemies can appear anywhere, close too - their marker pulses first - but
 * never right on top of the player.
 */
const SPAWN_MIN_TILES = 4;

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
  survival: rules.fill ? songFrom(0) : INITIAL_SURVIVAL,
  enemies: [],
  pickups: [],
  hearts: [],
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
      // The boss lumbers: it only steps on beats 1 and 3.
      if (enemy.kind === 'boss') {
        return beat % 2 === 1 ? [[enemy.id, enemy] as const] : [];
      }
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
          planHop(
            enemy,
            tileCenter(next),
            time,
            enemy.kind === 'boss' ? HOP_SECONDS * 2 : HOP_SECONDS,
          ),
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

/** Floor tiles a fresh wave may appear on: not too close, and unoccupied. */
const spawnSpots = (world: World): Array<Vec> => {
  const { map } = world.level;
  const occupied = new Set(
    world.enemies.map(enemy => tileKey(tileOf(enemy.to))),
  );
  return map.tiles.flatMap((tile, index) => {
    const pos = { x: index % map.width, y: Math.floor(index / map.width) };
    if (tile === 'wall' || occupied.has(tileKey(pos))) return [];
    const center = tileCenter(pos);
    const near =
      length(subtract(center, world.player.position)) <
      SPAWN_MIN_TILES * TILE_SIZE;
    return near ? [] : [center];
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

const placeHeart = (world: World, position: Vec): World => ({
  ...world,
  hearts: [...world.hearts, { id: world.nextId, position }],
  nextId: world.nextId + 1,
});

/** Hearts scattered a little around where the boss fell. */
const HEART_SCATTER = 36;

/** What a kill leaves behind (see `dropOnKill`); the boss always pays out. */
const dropLoot = (world: World, enemy: Enemy, position: Vec): World => {
  const { seed } = world.level;
  if (enemy.kind === 'boss') {
    const armed = placePickup(
      world,
      goodLootRecipe(seed, world.nextId),
      position,
    );
    return Array.from({ length: BOSS_HEARTS }, (_, i) => i).reduce(
      (acc, i) =>
        placeHeart(acc, {
          x:
            position.x +
            HEART_SCATTER * Math.cos((i / BOSS_HEARTS) * Math.PI * 2),
          y:
            position.y +
            HEART_SCATTER * Math.sin((i / BOSS_HEARTS) * Math.PI * 2) +
            HEART_SCATTER,
        }),
      armed,
    );
  }
  const drop = dropOnKill(seed, enemy.id);
  if (drop === 'weapon') {
    return placePickup(world, lootRecipe(seed, world.nextId), position);
  }
  return drop === 'heart' ? placeHeart(world, position) : world;
};

export const isExitOpen = (world: World): boolean =>
  world.survival.phase === 'clear';

const onPad = (world: World, position: Vec) =>
  length(subtract(position, world.level.pad)) <= PAD_RADIUS;

const spawn = (
  world: World,
  {
    count,
    time,
    rng,
    chargerChance,
  }: { count: number; time: number; rng: Rng; chargerChance: number },
): World => {
  if (count === 0) return world;
  const wave = spawnWave({
    rng,
    count,
    firstId: world.nextId,
    candidates: spawnSpots(world),
    time,
    hp: world.rules.enemyHp,
    chargerChance,
  });
  return {
    ...world,
    enemies: [...world.enemies, ...wave],
    nextId: world.nextId + wave.length,
  };
};

/**
 * On every bar line: the level moves on (see `advanceSurvival`), so the
 * charge, the slam and every wave land on the song's structure. Spawns
 * appear `telegraphSeconds` after the bar, their markers pulsing until then.
 */
export const onBar = (
  world: World,
  {
    bar,
    time,
    rng,
    telegraphSeconds = 0,
  }: { bar: number; time: number; rng: Rng; telegraphSeconds?: number },
): World => {
  if (world.status !== 'playing') return world;
  const { rules } = world;
  const alive = world.enemies.length;
  const spawnAt = time + telegraphSeconds;
  if (rules.fill) {
    return spawn(world, {
      count: MAX_ENEMIES - alive,
      time: spawnAt,
      rng,
      chargerChance: rules.chargerChance,
    });
  }

  const next = advanceSurvival(world.survival, {
    bar,
    time,
    alive,
    bossAlive: world.enemies.some(enemy => enemy.kind === 'boss'),
    song: rules.song,
  });
  const advanced = { ...world, survival: next.survival };
  if (!next.spawn) return advanced;
  const { wave, boss } = next.spawn;
  const sent = world.survival.sent;
  const waved = wave
    ? spawn(advanced, {
        count: waveSize({ sent, level: rules.level, alive, extra: wave.extra }),
        time: spawnAt,
        rng,
        chargerChance: wave.chargers ? rules.chargerChance : 0,
      })
    : advanced;
  return boss ? spawnTheBoss(waved, { time: spawnAt, rng }) : waved;
};

const spawnTheBoss = (
  world: World,
  { time, rng }: { time: number; rng: Rng },
): World => {
  const far = spawnSpots(world).filter(
    spot =>
      length(subtract(spot, world.player.position)) >=
      BOSS_MIN_TILES * TILE_SIZE,
  );
  const spots = far.length > 0 ? far : spawnSpots(world);
  if (spots.length === 0) return world;
  const boss = spawnBoss({
    id: world.nextId,
    position: rng.pick(spots),
    time,
    hp: world.rules.bossHp,
  });
  return {
    ...world,
    enemies: [...world.enemies, boss],
    nextId: world.nextId + 1,
  };
};

export interface FrameResult {
  world: World;
  kills: Array<Vec>;
  /** Crushed shots that burst this frame. */
  blasts: Array<Blast>;
  /** Hearts picked up this frame. */
  healed: Array<Vec>;
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
    return { world, kills: [], blasts: [], playerHit: null, healed: [] };
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
  const hurt = playerHit ? world.hp - 1 : world.hp;
  // Walking over a heart heals - but only with health to heal.
  const reachable = heartsInReach(world.hearts, player.position);
  const healed = hurt > 0 ? reachable.slice(0, world.maxHp - hurt) : [];
  const hp = hurt + healed.length;
  const standingIn = onPad(world, player.position);
  const onExit = isExitOpen(world) && standingIn;
  const status = hp <= 0 ? 'dead' : onExit ? 'cleared' : 'playing';
  // Every kill this frame lands on the same beat, each extending the chain.
  const scored = hits.killed.reduce(
    acc => {
      const next = registerKill(acc.combo, beat);
      return { combo: next.combo, score: acc.score + next.points };
    },
    { combo: world.combo, score: world.score },
  );
  const looted = hits.killed.reduce(
    (acc, kill) => dropLoot(acc, kill.enemy, kill.position),
    world,
  );

  return {
    world: {
      ...looted,
      survival: standingIn ? stepIn(world.survival, now) : world.survival,
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
      hearts: looted.hearts.filter(heart => !healed.includes(heart)),
      pendingShots: world.pendingShots.filter(shot => shot.time > now),
      invulnerableUntil: playerHit
        ? now + INVULNERABLE_SECONDS
        : world.invulnerableUntil,
    },
    kills: hits.killed.map(kill => kill.position),
    blasts,
    playerHit,
    healed: healed.map(heart => heart.position),
  };
};

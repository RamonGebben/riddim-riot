import {
  distanceAt,
  distanceField,
  isWall,
  TILE_SIZE,
  stepDownhill,
  stepUphill,
  tileCenter,
  tileOf,
  type Level,
  type TilePos,
} from '../../level';
import { createRng, deriveSeed, type Rng } from '../../rng';
import { length, normalize, scale, subtract, type Vec } from '../../vec';
import type { ProjectileSpec, WeaponRecipe } from '../../weapons';
import { assistAim } from '../aimAssist';
import { fireBeam, resolveBeams, type Beam } from '../beam';
import {
  bossMove,
  bossPhase,
  hostilePosition,
  hostilesTouching,
  volley,
  type Hostile,
} from '../boss';
import { resolveContacts, resolveHits } from '../combat';
import { resolveBlasts, type Blast } from '../splash';
import {
  DASH_SECONDS,
  DASH_TILES,
  ENEMY_RADIUS,
  enemyPosition,
  MAX_ENEMIES,
  HOP_SECONDS,
  planHop,
  spawnBoss,
  spawnWave,
  type Enemy,
} from '../enemy';
import { moveCircle } from '../collision';
import {
  DASH,
  dashDirection,
  PLAYER_RADIUS,
  spawnPlayer,
  stepPlayer,
  type Player,
  type PlayerInput,
} from '../player';
import { fireProjectile, flyProjectiles, type Projectile } from '../projectile';
import { kickRecoil, NO_RECOIL, type Recoil } from '../recoil';
import { NO_COMBO, registerKill, type Combo } from '../combo';
import {
  attractHearts,
  attractPickups,
  BAG_SIZE,
  BONUS_HEARTS,
  BOSS_HEARTS,
  dropOnKill,
  goodLootRecipe,
  heartsInReach,
  lootRecipe,
  pickupsInReach,
  type Heart,
  type Pickup,
} from '../loot';
import {
  attractPowerups,
  chordShots,
  EATEN_POINTS,
  isPowered,
  NOT_POWERED,
  powerUp,
  powerupFor,
  powerupsInReach,
  type Powered,
  type Powerup,
  type PowerupKind,
} from '../powerup';
import {
  advanceSurvival,
  INITIAL_SURVIVAL,
  songFor,
  songFrom,
  chargeCircle,
  exitTaken,
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
  /** A chord's side shot: it takes the aimed shot's kick and adds no heat. */
  side?: boolean;
}

/** How a level plays: its waves and how hard they hit. */
export interface WaveRules {
  /** 1-based level within the run; waves grow with it. */
  level: number;
  /** The song the level plays, part by part (see `songFor`). */
  song: Array<SongSection>;
  bossHp: number;
  /** Share of each wave after the first that comes as chargers. */
  chargerChance: number;
  /** Stress test: skip the circle and top the level up to the cap every bar. */
  fill: boolean;
}

/** The boss appears at least this far away, so it walks in on the drop. */
const BOSS_MIN_TILES = 8;

/** A run is this many levels; the last one's boss ends it. */
export const RUN_LEVELS = 5;
/** Points for taking a level's exit, the last level's included. */
export const LEVEL_CLEAR_BONUS = 10_000;
/** The final boss has this much more health than the level's would be. */
const FINAL_BOSS_HP = 1.5;

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
  bossHp: Math.round(
    (30 + 12 * (level - 1)) * (level >= RUN_LEVELS ? FINAL_BOSS_HP : 1),
  ),
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
  /** Weapons picked up this run, oldest first, up to `BAG_SIZE`. */
  bag: Array<WeaponRecipe>;
  hearts: Array<Heart>;
  /** Powerups on the floor. */
  powerups: Array<Powerup>;
  /** Until when each powerup runs (see `sim/powerup`). */
  powered: Powered;
  projectiles: Array<Projectile>;
  /** The boss's orbs in flight. */
  hostiles: Array<Hostile>;
  /** Beam ticks still being drawn; their damage landed when they fired. */
  beams: Array<Beam>;
  /** Shots scheduled on the audio clock that haven't sounded yet. */
  pendingShots: Array<PendingShot>;
  nextId: number;
  /** A hit can't land again until this audio time. */
  invulnerableUntil: number;
  /** The player's dash: moving `direction` until `until`, ready again at `readyAt`. */
  dash: { direction: Vec; until: number; readyAt: number };
  /** Heat from recent shots: fast fire scatters. */
  recoil: Recoil;
}

/**
 * After a hit the player can't be hit again for this long: enemies move on
 * the beat, so it's two or three steps to get clear of a crowd.
 */
export const INVULNERABLE_BEATS = 2;
/** How close to the pad's centre counts as standing in the circle. */
export const PAD_RADIUS = 48;
export const PLAYER_MAX_HP = 5;
/** Health with every bonus heart stacked on (see `BONUS_HEARTS`). */
export const hpCap = (world: Pick<World, 'maxHp'>): number =>
  world.maxHp + BONUS_HEARTS;
/**
 * Enemies can appear anywhere, close too - their marker pulses first - but
 * never right on top of the player.
 */
const SPAWN_MIN_TILES = 4;

/** What the player can see, in world pixels: the camera and the view's size. */
export interface View {
  center: Vec;
  size: Vec;
}

/** Inside the view, a tile clear of its edge, so a marker is never cut off. */
const inView = (view: View, point: Vec) =>
  Math.abs(point.x - view.center.x) <= view.size.x / 2 - TILE_SIZE &&
  Math.abs(point.y - view.center.y) <= view.size.y / 2 - TILE_SIZE;

/**
 * Spots on screen if there are any, so a wave's markers are seen for the
 * whole telegraph; anywhere otherwise, so a wave always comes.
 */
const visibleFirst = (spots: Array<Vec>, view: View | undefined) => {
  if (!view) return spots;
  const seen = spots.filter(spot => inView(view, spot));
  return seen.length > 0 ? seen : spots;
};

export const createWorld = (
  level: Level,
  rules: WaveRules = DEFAULT_RULES,
  /** Carried over from the previous level of a run. */
  {
    hp = PLAYER_MAX_HP,
    kills = 0,
    score = 0,
    bag = [],
  }: {
    hp?: number;
    kills?: number;
    score?: number;
    bag?: Array<WeaponRecipe>;
  } = {},
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
  bag,
  hearts: [],
  powerups: [],
  powered: NOT_POWERED,
  projectiles: [],
  hostiles: [],
  beams: [],
  pendingShots: [],
  nextId: 1,
  invulnerableUntil: 0,
  // Never dashed: not dashing at any time, not even a clock short of zero.
  dash: { direction: { x: 1, y: 0 }, until: -Infinity, readyAt: 0 },
  recoil: NO_RECOIL,
});

/** A shot on its way; a chord running when it sounds fires it three ways. */
export const queueShot = (world: World, shot: PendingShot): World => ({
  ...world,
  pendingShots: [
    ...world.pendingShots,
    ...(isPowered(world.powered, 'chord', shot.time)
      ? chordShots(shot)
      : [shot]),
  ],
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
  {
    time,
    beat,
    bar,
    distance,
    halfTime,
  }: {
    time: number;
    beat: number;
    bar: number;
    distance: number;
    /** Half-time: lining up every other bar, walking every other beat. */
    halfTime: boolean;
  },
): Enemy | null => {
  if (time < enemy.spawnAt) return enemy;
  if (beat === 0 && enemy.aim) {
    const dash = scale(enemy.aim, DASH_TILES * TILE_SIZE);
    const landing = moveCircle(world.level.map, enemy.to, dash, ENEMY_RADIUS);
    return { ...planHop(enemy, landing, time, DASH_SECONDS), aim: null };
  }
  const linesUp = !halfTime || bar % 2 === 0;
  if (beat === 2 && linesUp && distance >= 0 && distance <= CHARGE_RANGE) {
    const aim = normalize(subtract(world.player.position, enemy.to));
    return { ...enemy, aim };
  }
  // Closes in on beat 2 - and on beat 4 too while it's still far off.
  const walks =
    !halfTime && (beat === 1 || (beat === 3 && distance > CHARGE_RANGE));
  return walks && !enemy.aim ? null : enemy;
};

/**
 * On every beat: enemies act on the clock. Hoppers hop one tile along the
 * flow field towards the player, never onto a tile another enemy holds -
 * the nearest move first and free their tile as they go, so a line of them
 * flows through a doorway. Chargers line up and dash (see `chargerBeat`).
 * A pellet turns them all (the boss aside) to run from the player instead,
 * and half-time holds them still on the off beats.
 */
export const onBeat = (
  world: World,
  {
    time,
    beat,
    bar = 0,
    beatSeconds = 0,
  }: { time: number; beat: number; bar?: number; beatSeconds?: number },
): World => {
  const { map } = world.level;
  const field = distanceField(map, tileOf(world.player.position));
  const distance = (enemy: Enemy) => distanceAt(map, field, tileOf(enemy.to));
  const boss = world.enemies.find(
    enemy => enemy.kind === 'boss' && time >= enemy.spawnAt,
  );
  const move = boss
    ? bossMove(bossPhase(boss.hp, world.rules.bossHp), { bar, beat })
    : null;
  const fleeing = isPowered(world.powered, 'pellet', time);
  const halfTime = isPowered(world.powered, 'halfTime', time);
  const special = new Map(
    world.enemies.flatMap(enemy => {
      // The boss lumbers, stepping only when its phase says so.
      if (enemy.kind === 'boss') {
        return move?.steps ? [] : [[enemy.id, enemy] as const];
      }
      // Half-time: everything else stands still on the off beats.
      if (halfTime && beat % 2 === 1) return [[enemy.id, enemy] as const];
      // Running scared, a charger drops its dash and runs like the rest.
      if (enemy.kind !== 'charger' || fleeing) return [];
      const acted = chargerBeat(world, enemy, {
        time,
        beat,
        bar,
        distance: distance(enemy),
        halfTime,
      });
      return acted ? [[enemy.id, acted] as const] : [];
    }),
  );
  const step = fleeing ? stepUphill : stepDownhill;
  // Closing in, the nearest go first; running, the furthest clear the way.
  const order = fleeing ? -1 : 1;
  const nearestFirst = world.enemies
    .filter(enemy => !special.has(enemy.id))
    .sort((a, b) => order * (distance(a) - distance(b)));
  const hopSeconds = halfTime ? HOP_SECONDS * 2 : HOP_SECONDS;

  const { hops } = nearestFirst.reduce<{
    hops: Map<number, Enemy>;
    taken: Set<string>;
  }>(
    (acc, enemy) => {
      const here = tileOf(enemy.to);
      const next = step(map, field, here, pos => acc.taken.has(tileKey(pos)));
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
            enemy.kind === 'boss' ? HOP_SECONDS * 2 : hopSeconds,
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

  const moved = {
    ...world,
    enemies: world.enemies.map(enemy => {
      const acted = special.get(enemy.id) ?? hops.get(enemy.id) ?? enemy;
      // Running scared drops a lined-up dash for good.
      const next = fleeing && acted.aim ? { ...acted, aim: null } : acted;
      return enemy === boss && move?.windup
        ? { ...next, windupUntil: time + beatSeconds }
        : next;
    }),
  };
  return boss && move
    ? bossActs(moved, boss, move, { time, bar, beat })
    : moved;
};

/** How far from the boss its hoppers turn up, in tiles. */
const SUMMON_TILES = 3;
const SUMMON_STREAM = 40;

/** The boss's volley and summons for this beat (see `bossMove`). */
const bossActs = (
  world: World,
  boss: Enemy,
  move: ReturnType<typeof bossMove>,
  { time, bar, beat }: { time: number; bar: number; beat: number },
): World => {
  const phase = bossPhase(boss.hp, world.rules.bossHp);
  const center = enemyPosition(boss, time);
  const fired = move.volley
    ? volley({
        phase,
        center,
        time,
        firstId: world.nextId,
        turn: bar * 4 + beat,
      })
    : [];
  const armed = {
    ...world,
    hostiles: [...world.hostiles, ...fired],
    nextId: world.nextId + fired.length,
  };
  const room = MAX_ENEMIES - world.enemies.length;
  const count = Math.min(move.summon, room);
  if (count <= 0) return armed;
  const near = spawnSpots(armed).filter(
    spot => length(subtract(spot, center)) <= SUMMON_TILES * TILE_SIZE,
  );
  const wave = spawnWave({
    rng: createRng(deriveSeed(world.level.seed, SUMMON_STREAM, bar)),
    count,
    firstId: armed.nextId,
    candidates: near,
    time,
  });
  return {
    ...armed,
    enemies: [...armed.enemies, ...wave],
    nextId: armed.nextId + wave.length,
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

/** The bag sorted in the loadout menu: what's left in it, in its order. */
export const setBag = (world: World, bag: Array<WeaponRecipe>): World => ({
  ...world,
  bag: bag.slice(0, BAG_SIZE),
});

const placeHeart = (world: World, position: Vec): World => ({
  ...world,
  hearts: [...world.hearts, { id: world.nextId, position }],
  nextId: world.nextId + 1,
});

const placePowerup = (
  world: World,
  kind: PowerupKind,
  position: Vec,
): World => ({
  ...world,
  powerups: [...world.powerups, { id: world.nextId, position, kind }],
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
  if (drop === 'powerup') {
    return placePowerup(world, powerupFor(seed, enemy.id), position);
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
    view,
  }: {
    count: number;
    time: number;
    rng: Rng;
    chargerChance: number;
    view?: View;
  },
): World => {
  if (count === 0) return world;
  const wave = spawnWave({
    rng,
    count,
    firstId: world.nextId,
    candidates: visibleFirst(spawnSpots(world), view),
    time,
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
 * appear `telegraphSeconds` after the bar, their markers pulsing until then,
 * on screen when `view` says where that is.
 */
export const onBar = (
  world: World,
  {
    bar,
    time,
    rng,
    telegraphSeconds = 0,
    view,
  }: {
    bar: number;
    time: number;
    rng: Rng;
    telegraphSeconds?: number;
    view?: View;
  },
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
      view,
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
        view,
      })
    : advanced;
  return boss ? spawnTheBoss(waved, { time: spawnAt, rng, view }) : waved;
};

const spawnTheBoss = (
  world: World,
  { time, rng, view }: { time: number; rng: Rng; view?: View },
): World => {
  const far = spawnSpots(world).filter(
    spot =>
      length(subtract(spot, world.player.position)) >=
      BOSS_MIN_TILES * TILE_SIZE,
  );
  const spots = visibleFirst(far.length > 0 ? far : spawnSpots(world), view);
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
  /** Crushed and slow shots that burst this frame. */
  blasts: Array<Blast>;
  /** Hearts picked up this frame. */
  healed: Array<Vec>;
  /** Weapons that went into the bag this frame. */
  collected: Array<Vec>;
  /** Powerups picked up this frame. */
  powered: Array<Powerup>;
  /** Where an enemy or an orb hit the player, if one did this frame. */
  playerHit: Vec | null;
}

/**
 * One animation frame. Movement integrates over `dt`; everything musical
 * (shots, hops, spawns, orbs) is read at `now` on the audio clock, and
 * `beat` is the beat `now` falls in, for chaining kills into a combo.
 */
export const stepWorld = (
  world: World,
  {
    input,
    dt,
    now,
    beat = 0,
    beatSeconds = 60 / 140,
  }: {
    input: PlayerInput;
    dt: number;
    now: number;
    beat?: number;
    /** For the dash's cooldown, counted in beats. */
    beatSeconds?: number;
  },
): FrameResult => {
  // A finished run freezes where it ended.
  if (world.status !== 'playing') {
    return {
      world,
      kills: [],
      blasts: [],
      playerHit: null,
      healed: [],
      collected: [],
      powered: [],
    };
  }

  const { map } = world.level;
  const dashes = input.dash === true && now >= world.dash.readyAt;
  const dash = dashes
    ? {
        direction: dashDirection(world.player, input),
        until: now + DASH.seconds,
        readyAt: now + DASH.cooldownBeats * beatSeconds,
      }
    : world.dash;
  const dashing = now < dash.until;
  const moved = stepPlayer(
    world.player,
    input,
    dt,
    map,
    dashing ? dash.direction : null,
  );
  // A near miss bends onto the enemy, so the gun turns to it and shots follow.
  const player = {
    ...moved,
    aim: assistAim({
      aim: moved.aim,
      from: moved.position,
      enemies: world.enemies,
      now,
      cone: input.assist ?? 0,
    }),
  };
  const due = world.pendingShots.filter(shot => shot.time <= now);
  const isBeam = (shot: PendingShot) => shot.spec.kind === 'beam';
  // Each shot scatters by the heat the ones before it left.
  const kicked = due
    .filter(shot => !isBeam(shot))
    .toSorted((a, b) => a.time - b.time)
    .reduce<{ recoil: Recoil; kick: number; fired: Array<Projectile> }>(
      (acc, shot) => {
        // A chord's side shots fly with the shot they flank (sorted after
        // it), so a chord heats the gun no more than the one shot would.
        const kick = shot.side
          ? { recoil: acc.recoil, angle: acc.kick }
          : kickRecoil(acc.recoil, { time: shot.time, seed: world.level.seed });
        return {
          recoil: kick.recoil,
          kick: kick.angle,
          fired: [
            ...acc.fired,
            fireProjectile(player, { ...shot, angle: shot.angle + kick.angle }),
          ],
        };
      },
      { recoil: world.recoil, kick: 0, fired: [] },
    );
  const { fired } = kicked;
  const firedBeams = due
    .filter(isBeam)
    .map(shot => fireBeam(player, shot, map));
  const flight = flyProjectiles([...world.projectiles, ...fired], {
    dt,
    now,
    map,
  });

  const beamed = resolveBeams(firedBeams, world.enemies, now);
  const shot = resolveHits(flight.flying, beamed.enemies, now);
  // Slow shots that ran out of range or hit a wall go off where they were.
  const fizzled = flight.spent.flatMap(projectile =>
    projectile.splash
      ? [{ position: projectile.position, splash: projectile.splash }]
      : [],
  );
  const blasts = [...shot.impacts, ...fizzled];
  const blasted = resolveBlasts(blasts, shot.enemies, map, now);
  const hits = {
    projectiles: shot.projectiles,
    enemies: blasted.enemies,
    killed: [...beamed.killed, ...shot.killed, ...blasted.killed],
  };
  // Dashing passes through enemies: they neither hurt nor burst.
  const contacts = dashing
    ? { enemies: hits.enemies, touched: [] }
    : resolveContacts(player.position, hits.enemies, now);
  // On a pellet, whatever runs gets eaten; the boss still hurts.
  const eating = isPowered(world.powered, 'pellet', now);
  const eaten = eating
    ? contacts.touched.filter(({ enemy }) => enemy.kind !== 'boss')
    : [];
  const harmful = eating
    ? contacts.touched.filter(({ enemy }) => enemy.kind === 'boss')
    : contacts.touched;
  const killed = [...hits.killed, ...eaten];
  const flyingOrbs = world.hostiles.filter(
    hostile =>
      hostile.expiresAt > now &&
      !isWall(map, tileOf(hostilePosition(hostile, now))),
  );
  const struck = hostilesTouching(flyingOrbs, {
    position: player.position,
    radius: PLAYER_RADIUS,
    now,
  });
  const canBeHit = now >= world.invulnerableUntil && !dashing;
  const touched =
    harmful[0]?.position ??
    (struck[0] ? hostilePosition(struck[0], now) : null);
  const playerHit = canBeHit ? touched : null;
  const hurt = playerHit ? world.hp - 1 : world.hp;
  // Hearts drift in; walking over one heals, stacking bonus hearts on top
  // of full health up to the cap.
  const hearts = attractHearts(world.hearts, {
    player: player.position,
    dt,
    canHeal: hurt > 0 && hurt < hpCap(world),
  });
  const reachable = heartsInReach(hearts, player.position);
  const healed = hurt > 0 ? reachable.slice(0, hpCap(world) - hurt) : [];
  const hp = hurt + healed.length;
  // Weapons drift in too, and drop into the bag while it has room.
  const room = BAG_SIZE - world.bag.length;
  const pickups = attractPickups(world.pickups, {
    player: player.position,
    dt,
    hasRoom: room > 0,
  });
  const collected = pickupsInReach(pickups, player.position).slice(0, room);
  const powerups = attractPowerups(world.powerups, {
    player: player.position,
    dt,
  });
  const powered = powerupsInReach(powerups, player.position);
  const barSeconds = beatSeconds * 4;
  const survival = chargeCircle(world.survival, {
    inside: onPad(world, player.position),
    dt,
    barSeconds,
  });
  const status = hp <= 0 ? 'dead' : exitTaken(survival) ? 'cleared' : 'playing';
  // Every kill this frame lands on the same beat, each extending the chain.
  const scored = killed.reduce(
    (acc, kill) => {
      const next = registerKill(acc.combo, beat);
      const points = eaten.includes(kill)
        ? next.points * EATEN_POINTS
        : next.points;
      return { combo: next.combo, score: acc.score + points };
    },
    { combo: world.combo, score: world.score },
  );
  const looted = killed.reduce(
    (acc, kill) => dropLoot(acc, kill.enemy, kill.position),
    {
      ...world,
      hearts,
      pickups: pickups.filter(pickup => !collected.includes(pickup)),
      powerups: powerups.filter(powerup => !powered.includes(powerup)),
      powered: powered.reduce(
        (acc, { kind }) => powerUp(acc, kind, { now, barSeconds }),
        world.powered,
      ),
      // The same bag when nothing went in, so the HUD sees no change.
      bag:
        collected.length > 0
          ? [...world.bag, ...collected.map(pickup => pickup.recipe)]
          : world.bag,
    },
  );
  // A dead boss's orbs fizzle with it.
  const bossDown = killed.some(kill => kill.enemy.kind === 'boss');

  return {
    world: {
      ...looted,
      survival,
      status,
      hp,
      kills: world.kills + killed.length,
      // The step stops once a level ends, so the bonus lands once.
      score: scored.score + (status === 'cleared' ? LEVEL_CLEAR_BONUS : 0),
      combo: scored.combo,
      player,
      projectiles: hits.projectiles,
      hostiles: bossDown
        ? []
        : flyingOrbs.filter(hostile => dashing || !struck.includes(hostile)),
      beams: [...world.beams, ...firedBeams].filter(
        beam => beam.expiresAt > now,
      ),
      enemies: contacts.enemies,
      hearts: looted.hearts.filter(heart => !healed.includes(heart)),
      pendingShots: world.pendingShots.filter(shot => shot.time > now),
      invulnerableUntil: playerHit
        ? now + INVULNERABLE_BEATS * beatSeconds
        : world.invulnerableUntil,
      dash,
      recoil: kicked.recoil,
    },
    kills: killed.map(kill => kill.position),
    blasts,
    playerHit,
    healed: healed.map(heart => heart.position),
    collected: collected.map(pickup => pickup.position),
    powered,
  };
};

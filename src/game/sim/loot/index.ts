import { createRng, deriveSeed } from '../../rng';
import { add, length, normalize, scale, subtract, type Vec } from '../../vec';
import type { FxPart, WeaponRecipe } from '../../weapons';

/** A weapon lying in the level, drifting into the bag once in reach. */
export interface Pickup {
  id: number;
  position: Vec;
  recipe: WeaponRecipe;
}

/** A heart on the floor: walking over it heals one hit point. */
export interface Heart {
  id: number;
  position: Vec;
}

/** Chance any single kill drops a weapon - the only way new ones arrive. */
const WEAPON_DROP_CHANCE = 0.1;
/** Chance a kill that drops no weapon drops a heart instead. */
const HEART_DROP_CHANCE = 0.08;
/** Chance a kill that drops neither drops a powerup (see `sim/powerup`). */
const POWERUP_DROP_CHANCE = 0.04;
/** The boss always drops a good weapon and this many hearts. */
export const BOSS_HEARTS = 2;
/** How close a heart or a weapon has to come to be picked up. */
export const PICKUP_RADIUS = 40;
/** Loot this close drifts in towards the player, faster as they near. */
export const MAGNET_RADIUS = 170;
/** px/s at the magnet's rim, and how much faster it gets right up close. */
const MAGNET_SPEED = 240;
const MAGNET_PULL = 1100;
/**
 * Hearts past the starting health: picked up at full health, they stack
 * on top as bonus hearts, lost first when hit. Saving health pays off.
 */
export const BONUS_HEARTS = 3;
const LOOT_STREAM = 30;
/**
 * Weapons a run's bag holds. Past it, drops wait on the floor until the
 * player makes room, so a full bag never loses one.
 */
export const BAG_SIZE = 24;

export type Drop = 'weapon' | 'heart' | 'powerup' | null;

/** Seeded per enemy, so a level's drops are the same every time. */
export const dropOnKill = (levelSeed: number, enemyId: number): Drop => {
  const rng = createRng(deriveSeed(levelSeed, LOOT_STREAM, enemyId));
  if (rng.chance(WEAPON_DROP_CHANCE)) return 'weapon';
  if (rng.chance(HEART_DROP_CHANCE)) return 'heart';
  return rng.chance(POWERUP_DROP_CHANCE) ? 'powerup' : null;
};

/** A kill's weapon, at `tier` (see `lootTier`). */
export const lootRecipe = (
  levelSeed: number,
  pickupId: number,
  tier = 1,
): WeaponRecipe => ({
  seed: deriveSeed(levelSeed, LOOT_STREAM, 1_000_000 + pickupId),
  tier,
});

/** Boss loot: the heavier maker with an FX, never a plain roll. */
export const goodLootRecipe = (
  levelSeed: number,
  pickupId: number,
  tier = 1,
): WeaponRecipe => {
  const seed = deriveSeed(levelSeed, LOOT_STREAM, 2_000_000 + pickupId);
  const fx = createRng(seed).pick<FxPart>(['distortion', 'echo']);
  return { seed, manufacturer: 'vandal', fx, tier };
};

/** Hearts the player is over, while there's health to heal. */
export const heartsInReach = (
  hearts: Array<Heart>,
  position: Vec,
): Array<Heart> =>
  hearts.filter(
    heart => length(subtract(heart.position, position)) <= PICKUP_RADIUS,
  );

/** Weapons the player is over, nearest first. */
export const pickupsInReach = (
  pickups: Array<Pickup>,
  position: Vec,
): Array<Pickup> =>
  pickups
    .map(pickup => ({
      pickup,
      distance: length(subtract(pickup.position, position)),
    }))
    .filter(({ distance }) => distance <= PICKUP_RADIUS)
    .toSorted((a, b) => a.distance - b.distance)
    .map(({ pickup }) => pickup);

/**
 * One frame of the magnet: `position` drifts towards `target` when within
 * reach.
 */
export const pullTowards = (
  position: Vec,
  target: Vec,
  { dt }: { dt: number },
): Vec => {
  const towards = subtract(target, position);
  const distance = length(towards);
  if (distance > MAGNET_RADIUS || distance === 0) return position;
  const speed = MAGNET_SPEED + MAGNET_PULL * (1 - distance / MAGNET_RADIUS);
  const step = Math.min(speed * dt, distance);
  return add(position, scale(normalize(towards), step));
};

/**
 * Hearts drift in while there's health (or a bonus heart) to gain, so
 * they're easy to grab mid-fight.
 */
export const attractHearts = (
  hearts: Array<Heart>,
  { player, dt, canHeal }: { player: Vec; dt: number; canHeal: boolean },
): Array<Heart> =>
  canHeal
    ? hearts.map(heart => ({
        ...heart,
        position: pullTowards(heart.position, player, { dt }),
      }))
    : hearts;

/**
 * Weapons drift in while the bag has room, so loot never piles up on the
 * floor: the player sorts it in the loadout menu instead.
 */
export const attractPickups = (
  pickups: Array<Pickup>,
  { player, dt, hasRoom }: { player: Vec; dt: number; hasRoom: boolean },
): Array<Pickup> =>
  hasRoom
    ? pickups.map(pickup => ({
        ...pickup,
        position: pullTowards(pickup.position, player, { dt }),
      }))
    : pickups;

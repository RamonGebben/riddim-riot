import { createRng, deriveSeed } from '../../rng';
import { add, length, normalize, scale, subtract, type Vec } from '../../vec';
import type { FxPart, WeaponRecipe } from '../../weapons';

/** A weapon lying in the level, waiting to be swapped in. */
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
/** The boss always drops a good weapon and this many hearts. */
export const BOSS_HEARTS = 2;
/** How close the player has to stand to take a weapon. */
export const PICKUP_RADIUS = 40;
/** Hearts this close drift in towards the player, faster as they near. */
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

export type Drop = 'weapon' | 'heart' | null;

/** Seeded per enemy, so a level's drops are the same every time. */
export const dropOnKill = (levelSeed: number, enemyId: number): Drop => {
  const rng = createRng(deriveSeed(levelSeed, LOOT_STREAM, enemyId));
  if (rng.chance(WEAPON_DROP_CHANCE)) return 'weapon';
  return rng.chance(HEART_DROP_CHANCE) ? 'heart' : null;
};

export const lootRecipe = (
  levelSeed: number,
  pickupId: number,
): WeaponRecipe => ({
  seed: deriveSeed(levelSeed, LOOT_STREAM, 1_000_000 + pickupId),
});

/** Boss loot: the heavier maker with an FX, never a plain roll. */
export const goodLootRecipe = (
  levelSeed: number,
  pickupId: number,
): WeaponRecipe => {
  const seed = deriveSeed(levelSeed, LOOT_STREAM, 2_000_000 + pickupId);
  const fx = createRng(seed).pick<FxPart>(['distortion', 'echo']);
  return { seed, manufacturer: 'vandal', fx };
};

/** Hearts the player is over, while there's health to heal. */
export const heartsInReach = (
  hearts: Array<Heart>,
  position: Vec,
): Array<Heart> =>
  hearts.filter(
    heart => length(subtract(heart.position, position)) <= PICKUP_RADIUS,
  );

export const nearestPickup = (
  pickups: Array<Pickup>,
  position: Vec,
): Pickup | null =>
  pickups
    .map(pickup => ({
      pickup,
      distance: length(subtract(pickup.position, position)),
    }))
    .filter(({ distance }) => distance <= PICKUP_RADIUS)
    .sort((a, b) => a.distance - b.distance)[0]?.pickup ?? null;

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
 * they're easy to grab mid-fight. Weapons stay where they fell: the player
 * walks over to the one they want.
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

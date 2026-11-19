import { createRng, deriveSeed } from '../../rng';
import { length, subtract, type Vec } from '../../vec';
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

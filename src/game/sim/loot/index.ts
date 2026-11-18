import { createRng, deriveSeed } from '../../rng';
import { length, subtract, type Vec } from '../../vec';
import type { WeaponRecipe } from '../../weapons';

/** A weapon lying in the level, waiting to be swapped in. */
export interface Pickup {
  id: number;
  position: Vec;
  recipe: WeaponRecipe;
}

/** Chance any single kill drops a weapon; a cleared wave always does. */
const KILL_DROP_CHANCE = 0.06;
/** How close the player has to stand to take a weapon. */
export const PICKUP_RADIUS = 40;
const LOOT_STREAM = 30;

/** Seeded per enemy, so a level's drops are the same every time. */
export const dropsOnKill = (levelSeed: number, enemyId: number): boolean =>
  createRng(deriveSeed(levelSeed, LOOT_STREAM, enemyId)).chance(
    KILL_DROP_CHANCE,
  );

export const lootRecipe = (
  levelSeed: number,
  pickupId: number,
): WeaponRecipe => ({
  seed: deriveSeed(levelSeed, LOOT_STREAM, 1_000_000 + pickupId),
});

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

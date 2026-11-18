import type { Key } from '../../music';
import { rollWeapon } from '../roll';
import type { OscillatorPart, Weapon } from '../types';

/**
 * What a weapon is, apart from the key it plays in: a seed and an optional
 * pinned engine. Carrying recipes from level to level and rolling them in
 * the new key transposes a loadout for free.
 */
export interface WeaponRecipe {
  seed: number;
  oscillator?: OscillatorPart;
}

export const weaponFrom = (recipe: WeaponRecipe, key: Key): Weapon =>
  rollWeapon(recipe.seed, key, { oscillator: recipe.oscillator });

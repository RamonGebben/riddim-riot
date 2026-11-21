import type { Key } from '../../music';
import { rollWeapon } from '../roll';
import type {
  FxPart,
  ManufacturerPart,
  OscillatorPart,
  Weapon,
} from '../types';

/**
 * What a weapon is, apart from the key it plays in: a seed and an optional
 * pinned engine. Carrying recipes from level to level and rolling them in
 * the new key transposes a loadout for free.
 */
export interface WeaponRecipe {
  seed: number;
  oscillator?: OscillatorPart;
  /** Boss loot pins the heavier maker and an FX, so it's always a good roll. */
  manufacturer?: ManufacturerPart;
  fx?: FxPart;
}

/** The same weapon: seed and pins alike, whatever object carries them. */
export const sameRecipe = (a: WeaponRecipe, b: WeaponRecipe): boolean =>
  a.seed === b.seed &&
  a.oscillator === b.oscillator &&
  a.manufacturer === b.manufacturer &&
  a.fx === b.fx;

export const weaponFrom = (
  { seed, oscillator, manufacturer, fx }: WeaponRecipe,
  key: Key,
): Weapon => rollWeapon(seed, key, { pins: { oscillator, manufacturer, fx } });

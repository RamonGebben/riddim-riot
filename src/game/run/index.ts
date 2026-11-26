import { deriveSeed } from '../rng';
import { PLAYER_MAX_HP } from '../sim/world';
import type { Rig } from '../rig';
import type { OscillatorPart, WeaponRecipe } from '../weapons';

/** Everything that carries from one level of a run to the next. */
export interface RunState {
  /** The run's seed; level 1 plays it directly. */
  seed: number;
  /** 1-based. */
  level: number;
  hp: number;
  kills: number;
  score: number;
  recipes: Array<WeaponRecipe>;
  active: number;
  /** Weapons picked up this run and not equipped; empty at a run's start. */
  bag: Array<WeaponRecipe>;
  /** Rigged for play-testing (see `rig`); kept on every level after. */
  rig?: Rig;
}

/** Keeps weapon rolls their own random stream, apart from drums and spawns. */
const WEAPON_STREAM = 2;
const LEVEL_STREAM = 20;
/** A run opens with one of each engine, unless the player kept a loadout. */
const STARTING_ENGINES: Array<OscillatorPart> = ['wobble', 'laser', 'beam'];

/** The weapons a run on `seed` opens with when there's no kept loadout. */
export const starterRecipes = (seed: number): Array<WeaponRecipe> =>
  STARTING_ENGINES.map((oscillator, slot) => ({
    seed: deriveSeed(seed, WEAPON_STREAM, slot, 0),
    oscillator,
  }));

/**
 * A fresh run: full health, an empty bag, and the loadout the player kept
 * from their last run (`recipes`) or the seed's starter.
 */
export const newRun = (
  seed: number,
  recipes: Array<WeaponRecipe> = starterRecipes(seed),
): RunState => ({
  seed,
  level: 1,
  hp: PLAYER_MAX_HP,
  kills: 0,
  score: 0,
  recipes,
  active: 0,
  bag: [],
});

/** The seed of the level the run is on: a fresh layout, key and palette. */
export const levelSeed = ({
  seed,
  level,
}: Pick<RunState, 'seed' | 'level'>): number =>
  level === 1 ? seed : deriveSeed(seed, LEVEL_STREAM, level);

export const nextLevel = (
  run: RunState,
  carry: Pick<
    RunState,
    'hp' | 'kills' | 'score' | 'recipes' | 'active' | 'bag'
  >,
): RunState => ({ ...run, ...carry, level: run.level + 1 });

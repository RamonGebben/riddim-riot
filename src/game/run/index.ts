import { deriveSeed } from '../rng';
import { PLAYER_MAX_HP } from '../sim/world';
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
}

/** Keeps weapon rolls their own random stream, apart from drums and spawns. */
const WEAPON_STREAM = 2;
const LEVEL_STREAM = 20;
/** A run opens with one of each engine. */
const STARTING_ENGINES: Array<OscillatorPart> = ['wobble', 'laser', 'beam'];

export const newRun = (seed: number): RunState => ({
  seed,
  level: 1,
  hp: PLAYER_MAX_HP,
  kills: 0,
  score: 0,
  recipes: STARTING_ENGINES.map((oscillator, slot) => ({
    seed: deriveSeed(seed, WEAPON_STREAM, slot, 0),
    oscillator,
  })),
  active: 0,
});

/** The seed of the level the run is on: a fresh layout, key and palette. */
export const levelSeed = ({ seed, level }: RunState): number =>
  level === 1 ? seed : deriveSeed(seed, LEVEL_STREAM, level);

export const nextLevel = (
  run: RunState,
  carry: Pick<RunState, 'hp' | 'kills' | 'score' | 'recipes' | 'active'>,
): RunState => ({ ...run, ...carry, level: run.level + 1 });

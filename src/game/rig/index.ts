import { styleFor, SUBGENRES, type LevelStyle, type Subgenre } from '../genre';
import { createRng, deriveSeed } from '../rng';
import { levelSeed, type RunState } from '../run';
import { MAX_TIER, tierOf } from '../tier';
import type { OscillatorPart, WeaponRecipe } from '../weapons';

/**
 * A run rigged for play-testing, from the dev console (`riot`): start on a
 * later level, force a subgenre or tempo, take no hits. A rigged run never
 * goes on the board or counts as the device's best.
 */
export interface Rig {
  /** The level the run starts on. */
  level?: number;
  /** Every level of the run plays this, not what its seed rolls. */
  subgenre?: Subgenre;
  /** Every level plays at this tempo. */
  bpm?: number;
  /** The player can't be hit. */
  god?: boolean;
  /** The stress test: the level full of enemies from the first bar. */
  stress?: boolean;
  /** No circle to stand in: the song plays from the first bar. */
  skipCircle?: boolean;
  /** The run's seed, as `?seed` would set it. */
  seed?: number;
}

/** The subgenres a rig can force, as the console names them. */
export const RIG_SUBGENRES = Object.keys(SUBGENRES) as Array<Subgenre>;

/** The tempos a rig takes; past them the grid's timing stops making sense. */
export const RIG_BPM = [60, 200] as const;

const isSubgenre = (value: unknown): value is Subgenre =>
  typeof value === 'string' && Object.hasOwn(SUBGENRES, value);

const wholeIn = (value: unknown, min: number, max: number) =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= min &&
  value <= max;

/**
 * The fields of `input` that make a valid rig, the rest dropped: what's
 * read back from storage may be anything. Off switches are left out, so
 * an unrigged run is `{}`.
 */
export const cleanRig = (input: unknown): Rig => {
  if (typeof input !== 'object' || input === null) return {};
  const raw = input as Record<string, unknown>;
  return {
    ...(wholeIn(raw.level, 1, MAX_TIER) && { level: raw.level as number }),
    ...(isSubgenre(raw.subgenre) && { subgenre: raw.subgenre }),
    ...(wholeIn(raw.bpm, ...RIG_BPM) && { bpm: raw.bpm as number }),
    ...(raw.god === true && { god: true }),
    ...(raw.stress === true && { stress: true }),
    ...(raw.skipCircle === true && { skipCircle: true }),
    ...(wholeIn(raw.seed, 0, 2 ** 32 - 1) && { seed: raw.seed as number }),
  };
};

export const isRigged = (rig: Rig | undefined): boolean =>
  Object.keys(rig ?? {}).length > 0;

/**
 * A fresh run with `rig` applied: on its level, with the loadout raised to
 * that level's tier (a weapon carried there would be), the rig carried in
 * the run so every level after plays it too.
 */
export const rigRun = (run: RunState, rig: Rig): RunState => {
  if (!isRigged(rig)) return run;
  const level = rig.level ?? run.level;
  const tier = tierOf(level);
  return {
    ...run,
    seed: rig.seed ?? run.seed,
    level,
    recipes: run.recipes.map(recipe => ({
      ...recipe,
      tier: Math.max(recipe.tier ?? 1, tier),
    })),
    rig,
  };
};

/** The style a level plays once `rig` has had its say. */
export const rigStyle = (rolled: LevelStyle, rig: Rig | undefined) => {
  const subgenre = rig?.subgenre ?? rolled.subgenre;
  const style = SUBGENRES[subgenre];
  // A forced subgenre at its own tempo: the middle of its range.
  const own =
    subgenre === rolled.subgenre
      ? rolled.bpm
      : Math.round((style.bpm[0] + style.bpm[1]) / 2);
  return { subgenre, style, bpm: rig?.bpm ?? own };
};

/** A level's subgenre and tempo, from its seed (see `genre`) or the rig. */
export const levelStyle = (run: Pick<RunState, 'seed' | 'level' | 'rig'>) =>
  rigStyle(styleFor(levelSeed(run), run.level), run.rig);

/** One line on what a rig changes, for the start screen and the console. */
export const describeRig = (rig: Rig): string =>
  [
    rig.level !== undefined && `level ${rig.level}`,
    rig.subgenre && SUBGENRES[rig.subgenre].label,
    rig.bpm !== undefined && `${rig.bpm} BPM`,
    rig.god && 'god mode',
    rig.stress && 'stress',
    rig.skipCircle && 'no circle',
    rig.seed !== undefined && `seed ${rig.seed}`,
  ]
    .filter(Boolean)
    .join(' · ');

const ENGINES: Array<OscillatorPart> = ['wobble', 'laser', 'beam'];
const LOOT_STREAM = 70;

/**
 * `count` weapons of `tier`, the engines taken in turn, rolled from
 * `seed`: loot to sort without fighting for it.
 */
export const rigLoot = (
  seed: number,
  { tier, count }: { tier: number; count: number },
): Array<WeaponRecipe> => {
  const rng = createRng(deriveSeed(seed, LOOT_STREAM));
  // From the console, so anything: what isn't a number is the lowest tier.
  const clamped = Number.isFinite(tier) ? tierOf(tier) : 1;
  return Array.from({ length: count }, (_, i) => ({
    seed: rng.int(0, 2 ** 31),
    oscillator: ENGINES[i % ENGINES.length],
    tier: clamped,
  }));
};

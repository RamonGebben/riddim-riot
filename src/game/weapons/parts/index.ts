import type { Division } from '../../grid';
import type {
  FxPart,
  LfoPart,
  ManufacturerPart,
  OscillatorPart,
  ProjectileKind,
} from '../types';

/**
 * The gameplay half of the parts pool. Each part sets a stat here and a
 * sound in the sound design (`SoundDesign.parts`, tuned in the playground),
 * rolled together - so a weapon's feel and its sound always belong together.
 */

export const MANUFACTURERS = {
  vandal: { label: 'Vandal', damage: 1.2, speed: 0.85 },
  lumen: { label: 'Lumen', damage: 0.9, speed: 1.2 },
} satisfies Record<
  ManufacturerPart,
  { label: string; damage: number; speed: number }
>;

export const OSCILLATORS = {
  wobble: {
    label: 'Wobble',
    kind: 'blob',
    damage: 1,
    speed: 950,
    radius: 10,
    lifetime: 0.5,
  },
  laser: {
    label: 'Laser',
    kind: 'bolt',
    damage: 0.6,
    speed: 1700,
    radius: 5,
    lifetime: 0.4,
  },
  // Damage per 1/16 tick; it pierces, so a line of enemies all take it.
  beam: {
    label: 'Beam',
    kind: 'beam',
    damage: 0.32,
    speed: 1200,
    radius: 9,
    lifetime: 0.4,
  },
} satisfies Record<
  OscillatorPart,
  {
    label: string;
    kind: ProjectileKind;
    damage: number;
    speed: number;
    radius: number;
    lifetime: number;
  }
>;

/**
 * The LFO sets the fire rhythm as well as the sweep. Slower rates hit harder
 * so every rate deals about the same damage per bar, and the slow ones
 * (1/4, 1/2) trade fire rate for a blast: a bigger shot that bursts on a hit
 * or at the end of its range, wider the slower it fires.
 */
export const LFO_RATES = {
  '1/2': {
    division: '1/2',
    damage: 3.4,
    size: 1.8,
    blast: { radius: 150, share: 0.8, knockback: 64 },
  },
  '1/4': {
    division: '1/4',
    damage: 1.8,
    size: 1.35,
    blast: { radius: 96, share: 0.7, knockback: 50 },
  },
  '1/8': { division: '1/8', damage: 1, size: 1, blast: null },
  '1/16': { division: '1/16', damage: 0.55, size: 1, blast: null },
} satisfies Record<
  LfoPart,
  {
    division: Division;
    damage: number;
    /** The shot's radius, as a multiple of the engine's. */
    size: number;
    /** `share` is of the shot's own damage. */
    blast: { radius: number; share: number; knockback: number } | null;
  }
>;

/**
 * Rates by how often they roll: the 1/2 is a rare, heavy find. Thresholds on
 * one random number, so a roll draws the same count whatever it lands on.
 */
export const LFO_WEIGHTS = [
  ['1/2', 0.14],
  ['1/4', 0.3],
  ['1/8', 0.3],
  ['1/16', 0.26],
] satisfies Array<[LfoPart, number]>;

/** A crushed slow shot: its blast grows by this share of Crush's radius. */
export const CRUSHED_BLAST_GROWTH = 0.5;

/**
 * Crush trades a little direct damage for a burst on every hit: harder
 * drive, wider burst. Its share is of the shot's own damage.
 */
export const FX = {
  distortion: {
    label: 'Crush',
    damage: 1.1,
    splash: {
      radius: [64, 128] as [number, number],
      share: 0.6,
      knockback: 44,
    },
  },
  echo: { label: 'Echo' },
} satisfies {
  distortion: {
    label: string;
    damage: number;
    splash: { radius: [number, number]; share: number; knockback: number };
  };
} & Record<FxPart, { label: string }>;

/** Chance a roll gets an FX part at all. */
export const FX_CHANCE = 0.6;
export const RIFF_LENGTH = 4;
export const RELOAD_BEATS = 2;

/**
 * A beam fires on every 1/16 for up to a bar, cools a charge back every
 * `coolSteps` it rests, and run dry it overheats into a longer recharge.
 */
export const BEAM = { rechargeBeats: 4, coolSteps: 2 };

import type { Division } from '../../grid';
import type {
  FxPart,
  LfoPart,
  ManufacturerPart,
  OscillatorPart,
  ProjectileKind,
} from '../types';

/**
 * The parts pool. Each part sets a gameplay stat and a synth parameter
 * together, and every range here was picked to sound good anywhere in it -
 * a roll can't land on a harsh corner.
 */

export const MANUFACTURERS = {
  vandal: {
    label: 'Vandal',
    waveform: 'sawtooth',
    damage: 1.2,
    speed: 0.85,
    drive: 0.2,
  },
  lumen: {
    label: 'Lumen',
    waveform: 'square',
    damage: 0.9,
    speed: 1.2,
    drive: 0,
  },
} satisfies Record<
  ManufacturerPart,
  {
    label: string;
    waveform: 'sawtooth' | 'square';
    damage: number;
    speed: number;
    drive: number;
  }
>;

export const OSCILLATORS = {
  wobble: {
    label: 'Wobble',
    octave: 2,
    kind: 'blob',
    damage: 1,
    speed: 950,
    radius: 10,
    lifetime: 0.5,
    /** Riff degrees: root-heavy, all consonant over the root drone. */
    degrees: [0, 0, 2, 3, 4, 6],
    cutoff: [1400, 3000],
    resonance: [3, 8],
  },
  laser: {
    label: 'Laser',
    octave: 4,
    kind: 'beam',
    damage: 0.6,
    speed: 1700,
    radius: 5,
    lifetime: 0.4,
    degrees: [0, 2, 4, 4, 6, 7],
    cutoff: [2200, 5200],
    resonance: [1, 4],
  },
} satisfies Record<
  OscillatorPart,
  {
    label: string;
    octave: number;
    kind: ProjectileKind;
    damage: number;
    speed: number;
    radius: number;
    lifetime: number;
    degrees: Array<number>;
    cutoff: [number, number];
    resonance: [number, number];
  }
>;

/**
 * The LFO sets the fire rhythm as well as the sweep. Slower rates hit harder
 * so every rate deals about the same damage per bar.
 */
export const LFO_RATES = {
  '1/4': { division: '1/4', damage: 1.8 },
  '1/8': { division: '1/8', damage: 1 },
  '1/16': { division: '1/16', damage: 0.55 },
} satisfies Record<LfoPart, { division: Division; damage: number }>;

export const FX = {
  distortion: { label: 'Crush', drive: [0.35, 0.65], damage: 1.25 },
  echo: { label: 'Echo', feedback: [0.2, 0.4], wet: [0.25, 0.4] },
} satisfies {
  distortion: { label: string; drive: [number, number]; damage: number };
  echo: { label: string; feedback: [number, number]; wet: [number, number] };
} & Record<FxPart, { label: string }>;

/** Chance a roll gets an FX part at all. */
export const FX_CHANCE = 0.6;
export const RIFF_LENGTH = 4;
export const RELOAD_BEATS = 2;

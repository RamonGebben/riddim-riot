/**
 * Every value that shapes how the game sounds, in one place - the sound
 * playground edits it and saves it as `design.json`, which the game loads.
 * Gameplay stats (damage, speed, magazine sizes) stay in code.
 *
 * Pure and JSON-free on purpose: the Vite config imports `mergeDesign` for
 * the playground's save endpoint, and importing `design.json` here would
 * make every save restart the dev server.
 */

type Range = [number, number];

export interface EnvelopePatch {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface WobblePatch {
  envelope: EnvelopePatch;
  /** FatOscillator voices and their detune in cents. */
  voices: number;
  spread: number;
  /** Where the LFO sweep bottoms out, in Hz. */
  sweepFloor: number;
  /** LFO start phase in degrees; 270 opens each shot from closed. */
  phase: number;
  rolloff: -12 | -24 | -48;
  /** Sine sub an octave down, in dB. */
  subLevel: number;
  subRelease: number;
}

export interface LaserPatch {
  envelope: EnvelopePatch;
  /** The "pew": shots start this many times above the note and fall. */
  pitchDrop: number;
  pitchDropSeconds: number;
  /** The LFO's low end, as a share of the cutoff. */
  shimmerDepth: number;
  rolloff: -12 | -24 | -48;
}

export interface WeaponMixPatch {
  /** Share of each shot's slot the note is held, below 1 for articulation. */
  articulation: number;
  /** How much of the voice goes through the drive. */
  driveWet: number;
  holsterFadeSeconds: number;
  /** Holstered voices are high-passed here so only one owns the sub. */
  subCutHz: number;
  /** Every weapon is normalized to this RMS over a bar of held fire. */
  targetDb: number;
}

export interface ManufacturerSound {
  waveform: 'sawtooth' | 'square';
  drive: number;
}

export interface EngineRanges {
  octave: number;
  /** Scale degrees a riff picks from (the first note is always the root). */
  degrees: Array<number>;
  cutoff: Range;
  resonance: Range;
}

export interface PartsSound {
  manufacturers: { vandal: ManufacturerSound; lumen: ManufacturerSound };
  engines: { wobble: EngineRanges; laser: EngineRanges };
  crush: { drive: Range };
  echo: { feedback: Range; wet: Range };
}

export interface DrumsPatch {
  level: number;
  kick: {
    pitchMultiple: number;
    pitchSeconds: number;
    decay: number;
    level: number;
  };
  snare: {
    noiseHz: number;
    noiseDecay: number;
    noiseLevel: number;
    bodyHz: number;
    bodyDecay: number;
    bodyLevel: number;
    roomDecay: number;
    roomWet: number;
  };
  hat: { hz: number; decay: number; level: number };
  openHat: { hz: number; decay: number; level: number };
}

export interface ImpactPatch {
  level: number;
  crunchHz: number;
  crunchQ: number;
  crunchDecay: number;
  crunchLevel: number;
  thumpMultiple: number;
  thumpSeconds: number;
  thumpDecay: number;
  thumpLevel: number;
}

export interface ReloadPatch {
  level: number;
  clickHz: number;
  clickLevel: number;
  rumbleFrom: number;
  rumbleTo: number;
  rumbleLevel: number;
}

export interface ArrangementPatch {
  level: number;
  /** How open the track is per section, in Hz. */
  calmHz: number;
  grooveHz: number;
  riserFrom: number;
  riserTo: number;
  riserLevel: number;
  crashHz: number;
  crashDecay: number;
  crashLevel: number;
  boomDecay: number;
  boomLevel: number;
}

export interface SoundDesign {
  wobble: WobblePatch;
  laser: LaserPatch;
  weaponMix: WeaponMixPatch;
  parts: PartsSound;
  drums: DrumsPatch;
  impact: ImpactPatch;
  reload: ReloadPatch;
  arrangement: ArrangementPatch;
}

/** The values the game shipped with before any tuning. */
export const BASE_DESIGN: SoundDesign = {
  wobble: {
    envelope: { attack: 0.004, decay: 0.05, sustain: 1, release: 0.05 },
    voices: 3,
    spread: 30,
    sweepFloor: 160,
    phase: 270,
    rolloff: -24,
    subLevel: -6,
    subRelease: 0.05,
  },
  laser: {
    envelope: { attack: 0.002, decay: 0.12, sustain: 0.35, release: 0.05 },
    pitchDrop: 4,
    pitchDropSeconds: 0.07,
    shimmerDepth: 0.45,
    rolloff: -12,
  },
  weaponMix: {
    articulation: 0.9,
    driveWet: 0.6,
    holsterFadeSeconds: 0.35,
    subCutHz: 180,
    targetDb: -20,
  },
  parts: {
    manufacturers: {
      vandal: { waveform: 'sawtooth', drive: 0.2 },
      lumen: { waveform: 'square', drive: 0 },
    },
    engines: {
      wobble: {
        octave: 2,
        degrees: [0, 0, 2, 3, 4, 6],
        cutoff: [1400, 3000],
        resonance: [3, 8],
      },
      laser: {
        octave: 4,
        degrees: [0, 2, 4, 4, 6, 7],
        cutoff: [2200, 5200],
        resonance: [1, 4],
      },
    },
    crush: { drive: [0.35, 0.65] },
    echo: { feedback: [0.2, 0.4], wet: [0.25, 0.4] },
  },
  drums: {
    level: -4,
    kick: { pitchMultiple: 5, pitchSeconds: 0.045, decay: 0.45, level: 0 },
    snare: {
      noiseHz: 1800,
      noiseDecay: 0.2,
      noiseLevel: -6,
      bodyHz: 147,
      bodyDecay: 0.12,
      bodyLevel: -10,
      roomDecay: 1.4,
      roomWet: 0.22,
    },
    hat: { hz: 7500, decay: 0.04, level: -14 },
    openHat: { hz: 6000, decay: 0.3, level: -19 },
  },
  impact: {
    level: -9,
    crunchHz: 1100,
    crunchQ: 1.2,
    crunchDecay: 0.12,
    crunchLevel: 2,
    thumpMultiple: 4,
    thumpSeconds: 0.06,
    thumpDecay: 0.22,
    thumpLevel: 0,
  },
  reload: {
    level: -8,
    clickHz: 3200,
    clickLevel: 6,
    rumbleFrom: 150,
    rumbleTo: 1400,
    rumbleLevel: 4,
  },
  arrangement: {
    level: -8,
    calmHz: 700,
    grooveHz: 3200,
    riserFrom: 400,
    riserTo: 9000,
    riserLevel: -4,
    crashHz: 3000,
    crashDecay: 1.6,
    crashLevel: -2,
    boomDecay: 1.1,
    boomLevel: 4,
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Lay `input` over `base`, keeping only values whose type matches the base:
 * a design saved by an older build (missing fields) or a hand-edited one
 * (typos, wrong types) still loads, with the base filling every gap.
 */
const merge = <T>(base: T, input: unknown): T => {
  if (Array.isArray(base)) {
    if (!Array.isArray(input)) return base;
    const valid = input.filter(item => typeof item === typeof base[0]);
    // A pair (a min-max range) has to stay a pair; other lists can grow.
    const shapeOk = base.length !== 2 || input.length === 2;
    const usable = shapeOk && valid.length > 0 && valid.length === input.length;
    return (usable ? valid : base) as T;
  }
  if (isRecord(base)) {
    if (!isRecord(input)) return base;
    return Object.fromEntries(
      Object.entries(base).map(([key, value]) => [
        key,
        merge(value, input[key]),
      ]),
    ) as T;
  }
  if (typeof input !== typeof base) return base;
  if (typeof input === 'number' && !Number.isFinite(input)) return base;
  return input as T;
};

export const mergeDesign = (input: unknown, base = BASE_DESIGN): SoundDesign =>
  merge(base, input);

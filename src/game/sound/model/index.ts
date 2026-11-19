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

/**
 * The layers stacked on an engine so a shot is felt, not just heard: a clean
 * sub under it, a detuned stack thickening the body, a saturated growl on
 * top and a click for the hit. The body is high-passed at the crossover so
 * the sub alone owns the lows - layered lows smear into mud.
 */
export interface WeaponLayersPatch {
  crossoverHz: number;
  sub: {
    level: number;
    /** Octaves below the riff note. */
    octavesDown: number;
    /** Adds harmonics so the sub reads on small speakers. */
    saturation: number;
    release: number;
  };
  stack: {
    level: number;
    /** Octave relative to the body; -1 is a reese under it. */
    octave: number;
    /** FatOscillator detune in cents. */
    detune: number;
  };
  growl: {
    level: number;
    /** Octaves above the body. */
    octave: number;
    /** A band-pass swept by the same LFO, from here... */
    floorHz: number;
    /** ...up to this many times the cutoff. */
    peak: number;
    q: number;
    saturation: number;
  };
  click: { level: number; hz: number; decay: number };
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
  layers: WeaponLayersPatch;
}

export interface LaserPatch {
  envelope: EnvelopePatch;
  /** The "pew": shots start this many times above the note and fall. */
  pitchDrop: number;
  pitchDropSeconds: number;
  /** The LFO's low end, as a share of the cutoff. */
  shimmerDepth: number;
  rolloff: -12 | -24 | -48;
  layers: WeaponLayersPatch;
}

/**
 * Beam: one held note per beat, gliding between riff notes, its filter
 * pulsed by the LFO, over a held sub - opened when firing starts and only
 * closed when it stops, never retriggered per tick.
 */
export interface BeamPatch {
  envelope: EnvelopePatch;
  voices: number;
  spread: number;
  /** How long it slides from one riff note to the next. */
  glideSeconds: number;
  /** Where the LFO pulse bottoms out, in Hz. */
  sweepFloor: number;
  rolloff: -12 | -24 | -48;
  /** A square an octave up through the same filter. */
  topLevel: number;
  sub: { level: number; octavesDown: number; saturation: number };
  /** High noise for the burn. */
  sizzle: { level: number; hz: number };
}

/**
 * A beam's overheat and recharge, in place of the reload fill: a vent
 * hissing down on the click, a whine rising through the recharge and a ping
 * when it's ready.
 */
export interface RechargePatch {
  level: number;
  vent: { fromHz: number; toHz: number; decay: number; level: number };
  charge: { fromHz: number; toHz: number; level: number };
  ready: { decay: number; level: number };
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
  /** A compressor gluing a weapon's layers into one sound. */
  glueThreshold: number;
  glueRatio: number;
}

/** The kick ducking everything sustained, so the beat breathes. */
export interface MixPatch {
  /** How far the kick pulls the pad and air bed down, in dB. */
  bedPumpDb: number;
  /** How far it pulls the weapons down. */
  weaponPumpDb: number;
  /** How long they take to swell back. */
  pumpSeconds: number;
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
  engines: { wobble: EngineRanges; laser: EngineRanges; beam: EngineRanges };
  crush: { drive: Range };
  echo: { feedback: Range; wet: Range };
}

export interface DrumsPatch {
  level: number;
  /** Soft-clips the whole kit (0 bypasses), then a compressor glues it. */
  drive: number;
  glueThreshold: number;
  glueRatio: number;
  kick: {
    pitchMultiple: number;
    pitchSeconds: number;
    decay: number;
    level: number;
    /** A noise click for the beater. */
    clickHz: number;
    clickDecay: number;
    clickLevel: number;
    /** A clean sine tail under the punch. */
    subDecay: number;
    subLevel: number;
    /** A triangle an octave up: the knock that carries on small speakers. */
    knockDecay: number;
    knockLevel: number;
    /** Soft-clips the punch, sub and knock together; 0 bypasses it. */
    drive: number;
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
    /** A clap: band-passed noise struck three times in quick succession. */
    clapHz: number;
    clapDecay: number;
    clapLevel: number;
    /** Soft-clips the snare before its room; 0 bypasses it. */
    drive: number;
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
  /** A bright snap on top. */
  snapHz: number;
  snapDecay: number;
  snapLevel: number;
  /** A saturated square on the root for the meat. */
  bodyOctave: number;
  bodyDecay: number;
  bodySaturation: number;
  bodyLevel: number;
}

/** A crushed shot's area burst. */
export interface BlastPatch {
  level: number;
  /** A saturated sine dropping onto the root from this many times above. */
  boomMultiple: number;
  boomSeconds: number;
  boomDecay: number;
  boomSaturation: number;
  boomLevel: number;
  /** Low noise, its filter closing to a quarter as it decays. */
  noiseHz: number;
  noiseDecay: number;
  noiseLevel: number;
}

/** Points landing: a pluck that climbs the scale as the combo grows. */
export interface ScorePatch {
  level: number;
  waveform: 'sine' | 'triangle' | 'square' | 'sawtooth';
  /** Octave of a combo of one. */
  octave: number;
  decay: number;
  brightnessHz: number;
  /** An octave-up shimmer on every note. */
  shimmerLevel: number;
  echoBeats: number;
  echoFeedback: number;
  echoWet: number;
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
  /** A chord bed filling the space between the drums and the bass. */
  pad: {
    /** The chord's shape: scale degrees above each chord's root. */
    degrees: Array<number>;
    /** How long the pad takes to glide into the next chord. */
    glide: number;
    octave: number;
    level: number;
    hz: number;
    detune: number;
    /** The bed's level per section, in dB. */
    calm: number;
    groove: number;
    build: number;
    drop: number;
  };
  /** High filtered noise in the same bed, for air. */
  air: { level: number; hz: number };
}

type Wave = 'sine' | 'triangle' | 'square' | 'sawtooth';

/**
 * The song's melodic layers over the progression: an arpeggio, a lead hook
 * and offbeat chord stabs. They sit under the weapons - high-passed out of
 * the bass, pumped by the kick and ducked while the player fires.
 */
export interface BackingPatch {
  level: number;
  /** Keeps the layers out of the weapons' low end. */
  highpassHz: number;
  /** How far a shot pulls the layers down, and how fast they come back. */
  duckDb: number;
  duckSeconds: number;
  arp: {
    waveform: Wave;
    octave: number;
    level: number;
    /** The pluck's filter at rest, and where each note's envelope opens it. */
    hz: number;
    peakHz: number;
    decay: number;
  };
  lead: {
    octave: number;
    level: number;
    hz: number;
    /** Cents across the lead's detuned saws. */
    detune: number;
    /** Seconds sliding from one note to the next. */
    glide: number;
    decay: number;
    sustain: number;
    release: number;
    echoWet: number;
    echoFeedback: number;
  };
  stabs: {
    waveform: Wave;
    octave: number;
    level: number;
    hz: number;
    decay: number;
  };
}

export interface SoundDesign {
  wobble: WobblePatch;
  laser: LaserPatch;
  beam: BeamPatch;
  weaponMix: WeaponMixPatch;
  parts: PartsSound;
  drums: DrumsPatch;
  impact: ImpactPatch;
  blast: BlastPatch;
  reload: ReloadPatch;
  recharge: RechargePatch;
  arrangement: ArrangementPatch;
  backing: BackingPatch;
  mix: MixPatch;
  score: ScorePatch;
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
    layers: {
      crossoverHz: 110,
      sub: { level: -3, octavesDown: 1, saturation: 0.15, release: 0.05 },
      stack: { level: -6, octave: -1, detune: 18 },
      growl: {
        level: -9,
        octave: 1,
        floorHz: 400,
        peak: 1.6,
        q: 5,
        saturation: 0.5,
      },
      click: { level: -14, hz: 2600, decay: 0.018 },
    },
  },
  laser: {
    envelope: { attack: 0.002, decay: 0.12, sustain: 0.35, release: 0.05 },
    pitchDrop: 4,
    pitchDropSeconds: 0.07,
    shimmerDepth: 0.45,
    rolloff: -12,
    layers: {
      crossoverHz: 160,
      sub: { level: -6, octavesDown: 2, saturation: 0.1, release: 0.05 },
      stack: { level: -9, octave: -1, detune: 12 },
      growl: {
        level: -16,
        octave: 1,
        floorHz: 900,
        peak: 1.4,
        q: 4,
        saturation: 0.4,
      },
      click: { level: -12, hz: 4200, decay: 0.012 },
    },
  },
  beam: {
    envelope: { attack: 0.02, decay: 0, sustain: 1, release: 0.12 },
    voices: 3,
    spread: 24,
    glideSeconds: 0.04,
    sweepFloor: 600,
    rolloff: -24,
    topLevel: -10,
    sub: { level: -4, octavesDown: 2, saturation: 0.2 },
    sizzle: { level: -26, hz: 6000 },
  },
  weaponMix: {
    articulation: 0.9,
    driveWet: 0.6,
    holsterFadeSeconds: 0.35,
    subCutHz: 180,
    targetDb: -20,
    glueThreshold: -18,
    glueRatio: 3,
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
      beam: {
        octave: 3,
        degrees: [0, 0, 2, 3, 4],
        cutoff: [1800, 4200],
        resonance: [2, 7],
      },
    },
    crush: { drive: [0.35, 0.65] },
    echo: { feedback: [0.2, 0.4], wet: [0.25, 0.4] },
  },
  drums: {
    level: -14,
    drive: 0.12,
    glueThreshold: -16,
    glueRatio: 3,
    kick: {
      pitchMultiple: 5,
      pitchSeconds: 0.045,
      decay: 0.45,
      level: 0,
      clickHz: 3500,
      clickDecay: 0.008,
      clickLevel: -10,
      subDecay: 0.8,
      subLevel: -5,
      knockDecay: 0.07,
      knockLevel: -9,
      drive: 0.25,
    },
    snare: {
      noiseHz: 1800,
      noiseDecay: 0.24,
      noiseLevel: -5,
      bodyHz: 185,
      bodyDecay: 0.14,
      bodyLevel: -5,
      roomDecay: 1.4,
      roomWet: 0.22,
      clapHz: 1300,
      clapDecay: 0.1,
      clapLevel: -6,
      drive: 0.2,
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
    snapHz: 5000,
    snapDecay: 0.025,
    snapLevel: -6,
    bodyOctave: 1,
    bodyDecay: 0.09,
    bodySaturation: 0.6,
    bodyLevel: -8,
  },
  blast: {
    level: -10,
    boomMultiple: 3,
    boomSeconds: 0.12,
    boomDecay: 0.45,
    boomSaturation: 0.7,
    boomLevel: 0,
    noiseHz: 2400,
    noiseDecay: 0.35,
    noiseLevel: 2,
  },
  reload: {
    level: -8,
    clickHz: 3200,
    clickLevel: 6,
    rumbleFrom: 150,
    rumbleTo: 1400,
    rumbleLevel: 4,
  },
  recharge: {
    level: -10,
    vent: { fromHz: 6000, toHz: 700, decay: 0.4, level: 0 },
    charge: { fromHz: 220, toHz: 1760, level: -8 },
    ready: { decay: 0.18, level: -2 },
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
    pad: {
      degrees: [0, 2, 4, 6],
      glide: 0.25,
      octave: 3,
      level: -20,
      hz: 1400,
      detune: 22,
      calm: -4,
      groove: 0,
      build: 2,
      drop: -6,
    },
    air: { level: -30, hz: 7000 },
  },
  backing: {
    level: -12,
    highpassHz: 260,
    duckDb: -6,
    duckSeconds: 0.35,
    arp: {
      waveform: 'square',
      octave: 4,
      level: -10,
      hz: 700,
      peakHz: 4200,
      decay: 0.16,
    },
    lead: {
      octave: 5,
      level: -3,
      hz: 3800,
      detune: 18,
      glide: 0.04,
      decay: 0.3,
      sustain: 0.5,
      release: 0.12,
      echoWet: 0.25,
      echoFeedback: 0.35,
    },
    stabs: {
      waveform: 'sawtooth',
      octave: 4,
      level: -6,
      hz: 2600,
      decay: 0.09,
    },
  },
  mix: { bedPumpDb: -12, weaponPumpDb: -4, pumpSeconds: 0.24 },
  score: {
    level: -14,
    waveform: 'triangle',
    octave: 4,
    decay: 0.18,
    brightnessHz: 3500,
    shimmerLevel: -10,
    echoBeats: 0.75,
    echoFeedback: 0.3,
    echoWet: 0.25,
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

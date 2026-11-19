import type { Division } from '../grid';

/** The timing half of a weapon; everything counted on the grid, never in seconds. */
export interface WeaponSpec {
  /** The grid shots snap to. */
  division: Division;
  /** Minimum gap between two shots. */
  cooldownBeats: number;
  /** How long each shot's note is held. */
  gateBeats: number;
  /** Shots per magazine - sized so it empties on a musical boundary. */
  magazine: number;
  reloadBeats: number;
  /**
   * Continuous weapons cool while idle: one charge back per this many
   * steps. Without it, a part-used magazine only refills by emptying.
   */
  coolSteps?: number;
}

/** `beam` is continuous: a ray that hits everything along it, every 1/16. */
export type ProjectileKind = 'blob' | 'bolt' | 'beam';

export interface ProjectileSpec {
  kind: ProjectileKind;
  /** px/s; a beam reaches as far as a shot would fly in its lifetime. */
  speed: number;
  radius: number;
  damage: number;
  /** Seconds before it fizzles - the weapon's range. */
  lifetime: number;
  /** Radians either side of the aim a shot may stray. */
  spread: number;
  /** Crushed and slow shots burst where they hit (see `Splash`). */
  splash?: Splash;
  /**
   * Slow shots burst at the end of their range or on a wall too, not just
   * on a hit: a 1/4 or 1/2 lobbed into a crowd always goes off.
   */
  detonates?: boolean;
}

/**
 * Area damage for crowd control: everything within `radius` of the hit
 * takes `damage` and is shoved `knockback` px away from it.
 */
export interface Splash {
  radius: number;
  damage: number;
  knockback: number;
}

/** The echo FX: an extra, weaker shot a fixed time after each one. */
export interface Echo {
  delayBeats: number;
  damage: number;
}

export type OscillatorPart = 'wobble' | 'laser' | 'beam';
export type ManufacturerPart = 'vandal' | 'lumen';
export type LfoPart = '1/2' | '1/4' | '1/8' | '1/16';
export type FxPart = 'distortion' | 'echo';

/** Everything a voice needs to sound the weapon, resolved into the key. */
export interface WeaponSound {
  oscillator: OscillatorPart;
  waveform: 'sawtooth' | 'square';
  /** MIDI notes, one per shot, cycling - always in the level's key. */
  riff: Array<number>;
  /** How fast the filter sweeps, in beat divisions. */
  lfo: LfoPart;
  /** Hz: where the sweep (wobble) or the tone (laser) tops out. */
  cutoff: number;
  resonance: number;
  /** 0-1 waveshaping; 0 bypasses it. */
  drive: number;
  delay: { feedback: number; wet: number } | null;
}

export interface Weapon {
  seed: number;
  name: string;
  parts: {
    manufacturer: ManufacturerPart;
    oscillator: OscillatorPart;
    lfo: LfoPart;
    fx: FxPart | null;
  };
  timing: WeaponSpec;
  projectile: ProjectileSpec;
  echo: Echo | null;
  sound: WeaponSound;
}

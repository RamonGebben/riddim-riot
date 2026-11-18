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
}

export type ProjectileKind = 'blob' | 'beam';

export interface ProjectileSpec {
  kind: ProjectileKind;
  /** px/s */
  speed: number;
  radius: number;
  damage: number;
  /** Seconds before it fizzles - the weapon's range. */
  lifetime: number;
  /** Radians either side of the aim a shot may stray. */
  spread: number;
}

/** The echo FX: an extra, weaker shot a fixed time after each one. */
export interface Echo {
  delayBeats: number;
  damage: number;
}

export type OscillatorPart = 'wobble' | 'laser';
export type ManufacturerPart = 'vandal' | 'lumen';
export type LfoPart = '1/4' | '1/8' | '1/16';
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

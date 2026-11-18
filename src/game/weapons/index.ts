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

/** The PoC's hand-tuned gun: 8 shots of 1/8 is one bar, then a 2-beat fill. */
export const WOBBLE_GUN = {
  division: '1/8',
  cooldownBeats: 0.5,
  gateBeats: 0.5,
  magazine: 8,
  reloadBeats: 2,
} satisfies WeaponSpec;

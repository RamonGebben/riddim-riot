import { createRng, deriveSeed } from '../../rng';
import { length, subtract, type Vec } from '../../vec';
import { PICKUP_RADIUS, pullTowards } from '../loot';
import type { PendingShot } from '../world';

/**
 * Pickups that change the fight for a few bars, each heard as well as seen:
 * - `pellet`: enemies run, and walking into one eats it for double points
 *   (Pac-Man's power pellet). The track jumps into a drop meanwhile.
 * - `halfTime`: enemies step every other beat, and the drums play at half
 *   speed under them.
 * - `chord`: every shot fires three ways, the side shots ringing the
 *   chord's third and fifth.
 */
export type PowerupKind = 'pellet' | 'halfTime' | 'chord';

export const POWERUP_KINDS = [
  'pellet',
  'halfTime',
  'chord',
] satisfies Array<PowerupKind>;

/** What the floor and the HUD call each one. */
export const POWERUP_NAMES = {
  pellet: 'Pellet',
  halfTime: 'Half-time',
  chord: 'Chord',
} satisfies Record<PowerupKind, string>;

/** A powerup on the floor: walking over it starts it. */
export interface Powerup {
  id: number;
  position: Vec;
  kind: PowerupKind;
}

/** Until when (audio time) each powerup lasts; in the past when it's off. */
export type Powered = Record<PowerupKind, number>;

export const NOT_POWERED: Powered = {
  pellet: -Infinity,
  halfTime: -Infinity,
  chord: -Infinity,
};

/** How long each lasts, in bars. */
export const POWERUP_BARS = {
  pellet: 4,
  halfTime: 4,
  chord: 4,
} satisfies Record<PowerupKind, number>;

/** The last stretch of a pellet, in beats: enemies blink, about to turn. */
export const PELLET_WARNING_BEATS = 4;
/** An eaten enemy scores this many times a shot one. */
export const EATEN_POINTS = 2;
/** How far off the aim a chord's side shots fly, in radians. */
export const CHORD_SPREAD = 0.26;

const POWERUP_STREAM = 31;

export const isPowered = (
  powered: Powered,
  kind: PowerupKind,
  time: number,
): boolean => time < powered[kind];

/** A powerup picked up at `now`: on for its bars, or longer if it already was. */
export const powerUp = (
  powered: Powered,
  kind: PowerupKind,
  { now, barSeconds }: { now: number; barSeconds: number },
): Powered => ({
  ...powered,
  [kind]: Math.max(powered[kind], now + POWERUP_BARS[kind] * barSeconds),
});

/** Which powerup a kill drops, seeded per enemy like the rest of the loot. */
export const powerupFor = (levelSeed: number, enemyId: number): PowerupKind =>
  createRng(deriveSeed(levelSeed, POWERUP_STREAM, enemyId)).pick(POWERUP_KINDS);

/** Powerups the player is over. */
export const powerupsInReach = (
  powerups: Array<Powerup>,
  position: Vec,
): Array<Powerup> =>
  powerups.filter(
    powerup => length(subtract(powerup.position, position)) <= PICKUP_RADIUS,
  );

/** Powerups drift in like the rest of the loot: there's always room. */
export const attractPowerups = (
  powerups: Array<Powerup>,
  { player, dt }: { player: Vec; dt: number },
): Array<Powerup> =>
  powerups.map(powerup => ({
    ...powerup,
    position: pullTowards(powerup.position, player, { dt }),
  }));

/** A chord's shot: the one aimed, and one either side of it. */
export const chordShots = (shot: PendingShot): Array<PendingShot> => [
  shot,
  { ...shot, angle: shot.angle - CHORD_SPREAD, side: true },
  { ...shot, angle: shot.angle + CHORD_SPREAD, side: true },
];

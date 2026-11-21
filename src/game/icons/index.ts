import type { FxPart, OscillatorPart } from '../weapons';

/**
 * The game's icons as SVG path data on a 24×24 grid, drawn once for both
 * screens: React renders them as `<svg>` in the HUD, the stage as Pixi
 * paths on the drops. Strokes are 2 units wide with round ends.
 */
export interface IconPath {
  d: string;
  /** Filled instead of stroked. */
  fill?: boolean;
}

export type Icon = Array<IconPath>;

export const ICON_SIZE = 24;

/** A wave sweeping through a filter: the wobble. */
const wobble: Icon = [
  { d: 'M2 12 C4 3 6 3 7 12 S10 21 12 12 S15 3 17 12 S20 21 22 12' },
];

/** A bolt: the laser's short, sharp shot. */
const laser: Icon = [
  { d: 'M14 2 L5 13.5 H11 L9.5 22 L19 9.5 H13 Z', fill: true },
];

/** An emitter and its ray: the beam. */
const beam: Icon = [
  { d: 'M2 8 H7 L9 12 L7 16 H2 Z', fill: true },
  { d: 'M11 12 H22' },
  { d: 'M11 8.5 L20 6' },
  { d: 'M11 15.5 L20 18' },
];

export const WEAPON_ICONS = { wobble, laser, beam } satisfies Record<
  OscillatorPart,
  Icon
>;

/** A starburst: Crush. */
const crush: Icon = [
  {
    d: 'M12 2 L14.2 8.6 L21 7 L16.4 12 L21 17 L14.2 15.4 L12 22 L9.8 15.4 L3 17 L7.6 12 L3 7 L9.8 8.6 Z',
    fill: true,
  },
];

/** Repeats fading out: Echo. */
const echo: Icon = [{ d: 'M4 6 L10 12 L4 18' }, { d: 'M12 6 L18 12 L12 18' }];

export const FX_ICONS = {
  distortion: crush,
  echo,
} satisfies Record<FxPart, Icon>;

/** A ring with a dot: a slow weapon's blast. */
export const BLAST_ICON: Icon = [
  { d: 'M12 4 A8 8 0 1 1 11.99 4 Z' },
  { d: 'M12 9 A3 3 0 1 1 11.99 9 Z', fill: true },
];

export const HEART_ICON: Icon = [
  {
    d: 'M12 21 C12 21 2.5 14.6 2.5 8.6 C2.5 5.4 4.9 3 7.9 3 C9.7 3 11.1 3.9 12 5.3 C12.9 3.9 14.3 3 16.1 3 C19.1 3 21.5 5.4 21.5 8.6 C21.5 14.6 12 21 12 21 Z',
    fill: true,
  },
];

/** Two bars: pause. */
export const PAUSE_ICON: Icon = [
  { d: 'M7 4 H10 V20 H7 Z', fill: true },
  { d: 'M14 4 H17 V20 H14 Z', fill: true },
];

/** A triangle: play a weapon's preview. */
export const PLAY_ICON: Icon = [{ d: 'M7 4.5 L19.5 12 L7 19.5 Z', fill: true }];

/** A square: stop the preview. */
export const STOP_ICON: Icon = [
  { d: 'M6.5 6.5 H17.5 V17.5 H6.5 Z', fill: true },
];

/** A bag with a handle: the loadout menu and the loot in it. */
export const BAG_ICON: Icon = [
  { d: 'M4 9 H20 L18.5 21 H5.5 Z' },
  { d: 'M9 9 V7 A3 3 0 0 1 15 7 V9' },
];

/** A chevron up: climbing the board. */
export const CLIMB_ICON: Icon = [{ d: 'M5 15 L12 8 L19 15' }];

/** A box with an arrow leaving it: share. */
export const SHARE_ICON: Icon = [
  { d: 'M12 3 V15' },
  { d: 'M7 8 L12 3 L17 8' },
  { d: 'M5 12 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V12' },
];

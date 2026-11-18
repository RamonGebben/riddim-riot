import type { Rng } from '../rng';

/** One level's six colours, as Pixi hex numbers. */
export interface Palette {
  name: string;
  /** Behind everything. */
  void: number;
  floor: number;
  grid: number;
  wall: number;
  player: number;
  /** Enemies, edges and beams. */
  accent: number;
}

/** Curated sets: each has a dark floor and two colours that pop off it. */
export const PALETTES: Array<Palette> = [
  {
    name: 'neon',
    void: 0x07060f,
    floor: 0x14122a,
    grid: 0x2a2552,
    wall: 0x261b4a,
    player: 0x35f0ff,
    accent: 0xff2fa8,
  },
  {
    name: 'acid',
    void: 0x040a05,
    floor: 0x0e1a10,
    grid: 0x1f3a22,
    wall: 0x1d3318,
    player: 0xc6ff3d,
    accent: 0xff5e1a,
  },
  {
    name: 'ice',
    void: 0x04080f,
    floor: 0x0c1626,
    grid: 0x1b2f4d,
    wall: 0x1a3152,
    player: 0xe8f6ff,
    accent: 0x3da5ff,
  },
  {
    name: 'ember',
    void: 0x0d0505,
    floor: 0x1c0c0c,
    grid: 0x3a1717,
    wall: 0x3d170f,
    player: 0xffd23d,
    accent: 0xff2f4f,
  },
];

export const pickPalette = (rng: Rng): Palette => rng.pick(PALETTES);

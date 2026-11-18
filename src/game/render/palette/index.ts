/**
 * The fixed PoC palette (5 colours); the level seed picks one later. Pixi
 * draws the game world, so these live here rather than in the UI theme.
 */
export const PALETTE = {
  void: 0x07060f,
  floor: 0x14122a,
  grid: 0x2a2552,
  player: 0x35f0ff,
  accent: 0xff2fa8,
} satisfies Record<string, number>;

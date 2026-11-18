/** Shots fan out in a fixed pattern, so spread reads as a shape, not noise. */
const PATTERN = [0, 1, -1, 0.5, -0.5];

/** Radians off the aim for shot `shot` of a weapon with `spread`. */
export const spreadAngle = (shot: number, spread: number): number =>
  PATTERN[shot % PATTERN.length] * spread;

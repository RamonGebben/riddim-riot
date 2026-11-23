/** A Pixi-style `0xrrggbb` colour as CSS: `#rrggbb`. */
export const cssColor = (color: number): string =>
  `#${color.toString(16).padStart(6, '0')}`;

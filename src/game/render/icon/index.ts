import { Graphics, GraphicsPath } from 'pixi.js';
import { ICON_SIZE, type Icon } from '../../icons';

/**
 * One of the game's icons as a Pixi graphic, `size` px across and centred
 * on its origin - the same drawing the HUD shows as SVG.
 */
export const drawIcon = (
  icon: Icon,
  { size, color }: { size: number; color: number },
): Graphics => {
  const graphic = new Graphics();
  icon.forEach(({ d, fill }) => {
    graphic.path(new GraphicsPath(d));
    if (fill) graphic.fill(color);
    else graphic.stroke({ width: 2, color, cap: 'round', join: 'round' });
  });
  graphic.pivot.set(ICON_SIZE / 2, ICON_SIZE / 2);
  graphic.scale.set(size / ICON_SIZE);
  return graphic;
};

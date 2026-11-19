import { Container, Graphics } from 'pixi.js';
import type { Palette } from '../../palette';
import type { Heart, Pickup } from '../../sim/loot';

export interface PickupsView {
  view: Container;
  update: (state: {
    pickups: Array<Pickup>;
    hearts: Array<Heart>;
    beat: number;
    now: number;
  }) => void;
}

const SIZE = 14;

const drawPickup = (palette: Palette) =>
  new Graphics()
    .circle(0, 0, SIZE * 2)
    .fill({ color: palette.player, alpha: 0.12 })
    .rect(-SIZE, -SIZE, SIZE * 2, SIZE * 2)
    .stroke({ width: 3, color: palette.player })
    .rect(-SIZE / 2, -SIZE / 2, SIZE, SIZE)
    .fill(palette.accent);

/** Two circles and a point, in the player's colour: health, not a weapon. */
const drawHeart = (palette: Palette) => {
  const r = SIZE * 0.55;
  return new Graphics()
    .circle(0, 0, SIZE * 1.7)
    .fill({ color: palette.player, alpha: 0.15 })
    .circle(-r, -r * 0.4, r)
    .circle(r, -r * 0.4, r)
    .poly([-r * 2, -r * 0.1, r * 2, -r * 0.1, 0, r * 2.2])
    .fill(palette.player);
};

/**
 * Weapons on the ground slowly turn and bob with the beat; hearts beat
 * with it.
 */
export const createPickupsView = (palette: Palette): PickupsView => {
  const view = new Container();
  const sprites = new Map<number, Graphics>();

  const spriteFor = (id: number, draw: (palette: Palette) => Graphics) => {
    const existing = sprites.get(id);
    if (existing) return existing;
    const sprite = draw(palette);
    sprites.set(id, sprite);
    view.addChild(sprite);
    return sprite;
  };

  return {
    view,
    update: ({ pickups, hearts, beat, now }) => {
      const present = new Set([...pickups, ...hearts].map(item => item.id));
      [...sprites.entries()]
        .filter(([id]) => !present.has(id))
        .forEach(([id, sprite]) => {
          sprite.destroy();
          sprites.delete(id);
        });
      hearts.forEach(({ id, position }) => {
        const sprite = spriteFor(id, drawHeart);
        sprite.position.set(position.x, position.y);
        sprite.scale.set(1 + beat * 0.3);
      });
      pickups.forEach(({ id, position }) => {
        const sprite = spriteFor(id, drawPickup);
        sprite.position.set(position.x, position.y);
        sprite.rotation = Math.PI / 4 + now * 0.8;
        sprite.scale.set(1 + beat * 0.2);
      });
    },
  };
};

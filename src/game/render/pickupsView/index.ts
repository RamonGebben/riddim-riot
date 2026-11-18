import { Container, Graphics } from 'pixi.js';
import type { Palette } from '../../palette';
import type { Pickup } from '../../sim/loot';

export interface PickupsView {
  view: Container;
  update: (state: {
    pickups: Array<Pickup>;
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

/** Weapons on the ground: slowly turning, bobbing with the beat. */
export const createPickupsView = (palette: Palette): PickupsView => {
  const view = new Container();
  const sprites = new Map<number, Graphics>();

  const spriteFor = (id: number) => {
    const existing = sprites.get(id);
    if (existing) return existing;
    const sprite = drawPickup(palette);
    sprites.set(id, sprite);
    view.addChild(sprite);
    return sprite;
  };

  return {
    view,
    update: ({ pickups, beat, now }) => {
      const present = new Set(pickups.map(pickup => pickup.id));
      [...sprites.entries()]
        .filter(([id]) => !present.has(id))
        .forEach(([id, sprite]) => {
          sprite.destroy();
          sprites.delete(id);
        });
      pickups.forEach(({ id, position }) => {
        const sprite = spriteFor(id);
        sprite.position.set(position.x, position.y);
        sprite.rotation = Math.PI / 4 + now * 0.8;
        sprite.scale.set(1 + beat * 0.2);
      });
    },
  };
};

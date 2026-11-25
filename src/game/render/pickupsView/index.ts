import { Container, Graphics, Text } from 'pixi.js';
import {
  BLAST_ICON,
  FX_ICONS,
  HEART_ICON,
  POWERUP_COLORS,
  POWERUP_ICONS,
  WEAPON_ICONS,
} from '../../icons';
import type { Key } from '../../music';
import type { Palette } from '../../palette';
import type { Heart, Pickup } from '../../sim/loot';
import {
  POWERUP_NAMES,
  type Powerup,
  type PowerupKind,
} from '../../sim/powerup';
import { length, subtract, type Vec } from '../../vec';
import { FX, OSCILLATORS, weaponFrom, type Weapon } from '../../weapons';
import { drawIcon } from '../icon';

export interface PickupsView {
  view: Container;
  update: (state: {
    pickups: Array<Pickup>;
    hearts: Array<Heart>;
    powerups: Array<Powerup>;
    player: { position: Vec };
    beat: number;
    now: number;
  }) => void;
}

const SIZE = 16;
/** Hearts read as health whatever the level's palette. */
const HEART_COLOR = 0xff4d6d;
/** A drop's label is clear this close, and gone past `LABEL_FAR`. */
const LABEL_NEAR = 260;
const LABEL_FAR = 480;
/** Weapons this close to the nearest one hide their labels behind it. */
const LABEL_CROWD = 140;

/** What the label says: the engine and its beat, then the maker and FX. */
const labelOf = ({ parts, projectile, tier }: Weapon) => {
  const engine = OSCILLATORS[parts.oscillator].label.toUpperCase();
  const blast = projectile.detonates ? ' · BLAST' : '';
  const fx = parts.fx ? ` · ${FX[parts.fx].label}` : '';
  const maker = parts.manufacturer === 'vandal' ? 'Vandal' : 'Lumen';
  return `T${tier.own} ${engine} ${parts.lfo}${blast}\n${maker}${fx}`;
};

interface WeaponSprite {
  root: Container;
  tile: Container;
  label: Container;
}

/**
 * A weapon on the ground: a tile with its engine's icon, its FX and blast
 * badges, and a label naming its engine, beat and FX - so a drop says what
 * it is before the player walks over.
 */
const drawWeapon = (weapon: Weapon, palette: Palette): WeaponSprite => {
  const root = new Container();
  const tile = new Container();
  tile.addChild(
    new Graphics()
      .circle(0, 0, SIZE * 2.2)
      .fill({ color: palette.player, alpha: 0.14 })
      .roundRect(-SIZE, -SIZE, SIZE * 2, SIZE * 2, 6)
      .fill(palette.void)
      .stroke({ width: 3, color: palette.player }),
    drawIcon(WEAPON_ICONS[weapon.parts.oscillator], {
      size: SIZE * 1.4,
      color: 0xffffff,
    }),
  );
  const badges = [
    weapon.parts.fx ? FX_ICONS[weapon.parts.fx] : null,
    weapon.projectile.detonates ? BLAST_ICON : null,
  ].filter(icon => icon !== null);
  badges.forEach((icon, i) => {
    const badge = new Container();
    badge.addChild(
      new Graphics().circle(0, 0, 9).fill(palette.accent),
      drawIcon(icon, { size: 12, color: 0xffffff }),
    );
    badge.position.set(SIZE, -SIZE + i * 20);
    tile.addChild(badge);
  });

  const text = new Text({
    text: labelOf(weapon),
    resolution: 2,
    style: {
      fontFamily: 'ui-monospace, Menlo, monospace',
      fontSize: 12,
      fontWeight: '700',
      fill: 0xffffff,
      align: 'center',
      lineHeight: 15,
    },
  });
  text.anchor.set(0.5, 0);
  const label = new Container();
  const pad = 6;
  label.addChild(
    new Graphics()
      .roundRect(
        -text.width / 2 - pad,
        -pad / 2,
        text.width + pad * 2,
        text.height + pad,
        5,
      )
      .fill({ color: palette.void, alpha: 0.85 })
      .stroke({ width: 1, color: palette.player, alpha: 0.6 }),
    text,
  );
  label.position.set(0, SIZE * 2.1);
  root.addChild(tile, label);
  return { root, tile, label };
};

const drawHeart = () => {
  const root = new Container();
  root.addChild(
    new Graphics().circle(0, 0, SIZE * 1.6).fill({
      color: HEART_COLOR,
      alpha: 0.18,
    }),
    drawIcon(HEART_ICON, { size: SIZE * 2.2, color: 0xffffff }),
    drawIcon(HEART_ICON, { size: SIZE * 1.8, color: HEART_COLOR }),
  );
  return root;
};

/** A powerup: a glowing coin in its colour, its name always under it. */
const drawPowerup = (kind: PowerupKind, palette: Palette) => {
  const root = new Container();
  const coin = new Container();
  const color = POWERUP_COLORS[kind];
  coin.addChild(
    new Graphics()
      .circle(0, 0, SIZE * 2)
      .fill({ color, alpha: 0.2 })
      .circle(0, 0, SIZE * 1.2)
      .fill(palette.void)
      .stroke({ width: 3, color }),
    drawIcon(POWERUP_ICONS[kind], { size: SIZE * 1.4, color }),
  );
  const text = new Text({
    text: POWERUP_NAMES[kind].toUpperCase(),
    resolution: 2,
    style: {
      fontFamily: 'ui-monospace, Menlo, monospace',
      fontSize: 11,
      fontWeight: '700',
      fill: color,
      letterSpacing: 1,
    },
  });
  text.anchor.set(0.5, 0);
  text.position.set(0, SIZE * 1.6);
  root.addChild(coin, text);
  return { root, coin };
};

/**
 * Weapons on the ground float and bob with the beat, their labels fading
 * in as the player nears; hearts beat with it.
 */
export const createPickupsView = (palette: Palette, key: Key): PickupsView => {
  const view = new Container();
  const weapons = new Map<number, WeaponSprite>();
  const hearts = new Map<number, Container>();
  const powerups = new Map<number, ReturnType<typeof drawPowerup>>();
  // Labels sit above every drop, so a cluster stays readable.
  const labels = new Container();
  const items = new Container();
  view.addChild(items, labels);

  const prune = <Sprite>(
    sprites: Map<number, Sprite>,
    present: Set<number>,
    destroy: (sprite: Sprite) => void,
  ) =>
    [...sprites.entries()]
      .filter(([id]) => !present.has(id))
      .forEach(([id, sprite]) => {
        destroy(sprite);
        sprites.delete(id);
      });

  const weaponFor = (pickup: Pickup) => {
    const existing = weapons.get(pickup.id);
    if (existing) return existing;
    const sprite = drawWeapon(
      weaponFrom(pickup.recipe, key, pickup.recipe.tier ?? 1),
      palette,
    );
    weapons.set(pickup.id, sprite);
    items.addChild(sprite.root);
    labels.addChild(sprite.label);
    return sprite;
  };

  const heartFor = (heart: Heart) => {
    const existing = hearts.get(heart.id);
    if (existing) return existing;
    const sprite = drawHeart();
    hearts.set(heart.id, sprite);
    items.addChild(sprite);
    return sprite;
  };

  const powerupFor = (powerup: Powerup) => {
    const existing = powerups.get(powerup.id);
    if (existing) return existing;
    const sprite = drawPowerup(powerup.kind, palette);
    powerups.set(powerup.id, sprite);
    items.addChild(sprite.root);
    return sprite;
  };

  return {
    view,
    update: ({
      pickups,
      hearts: lying,
      powerups: floor,
      player,
      beat,
      now,
    }) => {
      prune(powerups, new Set(floor.map(({ id }) => id)), sprite =>
        sprite.root.destroy({ children: true }),
      );
      floor.forEach(powerup => {
        const { root, coin } = powerupFor(powerup);
        root.position.set(powerup.position.x, powerup.position.y);
        coin.y = Math.sin(now * 4 + powerup.id) * 3;
        coin.scale.set(1 + beat * 0.25);
      });
      prune(weapons, new Set(pickups.map(({ id }) => id)), sprite => {
        sprite.label.destroy({ children: true });
        sprite.root.destroy({ children: true });
      });
      prune(hearts, new Set(lying.map(({ id }) => id)), sprite =>
        sprite.destroy({ children: true }),
      );
      lying.forEach(heart => {
        const sprite = heartFor(heart);
        sprite.position.set(heart.position.x, heart.position.y);
        sprite.scale.set(1 + beat * 0.3);
      });
      const away = (pickup: Pickup) =>
        length(subtract(pickup.position, player.position));
      // Up close, only the nearest weapon's label, so a pile stays legible.
      const nearest = pickups.reduce<Pickup | null>(
        (best, pickup) => (!best || away(pickup) < away(best) ? pickup : best),
        null,
      );
      pickups.forEach(pickup => {
        const { root, tile, label } = weaponFor(pickup);
        const { x, y } = pickup.position;
        root.position.set(x, y);
        tile.y = Math.sin(now * 3 + pickup.id) * 3;
        tile.scale.set(1 + beat * 0.15);
        const crowded =
          pickup !== nearest &&
          nearest !== null &&
          away(nearest) < LABEL_CROWD &&
          length(subtract(pickup.position, nearest.position)) < LABEL_CROWD;
        const fade = (LABEL_FAR - away(pickup)) / (LABEL_FAR - LABEL_NEAR);
        label.alpha = crowded ? 0 : Math.min(Math.max(fade, 0), 1);
        label.visible = label.alpha > 0;
        label.position.set(x, y + SIZE * 2.1);
      });
    },
  };
};

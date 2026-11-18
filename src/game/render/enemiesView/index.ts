import { Container, Graphics } from 'pixi.js';
import { TILE_SIZE } from '../../level';
import type { Palette } from '../../palette';
import {
  DASH_TILES,
  ENEMY_RADIUS,
  enemyPosition,
  hopProgress,
  type Enemy,
  type EnemyKind,
} from '../../sim/enemy';

export interface EnemiesView {
  view: Container;
  update: (enemies: Array<Enemy>, now: number) => void;
}

/** How long a fresh spawn takes to grow in. */
const SPAWN_SECONDS = 0.25;

interface Sprite {
  root: Container;
  body: Graphics;
  /** A charger's dash line while it's lined up. */
  tell: Graphics | null;
}

const drawHopper = (palette: Palette) => {
  const size = ENEMY_RADIUS * 1.25;
  return new Graphics()
    .rect(-size, -size, size * 2, size * 2)
    .fill(palette.accent)
    .rect(-size / 2.5, -size / 2.5, (size * 2) / 2.5, (size * 2) / 2.5)
    .fill(palette.void);
};

/** A wedge pointing along +x: rotated to face its dash. */
const drawCharger = (palette: Palette) => {
  const r = ENEMY_RADIUS * 1.4;
  return new Graphics()
    .poly([r, 0, -r * 0.7, r * 0.8, -r * 0.35, 0, -r * 0.7, -r * 0.8])
    .fill(palette.accent)
    .stroke({ width: 2, color: palette.player });
};

const drawTell = (palette: Palette) =>
  new Graphics()
    .moveTo(ENEMY_RADIUS, 0)
    .lineTo(DASH_TILES * TILE_SIZE, 0)
    .stroke({ width: 4, color: palette.accent, cap: 'round' });

const createSprite = (kind: EnemyKind, palette: Palette): Sprite => {
  const root = new Container();
  const body = kind === 'charger' ? drawCharger(palette) : drawHopper(palette);
  const tell = kind === 'charger' ? drawTell(palette) : null;
  if (tell) root.addChild(tell);
  root.addChild(body);
  if (kind === 'hopper') body.rotation = Math.PI / 4;
  return { root, body, tell };
};

/**
 * One sprite per enemy, kept by id so a hop only moves a transform. Hoppers
 * stretch mid-hop; chargers turn to their dash and flash a tell line from
 * the snare to the downbeat - all off the audio clock.
 */
export const createEnemiesView = (palette: Palette): EnemiesView => {
  const view = new Container();
  const sprites = new Map<number, Sprite>();

  const spriteFor = (enemy: Enemy) => {
    const existing = sprites.get(enemy.id);
    if (existing) return existing;
    const sprite = createSprite(enemy.kind, palette);
    sprites.set(enemy.id, sprite);
    view.addChild(sprite.root);
    return sprite;
  };

  return {
    view,
    update: (enemies, now) => {
      const alive = new Set(enemies.map(enemy => enemy.id));
      [...sprites.entries()]
        .filter(([id]) => !alive.has(id))
        .forEach(([id, sprite]) => {
          sprite.root.destroy({ children: true });
          sprites.delete(id);
        });

      enemies.forEach(enemy => {
        const { root, body, tell } = spriteFor(enemy);
        const grown = Math.min(
          Math.max((now - enemy.spawnAt) / SPAWN_SECONDS, 0),
          1,
        );
        const hop = hopProgress(enemy, now);
        // Tall mid-hop, back to square once it lands.
        const stretch = Math.sin(hop * Math.PI) * 0.25;
        const position = enemyPosition(enemy, now);
        root.position.set(position.x, position.y);
        root.visible = now >= enemy.spawnAt;
        body.scale.set(grown * (1 - stretch), grown * (1 + stretch));
        body.alpha = enemy.hp <= 1 ? 0.7 : 1;

        if (enemy.kind !== 'charger' || !tell) return;
        const heading = enemy.aim ?? {
          x: enemy.to.x - enemy.from.x,
          y: enemy.to.y - enemy.from.y,
        };
        if (heading.x !== 0 || heading.y !== 0) {
          const angle = Math.atan2(heading.y, heading.x);
          body.rotation = angle;
          tell.rotation = angle;
        }
        tell.visible = enemy.aim !== null;
        tell.alpha = 0.35 + 0.35 * Math.abs(Math.sin(now * 18));
      });
    },
  };
};

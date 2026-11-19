import { Container, Graphics } from 'pixi.js';
import { TILE_SIZE } from '../../level';
import type { Palette } from '../../palette';
import {
  BOSS_RADIUS,
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
  /** Where it's about to appear: pulses until it spawns. */
  marker: Graphics;
}

/** A marker closes in over this long before its enemy appears. */
const MARKER_SECONDS = 0.9;

const drawMarker = (palette: Palette) =>
  new Graphics()
    .circle(0, 0, ENEMY_RADIUS * 1.6)
    .stroke({ width: 3, color: palette.accent })
    .moveTo(-ENEMY_RADIUS * 0.6, -ENEMY_RADIUS * 0.6)
    .lineTo(ENEMY_RADIUS * 0.6, ENEMY_RADIUS * 0.6)
    .moveTo(ENEMY_RADIUS * 0.6, -ENEMY_RADIUS * 0.6)
    .lineTo(-ENEMY_RADIUS * 0.6, ENEMY_RADIUS * 0.6)
    .stroke({ width: 3, color: palette.accent, cap: 'round' });

const drawHopper = (palette: Palette) => {
  const size = ENEMY_RADIUS * 1.25;
  return new Graphics()
    .rect(-size, -size, size * 2, size * 2)
    .fill(palette.accent)
    .rect(-size / 2.5, -size / 2.5, (size * 2) / 2.5, (size * 2) / 2.5)
    .fill(palette.void);
};

/** A hopper grown huge, ringed, so it reads as the threat at a glance. */
const drawBoss = (palette: Palette) => {
  const size = BOSS_RADIUS * 1.15;
  return new Graphics()
    .rect(-size, -size, size * 2, size * 2)
    .fill(palette.accent)
    .stroke({ width: 5, color: palette.player })
    .rect(-size / 2.2, -size / 2.2, (size * 2) / 2.2, (size * 2) / 2.2)
    .fill(palette.void)
    .rect(-size / 5, -size / 5, (size * 2) / 5, (size * 2) / 5)
    .fill(palette.player);
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
  const body =
    kind === 'charger'
      ? drawCharger(palette)
      : kind === 'boss'
        ? drawBoss(palette)
        : drawHopper(palette);
  const tell = kind === 'charger' ? drawTell(palette) : null;
  const marker = drawMarker(palette);
  if (tell) root.addChild(tell);
  root.addChild(marker, body);
  if (kind !== 'charger') body.rotation = Math.PI / 4;
  return { root, body, tell, marker };
};

/**
 * One sprite per enemy, kept by id so a hop only moves a transform. Before
 * it spawns, a marker closes in on its spot, flashing. Hoppers stretch
 * mid-hop; chargers turn to their dash and flash a tell line from
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
        const { root, body, tell, marker } = spriteFor(enemy);
        const grown = Math.min(
          Math.max((now - enemy.spawnAt) / SPAWN_SECONDS, 0),
          1,
        );
        const hop = hopProgress(enemy, now);
        // Tall mid-hop, back to square once it lands.
        const stretch = Math.sin(hop * Math.PI) * 0.25;
        const position = enemyPosition(enemy, now);
        root.position.set(position.x, position.y);
        const until = enemy.spawnAt - now;
        marker.visible = until > 0;
        body.visible = until <= 0;
        if (tell) tell.visible = false;
        if (until > 0) {
          const closing = Math.min(until / MARKER_SECONDS, 1);
          const size = enemy.kind === 'boss' ? BOSS_RADIUS / ENEMY_RADIUS : 1;
          marker.scale.set(size * (1 + closing * 1.5));
          marker.alpha = 0.4 + 0.6 * Math.abs(Math.sin(now * 14));
          return;
        }
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

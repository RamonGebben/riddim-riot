import { Container, Graphics } from 'pixi.js';
import {
  ENEMY_RADIUS,
  enemyPosition,
  hopProgress,
  type Enemy,
} from '../../sim/enemy';
import type { Palette } from '../../palette';

export interface EnemiesView {
  view: Container;
  update: (enemies: Array<Enemy>, now: number) => void;
}

/** How long a fresh spawn takes to grow in. */
const SPAWN_SECONDS = 0.25;

const drawEnemy = (palette: Palette) => {
  const size = ENEMY_RADIUS * 1.25;
  return new Graphics()
    .rect(-size, -size, size * 2, size * 2)
    .fill(palette.accent)
    .rect(-size / 2.5, -size / 2.5, (size * 2) / 2.5, (size * 2) / 2.5)
    .fill(palette.void);
};

/**
 * One sprite per enemy, kept by id so a hop only moves a transform. Diamonds
 * stretch mid-hop and squash as they land - on the beat, off the audio clock.
 */
export const createEnemiesView = (palette: Palette): EnemiesView => {
  const view = new Container();
  const sprites = new Map<number, Graphics>();

  const spriteFor = (id: number) => {
    const existing = sprites.get(id);
    if (existing) return existing;
    const sprite = drawEnemy(palette);
    sprite.rotation = Math.PI / 4;
    sprites.set(id, sprite);
    view.addChild(sprite);
    return sprite;
  };

  return {
    view,
    update: (enemies, now) => {
      const alive = new Set(enemies.map(enemy => enemy.id));
      [...sprites.entries()]
        .filter(([id]) => !alive.has(id))
        .forEach(([id, sprite]) => {
          sprite.destroy();
          sprites.delete(id);
        });

      enemies.forEach(enemy => {
        const sprite = spriteFor(enemy.id);
        const grown = Math.min(
          Math.max((now - enemy.spawnAt) / SPAWN_SECONDS, 0),
          1,
        );
        const hop = hopProgress(enemy, now);
        // Tall mid-hop, back to square once it lands.
        const stretch = Math.sin(hop * Math.PI) * 0.25;
        const position = enemyPosition(enemy, now);
        sprite.position.set(position.x, position.y);
        sprite.visible = now >= enemy.spawnAt;
        sprite.scale.set(grown * (1 - stretch), grown * (1 + stretch));
        sprite.alpha = enemy.hp === 1 ? 0.7 : 1;
      });
    },
  };
};

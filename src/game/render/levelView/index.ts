import { Container, Graphics } from 'pixi.js';
import { isWall, TILE_SIZE, type Level } from '../../level';
import type { Palette } from '../../palette';

export interface LevelView {
  view: Container;
  /** The exit pad: dim while shut, breathing with the beat once open. */
  update: (state: { beat: number; exitOpen: boolean }) => void;
}

/**
 * The tilemap, drawn once: floor with a faint grid, walls with a bright edge
 * wherever they meet floor, and the exit pad.
 */
export const createLevelView = (level: Level, palette: Palette): LevelView => {
  const { map } = level;
  const cells = Array.from({ length: map.width * map.height }, (_, i) => ({
    x: i % map.width,
    y: Math.floor(i / map.width),
  }));
  const floors = cells.filter(cell => !isWall(map, cell));
  const walls = cells.filter(cell => isWall(map, cell));

  const ground = new Graphics();
  floors.forEach(({ x, y }) =>
    ground.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE),
  );
  ground.fill(palette.floor);
  floors.forEach(({ x, y }) =>
    ground.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE),
  );
  ground.stroke({ width: 1, color: palette.grid });

  walls.forEach(({ x, y }) =>
    ground.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE),
  );
  ground.fill(palette.wall);

  // An edge on each side of a wall that faces floor.
  const edges = [
    { dx: 0, dy: -1, from: [0, 0], to: [1, 0] },
    { dx: 0, dy: 1, from: [0, 1], to: [1, 1] },
    { dx: -1, dy: 0, from: [0, 0], to: [0, 1] },
    { dx: 1, dy: 0, from: [1, 0], to: [1, 1] },
  ];
  walls.forEach(({ x, y }) =>
    edges
      .filter(edge => !isWall(map, { x: x + edge.dx, y: y + edge.dy }))
      .forEach(edge =>
        ground
          .moveTo(
            (x + edge.from[0]) * TILE_SIZE,
            (y + edge.from[1]) * TILE_SIZE,
          )
          .lineTo((x + edge.to[0]) * TILE_SIZE, (y + edge.to[1]) * TILE_SIZE),
      ),
  );
  ground.stroke({ width: 3, color: palette.accent, alpha: 0.55 });

  const exit = new Graphics()
    .circle(0, 0, TILE_SIZE * 0.9)
    .stroke({ width: 4, color: palette.player, alpha: 0.8 })
    .circle(0, 0, TILE_SIZE * 0.45)
    .fill({ color: palette.player, alpha: 0.25 });
  exit.position.set(level.exit.x, level.exit.y);

  const view = new Container();
  view.addChild(ground, exit);

  return {
    view,
    update: ({ beat, exitOpen }) => {
      exit.scale.set(exitOpen ? 1 + beat * 0.15 : 0.8);
      exit.alpha = exitOpen ? 0.6 + beat * 0.4 : 0.2;
    },
  };
};

import { Container, Graphics } from 'pixi.js';
import { isWall, TILE_SIZE, type Level } from '../../level';
import type { Palette } from '../../palette';
import type { Vec } from '../../vec';
import type { Survival } from '../../sim/survival';
import { PAD_RADIUS } from '../../sim/world';

export interface LevelView {
  view: Container;
  /** The circle, through its states (see `drawCircle`). */
  update: (state: {
    survival: Survival;
    now: number;
    beat: number;
    barSeconds: number;
  }) => void;
}

const RING = PAD_RADIUS + 10;

/**
 * The tilemap, drawn once: floor with a faint grid, walls with a bright edge
 * wherever they meet floor, and the circle at the centre.
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

  const circle = new Graphics();

  const view = new Container();
  view.addChild(ground, circle);

  return {
    view,
    update: state => drawCircle(circle, palette, level.pad, state),
  };
};

/**
 * Waiting, it breathes on the beat and sends ripples out to draw the eye.
 * Stepped in, it lights up; from the next bar line its ring fills over a
 * bar into the slam. During the fight it's a dim mark on the floor, and
 * once the final wave falls it opens as the exit.
 */
const drawCircle = (
  circle: Graphics,
  palette: Palette,
  center: Vec,
  { survival, now, beat, barSeconds }: Parameters<LevelView['update']>[0],
) => {
  circle.clear();
  circle.position.set(center.x, center.y);
  const { phase, chargeAt } = survival;

  if (phase === 'song') {
    circle.circle(0, 0, RING).stroke({ width: 3, color: palette.grid });
    return;
  }

  if (phase === 'charging') {
    const fill =
      chargeAt === null
        ? 0
        : Math.min(Math.max((now - chargeAt) / barSeconds, 0), 1);
    const jitter = fill * 3;
    circle
      .circle(0, 0, RING * (0.3 + 0.7 * fill))
      .fill({ color: palette.player, alpha: 0.2 + 0.4 * fill })
      .circle(0, 0, RING)
      .stroke({ width: 4, color: palette.player, alpha: 0.5 });
    if (fill > 0) {
      circle
        .arc(0, 0, RING, -Math.PI / 2, -Math.PI / 2 + fill * Math.PI * 2)
        .stroke({ width: 10 + jitter, color: palette.accent, cap: 'round' });
    }
    circle.position.x += Math.sin(now * 90) * jitter * 0.3;
    return;
  }

  // Waiting or open: breathe, with a ripple going out each bar.
  const open = phase === 'clear';
  const ripple = (now / (barSeconds || 1)) % 1;
  circle
    .circle(0, 0, RING * (1 + ripple * 1.2))
    .stroke({ width: 3, color: palette.player, alpha: 0.6 * (1 - ripple) })
    .circle(0, 0, RING * (1 + beat * 0.12))
    .stroke({ width: 5, color: open ? palette.accent : palette.player })
    .circle(0, 0, RING * 0.5)
    .fill({ color: palette.player, alpha: 0.2 + beat * 0.3 });
};

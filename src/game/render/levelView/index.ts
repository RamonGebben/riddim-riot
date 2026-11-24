import { Container, Graphics, Text } from 'pixi.js';
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
/** The word round the circle sits just outside its ring. */
const LABEL_RADIUS = RING + 32;
/** Radians a second: slow enough to read as it turns. */
const LABEL_SPIN = 0.3;

/**
 * A word repeated round the circle, letters set on the arc with their tops
 * outward, so whichever side the player comes from it says what the
 * circle does.
 */
const createRingLabel = (word: string, repeats: number, color: number) => {
  const letters = Array.from({ length: repeats }, () => `${word} · `)
    .join('')
    .split('');
  const label = new Container();
  letters.forEach((letter, i) => {
    const angle = -Math.PI / 2 + (i / letters.length) * Math.PI * 2;
    const text = new Text({
      text: letter,
      resolution: 2,
      style: {
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 26,
        fontWeight: '800',
        fill: color,
      },
    });
    text.anchor.set(0.5);
    text.position.set(
      Math.cos(angle) * LABEL_RADIUS,
      Math.sin(angle) * LABEL_RADIUS,
    );
    text.rotation = angle + Math.PI / 2;
    label.addChild(text);
  });
  return label;
};

/**
 * The tilemap, drawn once: floor with a faint grid, walls with a bright edge
 * wherever they meet floor, and the circle at the centre, ringed by START
 * while it waits and EXIT once it opens.
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
  const start = createRingLabel('START', 3, palette.player);
  const exit = createRingLabel('EXIT', 4, palette.accent);
  [start, exit].forEach(label => label.position.set(level.pad.x, level.pad.y));

  const view = new Container();
  view.addChild(ground, circle, start, exit);

  return {
    view,
    update: state => {
      drawCircle(circle, palette, level.pad, state);
      const { phase } = state.survival;
      start.visible = phase === 'waiting';
      exit.visible = phase === 'clear';
      [start, exit].forEach(label => {
        label.rotation = state.now * LABEL_SPIN;
        label.alpha = 0.75 + state.beat * 0.25;
      });
    },
  };
};

/**
 * Waiting, it breathes on the beat and sends ripples out to draw the eye.
 * Stood in, it lights up and its ring fills, draining again if the player
 * steps out; full, it shakes into the slam. During the fight it's a dim
 * mark on the floor, and once the final wave falls it opens as the exit,
 * which fills the same way.
 */
const drawCircle = (
  circle: Graphics,
  palette: Palette,
  center: Vec,
  { survival, now, beat, barSeconds }: Parameters<LevelView['update']>[0],
) => {
  circle.clear();
  circle.position.set(center.x, center.y);
  const { phase, charge: fill } = survival;

  if (phase === 'song') {
    circle.circle(0, 0, RING).stroke({ width: 3, color: palette.grid });
    return;
  }

  const open = phase === 'clear';
  if (phase === 'charging' || fill > 0) {
    const jitter = fill * 3;
    circle
      .circle(0, 0, RING * (0.3 + 0.7 * fill))
      .fill({ color: palette.player, alpha: 0.2 + 0.4 * fill })
      .circle(0, 0, RING)
      .stroke({
        width: 4,
        color: open ? palette.accent : palette.player,
        alpha: 0.5,
      });
    if (fill > 0) {
      // Started on the ring: an arc goes on from the path's last point.
      circle
        .moveTo(0, -RING)
        .arc(0, 0, RING, -Math.PI / 2, -Math.PI / 2 + fill * Math.PI * 2)
        .stroke({ width: 10 + jitter, color: palette.accent, cap: 'round' });
    }
    circle.position.x += Math.sin(now * 90) * jitter * 0.3;
    return;
  }

  // Waiting or open: breathe, with a ripple going out each bar.
  const ripple = (now / (barSeconds || 1)) % 1;
  circle
    .circle(0, 0, RING * (1 + ripple * 1.2))
    .stroke({ width: 3, color: palette.player, alpha: 0.6 * (1 - ripple) })
    .circle(0, 0, RING * (1 + beat * 0.12))
    .stroke({ width: 5, color: open ? palette.accent : palette.player })
    .circle(0, 0, RING * 0.5)
    .fill({ color: palette.player, alpha: 0.2 + beat * 0.3 });
};

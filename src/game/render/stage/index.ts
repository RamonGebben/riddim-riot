import { Application, Container } from 'pixi.js';
import type { Level } from '../../level';
import { isExitOpen, type World } from '../../sim/world';
import { add, type Vec } from '../../vec';
import { worldOffset } from '../camera';
import { createEnemiesView } from '../enemiesView';
import { createFxView, type Burst } from '../fxView';
import { createLevelView } from '../levelView';
import { createPickupsView } from '../pickupsView';
import { createPlayerView } from '../playerView';
import { createRaveFilter } from '../raveFilter';

export interface Frame {
  world: World;
  bursts: Array<Burst>;
  /** The audio clock's time this frame shows. */
  now: number;
  camera: Vec;
  shake: Vec;
  /** 0-1 envelopes off the audio clock. */
  kick: number;
  beat: number;
  shot: number;
  hit: number;
  drop: number;
}

export interface Stage {
  /** Screen size in CSS pixels. */
  viewport: () => Vec;
  /** Run `update` every animation frame with the elapsed seconds. */
  onFrame: (update: (dt: number) => void) => void;
  render: (frame: Frame) => void;
  destroy: () => void;
}

export const createStage = async (
  element: HTMLElement,
  level: Level,
): Promise<Stage> => {
  const { palette } = level;
  const app = new Application();
  await app.init({
    resizeTo: element,
    background: palette.void,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio, 2),
    preference: 'webgl',
  });
  Object.assign(app.canvas.style, { position: 'absolute', inset: '0' });
  element.prepend(app.canvas);

  const layers = new Container();
  const levelView = createLevelView(level, palette);
  const player = createPlayerView(palette);
  const pickups = createPickupsView(palette);
  const enemies = createEnemiesView(palette);
  const fx = createFxView(palette);
  layers.addChild(
    levelView.view,
    pickups.view,
    enemies.view,
    player.view,
    fx.view,
  );
  app.stage.addChild(layers);

  const rave = createRaveFilter();
  app.stage.filters = [rave.filter];
  app.stage.filterArea = app.screen;

  const viewport = () => ({ x: app.screen.width, y: app.screen.height });

  return {
    viewport,
    onFrame: update => {
      app.ticker.add(ticker => update(ticker.deltaMS / 1000));
    },
    render: frame => {
      const offset = add(worldOffset(frame.camera, viewport()), frame.shake);
      layers.position.set(Math.round(offset.x), Math.round(offset.y));
      levelView.update({ ...frame, exitOpen: isExitOpen(frame.world) });
      pickups.update({ ...frame, pickups: frame.world.pickups });
      enemies.update(frame.world.enemies, frame.now);
      player.update({ ...frame, player: frame.world.player });
      fx.update({ ...frame, projectiles: frame.world.projectiles });
      rave.set(frame);
    },
    destroy: () => app.destroy(true, { children: true }),
  };
};

import { Application, Container } from 'pixi.js';
import type { Bounds } from '../../sim/arena';
import type { Player } from '../../sim/player';
import { add, type Vec } from '../../vec';
import { createArenaView } from '../arenaView';
import { worldOffset } from '../camera';
import { PALETTE } from '../palette';
import { createPlayerView } from '../playerView';
import { createRaveFilter } from '../raveFilter';

export interface Frame {
  player: Player;
  camera: Vec;
  shake: Vec;
  /** 0-1 envelopes off the audio clock. */
  kick: number;
  beat: number;
  shot: number;
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
  arena: Bounds,
): Promise<Stage> => {
  const app = new Application();
  await app.init({
    resizeTo: element,
    background: PALETTE.void,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio, 2),
    preference: 'webgl',
  });
  Object.assign(app.canvas.style, { position: 'absolute', inset: '0' });
  element.prepend(app.canvas);

  const world = new Container();
  const player = createPlayerView();
  world.addChild(createArenaView(arena), player.view);
  app.stage.addChild(world);

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
      world.position.set(Math.round(offset.x), Math.round(offset.y));
      player.update(frame);
      rave.set(frame);
    },
    destroy: () => app.destroy(true, { children: true }),
  };
};

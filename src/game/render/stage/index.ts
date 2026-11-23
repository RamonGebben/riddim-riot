import { Application, Container } from 'pixi.js';
import { flashingReduced } from '../../flashing';
import type { Level } from '../../level';
import type { World } from '../../sim/world';
import { add, scale, type Vec } from '../../vec';
import { viewOf, worldOffset } from '../camera';
import { calmFrame } from '../calm';
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
  /** For the circle's one-bar charge. */
  barSeconds: number;
}

export interface Stage {
  /** Screen size in CSS pixels. */
  /** The zoom, and the world-pixel size of what's on screen. */
  view: () => { zoom: number; size: Vec };
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
    // Capped at 2x: more is barely sharper on a phone, and costs frame
    // time that Tone's scheduling (and Firefox's audio) can't spare.
    resolution: Math.min(window.devicePixelRatio, 2),
    preference: 'webgl',
  });
  Object.assign(app.canvas.style, { position: 'absolute', inset: '0' });
  element.prepend(app.canvas);

  const layers = new Container();
  const levelView = createLevelView(level, palette);
  const player = createPlayerView(palette);
  const pickups = createPickupsView(palette, level.key);
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

  const view = () => viewOf({ x: app.screen.width, y: app.screen.height });
  // Pixi's resizeTo only listens to the window; a browser bar sliding away
  // or fullscreen kicking in can resize the element without telling it.
  const resizes = new ResizeObserver(() => app.resize());
  resizes.observe(element);

  return {
    view,
    onFrame: update => {
      app.ticker.add(ticker => update(ticker.deltaMS / 1000));
    },
    render: drawn => {
      const calm = flashingReduced();
      const frame = calm ? calmFrame(drawn) : drawn;
      const { zoom, size } = view();
      const offset = add(
        scale(worldOffset(frame.camera, size), zoom),
        frame.shake,
      );
      layers.scale.set(zoom);
      layers.position.set(Math.round(offset.x), Math.round(offset.y));
      levelView.update({ ...frame, survival: frame.world.survival });
      pickups.update({
        ...frame,
        pickups: frame.world.pickups,
        hearts: frame.world.hearts,
        powerups: frame.world.powerups,
        player: frame.world.player,
      });
      enemies.update(frame.world.enemies, frame.now, {
        fleeingUntil: frame.world.powered.pellet,
        beatSeconds: frame.barSeconds / 4,
      });
      player.update({
        ...frame,
        player: frame.world.player,
        invulnerableUntil: frame.world.invulnerableUntil,
        calm,
      });
      fx.update({
        ...frame,
        projectiles: frame.world.projectiles,
        beams: frame.world.beams,
        hostiles: frame.world.hostiles,
        player: frame.world.player,
      });
      rave.set(frame);
    },
    destroy: () => {
      resizes.disconnect();
      app.destroy(true, { children: true });
    },
  };
};

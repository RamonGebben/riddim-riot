import { flashingReduced } from '../flashing';
import { generateLevel } from '../level';
import { clampCamera, createStage, shakeOffset, type Stage } from '../render';
import { levelSeed, type RunState } from '../run';
import { createWorld, rulesFor } from '../sim/world';
import { ghostAt } from './ghost';

/** The beat the backdrop pulses to: the game's tempo, heard or not. */
const BEAT_SECONDS = 60 / 140;
/** How far the camera drifts round the circle, in world px: it stays in view. */
const DRIFT = { x: 70, y: 40 };
/**
 * The start page sets its text down the left on a wide landscape screen
 * (its SIDE_BY_SIDE layout); there the circle sits right of centre, by this
 * share of the view, so the text doesn't cover it.
 */
const ASIDE = 0.25;
const SIDE_BY_SIDE_MIN_WIDTH = 720;

/** 1 on the beat, falling away after it. */
const pulse = (t: number, decay: number, every = BEAT_SECONDS) =>
  Math.exp(-(t % every) / decay);

/**
 * The landing page's backdrop: the run's first level drawn live under the
 * rave shader, the camera drifting round its circle, pulsing to the tempo,
 * with a silent demo of shots landing on the kick (`ghostAt`).
 * It's decoration before any sound exists - no AudioContext, no clock - so
 * it times itself off the page's own time. Returns detach.
 */
export const attachBackdrop = (
  element: HTMLElement,
  run: RunState,
): (() => void) => {
  const level = generateLevel(levelSeed(run));
  const world = createWorld(level, rulesFor({ level: run.level }));
  let stage: Stage | null = null;
  let detached = false;
  const started = performance.now();

  void createStage(element, level).then(mounted => {
    if (detached) {
      mounted.destroy();
      return;
    }
    stage = mounted;
    mounted.onFrame(() => {
      const t = (performance.now() - started) / 1000;
      const { zoom, size } = mounted.view();
      const screenWidth = size.x * zoom;
      const aside =
        screenWidth >= SIDE_BY_SIDE_MIN_WIDTH && size.x > size.y
          ? size.x * ASIDE
          : 0;
      // Reduced, the camera holds still.
      const drift = flashingReduced() ? 0 : 1;
      const camera = clampCamera(
        {
          x: level.pad.x - aside + Math.cos(t * 0.11) * DRIFT.x * drift,
          y: level.pad.y + Math.sin(t * 0.17) * DRIFT.y * drift,
        },
        size,
        level,
      );
      // Halftime: the kick on beats 1 and 3, a flash every eight bars.
      const kick = pulse(t, 0.14, BEAT_SECONDS * 2);
      // A silent demo: shots off the circle landing on the kick.
      const ghost = ghostAt(t, level.pad);
      mounted.render({
        world: {
          ...world,
          player: { ...world.player, position: level.pad, aim: ghost.aim },
          enemies: ghost.enemies,
          projectiles: ghost.projectiles,
        },
        // Reduced, the kills stop bursting; the shots still land.
        bursts: flashingReduced() ? [] : ghost.bursts,
        now: t,
        camera,
        shake: shakeOffset(t, kick * 3),
        kick,
        beat: pulse(t, 0.1),
        shot: 0,
        hit: 0,
        drop: pulse(t, 0.6, BEAT_SECONDS * 32) * 0.6,
        barSeconds: BEAT_SECONDS * 4,
      });
    });
  });

  return () => {
    detached = true;
    stage?.destroy();
  };
};

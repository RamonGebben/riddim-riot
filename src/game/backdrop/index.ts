import { generateLevel } from '../level';
import { clampCamera, createStage, shakeOffset, type Stage } from '../render';
import { levelSeed, type RunState } from '../run';
import { createWorld, rulesFor } from '../sim/world';

/** The beat the backdrop pulses to: the game's tempo, heard or not. */
const BEAT_SECONDS = 60 / 140;
/** How far the camera drifts round the circle, in world px. */
const DRIFT = { x: 420, y: 260 };

/** 1 on the beat, falling away after it. */
const pulse = (t: number, decay: number, every = BEAT_SECONDS) =>
  Math.exp(-(t % every) / decay);

/**
 * The landing page's backdrop: the run's first level drawn live under the
 * rave shader, the camera drifting round its circle, pulsing to the tempo.
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
      const { size } = mounted.view();
      const camera = clampCamera(
        {
          x: level.pad.x + Math.cos(t * 0.11) * DRIFT.x,
          y: level.pad.y + Math.sin(t * 0.17) * DRIFT.y,
        },
        size,
        level,
      );
      // Halftime: the kick on beats 1 and 3, a flash every eight bars.
      const kick = pulse(t, 0.14, BEAT_SECONDS * 2);
      mounted.render({
        world: { ...world, player: { ...world.player, position: level.pad } },
        bursts: [],
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

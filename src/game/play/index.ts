import type { Bus } from '../bus';
import type { Tick } from '../clock';
import type { GameEvents } from '../events';
import { nextGridTime } from '../grid';
import { attachControls, attachTrigger, type TriggerHandlers } from '../input';
import {
  BURST_SECONDS,
  createStage,
  followCamera,
  screenToWorld,
  shakeOffset,
  type Burst,
  type Pulse,
} from '../render';
import { createRng, deriveSeed } from '../rng';
import { ARENA } from '../sim/arena';
import { createWorld, onBar, onBeat, queueShot, stepWorld } from '../sim/world';

export interface Pulses {
  kick: Pulse;
  beat: Pulse;
  shot: Pulse;
  kill: Pulse;
  hit: Pulse;
}

export interface PlaySounds {
  /** A kill's impact, at an audio time on the grid. */
  impact: (time: number) => void;
  /** The player got hit: duck the music right away. */
  duck: (time: number) => void;
}

const SHAKE_PIXELS = 7;
const KILL_SHAKE_PIXELS = 5;
/** A dropped frame or a background tab shouldn't teleport the player. */
const MAX_FRAME_SECONDS = 1 / 20;
/** Keeps enemy spawns their own random stream, apart from the drums'. */
const SPAWN_STREAM = 1;

/**
 * The frame loop: input → world sim → camera → render. Movement runs on
 * frames, but everything musical is read off the audio clock (`audioNow`):
 * enemies hop on beat ticks, waves spawn on bar ticks, and each kill's
 * impact is scheduled on the next 1/16 slot.
 */
export const startPlay = async ({
  element,
  seed,
  bus,
  trigger,
  pulses,
  sounds,
  stepSeconds,
  audioNow,
}: {
  element: HTMLElement;
  seed: number;
  bus: Bus<GameEvents>;
  trigger: TriggerHandlers;
  pulses: Pulses;
  sounds: PlaySounds;
  stepSeconds: number;
  audioNow: () => number;
}): Promise<() => void> => {
  const stage = await createStage(element, ARENA);
  const controls = attachControls(element);
  const detachTrigger = attachTrigger(element, trigger);

  let world = createWorld(ARENA);
  let camera = world.player.position;
  let bursts: Array<Burst> = [];
  let lastTick: Tick | null = null;

  const onTick = (tick: Tick) => {
    lastTick = tick;
    if (tick.sixteenth === 0) world = onBeat(world, tick.time);
    if (tick.stepInBar !== 0) return;
    const rng = createRng(deriveSeed(seed, tick.bar, SPAWN_STREAM));
    world = onBar(world, { bar: tick.bar, time: tick.time, rng });
  };

  const unsubscribe = [
    bus.on('tick', onTick),
    bus.on('shot', ({ time }) => {
      world = queueShot(world, time);
    }),
  ];

  const nextSlot = (now: number) =>
    lastTick
      ? nextGridTime({ now, anchor: lastTick.time, stepSeconds })
      : now + stepSeconds;

  stage.onFrame(elapsed => {
    const dt = Math.min(elapsed, MAX_FRAME_SECONDS);
    const now = audioNow();
    const aimAt = screenToWorld(controls.pointer(), camera, stage.viewport());
    const result = stepWorld(world, {
      input: { move: controls.move(), aimAt },
      dt,
      now,
    });
    world = result.world;
    camera = followCamera(camera, world.player.position, dt);

    const killed = result.kills.map(position => ({
      position,
      time: nextSlot(now),
    }));
    killed.forEach(({ time }) => {
      sounds.impact(time);
      pulses.kill.hit(time);
    });
    if (result.playerHit) {
      sounds.duck(now);
      pulses.hit.hit(now);
    }
    bursts = [...bursts, ...killed].filter(
      burst => now - burst.time < BURST_SECONDS,
    );

    const kick = pulses.kick.valueAt(now);
    const shake =
      kick * SHAKE_PIXELS + pulses.kill.valueAt(now) * KILL_SHAKE_PIXELS;
    stage.render({
      world,
      bursts,
      now,
      camera,
      shake: shakeOffset(now, shake),
      kick,
      beat: pulses.beat.valueAt(now),
      shot: pulses.shot.valueAt(now),
      hit: pulses.hit.valueAt(now),
    });
  });

  return () => {
    unsubscribe.forEach(off => off());
    detachTrigger();
    controls.detach();
    stage.destroy();
  };
};

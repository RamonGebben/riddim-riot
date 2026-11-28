import type { Bus } from '../../bus';
import type { Tick } from '../../clock';
import type { GameEvents } from '../../events';
import { nextGridTime, STEPS_PER_BAR } from '../../grid';
import {
  attachControls,
  attachTrigger,
  type Controls,
  type TriggerHandlers,
} from '../../input';
import type { Key } from '../../music';
import type { Pulses } from '../../play';
import {
  BURST_SECONDS,
  createStage,
  screenToWorld,
  shakeOffset,
  type Burst,
} from '../../render';
import { AIM_ASSIST } from '../../sim/aimAssist';
import {
  createWorld,
  queueShot,
  rulesFor,
  stepWorld,
  type World,
} from '../../sim/world';
import { scale } from '../../vec';
import { rangeLevel, restock } from '../range';

export interface RangeSounds {
  impact: (time: number) => void;
  score: (time: number, combo: number) => void;
  blast: (time: number) => void;
}

/** A dropped frame or a background tab shouldn't teleport the player. */
const MAX_FRAME_SECONDS = 1 / 20;
const SHAKE_PIXELS = 4;
const KILL_SHAKE_PIXELS = 5;
const STILL = { x: 0, y: 0 };

/**
 * The firing range on the game's own stage and world sim: the player moves
 * and aims as in a level and the weapon's shots fly from the bus. It takes
 * the keyboard only while the pointer is over it, so the knobs keep the
 * arrow keys and Space everywhere else on the page.
 */
export const startRange = async ({
  element,
  key,
  bus,
  trigger,
  pulses,
  sounds,
  stepSeconds,
  audioNow,
  heardNow,
}: {
  element: HTMLElement;
  key: Key;
  bus: Bus<GameEvents>;
  trigger: TriggerHandlers;
  pulses: Pulses;
  sounds: RangeSounds;
  stepSeconds: number;
  audioNow: () => number;
  heardNow: () => number;
}): Promise<{ detach: () => void }> => {
  const level = rangeLevel(key);
  const stage = await createStage(element, level);
  const detachTrigger = attachTrigger(element, trigger);
  let controls: Controls | null = null;
  const engage = () => {
    controls ??= attachControls(element);
  };
  const disengage = () => {
    controls?.detach();
    controls = null;
  };
  element.addEventListener('pointerenter', engage);
  element.addEventListener('pointerleave', disengage);

  const rules = rulesFor({ level: 1, god: true, skipCircle: true });
  let world: World = restock(createWorld(level, rules), 0);
  /** Where the camera looks: the room's middle, which fits the window. */
  const camera = { x: level.width / 2, y: level.height / 2 };
  let bursts: Array<Burst> = [];
  let lastTick: Tick | null = null;

  const unsubscribe = [
    bus.on('tick', tick => {
      lastTick = tick;
      // Fallen dummies stand back up on the next bar line.
      if (tick.stepInBar === 0) world = restock(world, tick.time);
    }),
    bus.on('shot', shot => {
      world = queueShot(world, shot);
    }),
  ];

  const nextSlot = (now: number) =>
    lastTick
      ? nextGridTime({ now, anchor: lastTick.time, stepSeconds })
      : now + stepSeconds;

  stage.onFrame(elapsed => {
    const dt = Math.min(elapsed, MAX_FRAME_SECONDS);
    const now = heardNow();
    const { zoom, size } = stage.view();
    const aimAt = controls
      ? screenToWorld(scale(controls.pointer(), 1 / zoom), camera, size)
      : // Aim stays where it was left while the pointer's on a knob.
        undefined;
    const before: World = world;
    const result = stepWorld(world, {
      input: {
        move: controls?.move() ?? STILL,
        aimAt: aimAt ?? aimFrom(before),
        dash: controls?.takeDash() ?? false,
        assist: AIM_ASSIST.mouse,
      },
      dt,
      now,
      beatSeconds: (stepSeconds * STEPS_PER_BAR) / 4,
    });
    world = result.world;

    const killed = result.kills.map(position => ({
      position,
      time: nextSlot(audioNow()),
    }));
    killed.forEach(({ time }) => {
      sounds.impact(time);
      pulses.kill.hit(time);
    });
    if (killed.length > 0) sounds.score(killed[0].time, world.combo.count);
    const blasts = result.blasts.map(({ position, splash }) => ({
      position,
      radius: splash.radius,
      time: nextSlot(audioNow()),
    }));
    blasts.forEach(({ time }) => {
      sounds.blast(time);
      pulses.kill.hit(time, 0.6);
    });
    if (world.dash.until !== before.dash.until) {
      bursts = [...bursts, { position: world.player.position, time: now }];
    }
    bursts = [...bursts, ...killed, ...blasts].filter(
      burst => now - burst.time < BURST_SECONDS,
    );

    const kick = pulses.kick.valueAt(now);
    stage.render({
      world,
      bursts,
      now,
      camera,
      shake: shakeOffset(
        now,
        kick * SHAKE_PIXELS + pulses.kill.valueAt(now) * KILL_SHAKE_PIXELS,
      ),
      kick,
      beat: pulses.beat.valueAt(now),
      shot: pulses.shot.valueAt(now),
      hit: pulses.hit.valueAt(now),
      drop: pulses.drop.valueAt(now),
      barSeconds: stepSeconds * STEPS_PER_BAR,
    });
  });

  return {
    detach: () => {
      unsubscribe.forEach(off => off());
      element.removeEventListener('pointerenter', engage);
      element.removeEventListener('pointerleave', disengage);
      disengage();
      detachTrigger();
      trigger.release();
      stage.destroy();
    },
  };
};

/** A point along the player's current aim, so it holds when let go of. */
const aimFrom = (world: World) => ({
  x: world.player.position.x + Math.cos(world.player.aim) * 100,
  y: world.player.position.y + Math.sin(world.player.aim) * 100,
});

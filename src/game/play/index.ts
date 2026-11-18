import { attachControls, attachTrigger } from '../input';
import {
  createStage,
  followCamera,
  screenToWorld,
  shakeOffset,
  type Pulse,
} from '../render';
import { ARENA } from '../sim/arena';
import { spawnPlayer, stepPlayer } from '../sim/player';
import type { WeaponSlot } from '../sim/weaponSlot';

export interface Pulses {
  kick: Pulse;
  beat: Pulse;
  shot: Pulse;
}

const SHAKE_PIXELS = 7;
/** A dropped frame or a background tab shouldn't teleport the player. */
const MAX_FRAME_SECONDS = 1 / 20;

/**
 * The frame loop: input → player sim → camera → render. Movement runs on
 * frames, but everything musical is read off the audio clock (`audioNow`),
 * so the visuals stay locked to the sound.
 */
export const startPlay = async ({
  element,
  slot,
  pulses,
  audioNow,
}: {
  element: HTMLElement;
  slot: WeaponSlot;
  pulses: Pulses;
  audioNow: () => number;
}): Promise<() => void> => {
  const stage = await createStage(element, ARENA);
  const controls = attachControls(element);
  const detachTrigger = attachTrigger(element, slot);

  let player = spawnPlayer(ARENA);
  let camera = player.position;

  stage.onFrame(elapsed => {
    const dt = Math.min(elapsed, MAX_FRAME_SECONDS);
    const aimAt = screenToWorld(controls.pointer(), camera, stage.viewport());
    player = stepPlayer(player, { move: controls.move(), aimAt }, dt, ARENA);
    camera = followCamera(camera, player.position, dt);

    const now = audioNow();
    const kick = pulses.kick.valueAt(now);
    stage.render({
      player,
      camera,
      shake: shakeOffset(now, kick * SHAKE_PIXELS),
      kick,
      beat: pulses.beat.valueAt(now),
      shot: pulses.shot.valueAt(now),
    });
  });

  return () => {
    detachTrigger();
    controls.detach();
    stage.destroy();
  };
};

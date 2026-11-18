import { immediate, now, start } from 'tone';
import {
  createDrums,
  createMusicBus,
  createReloadSound,
  createWobbleVoice,
} from './audio';
import { createBus } from './bus';
import { createClock, type ClockEvents } from './clock';
import { startPlay, type Pulses } from './play';
import { createPulse } from './render/pulse';
import { createWeaponSlot } from './sim';
import { WOBBLE_GUN } from './weapons';

/** Fixed for the PoC; the level seed picks it later. */
export const BPM = 140;
/** Fixed until the level seed picks key and scale. */
const ROOT_NOTE = 'F2';

export interface Game {
  /** Mount the stage and input on the play area; returns detach. */
  attach: (element: HTMLElement) => () => void;
  stop: () => void;
}

/**
 * Must be called from a user gesture (a click): it starts the AudioContext,
 * which browsers block until then.
 */
export const startGame = async ({ seed }: { seed: number }): Promise<Game> => {
  await start();

  const pulses: Pulses = {
    kick: createPulse({ decay: 0.14 }),
    beat: createPulse({ decay: 0.1 }),
    shot: createPulse({ decay: 0.08 }),
  };

  const bus = createBus<ClockEvents>();
  const musicBus = createMusicBus();
  const drums = await createDrums({
    seed,
    output: musicBus.input,
    onHit: hit => {
      if (hit.voice === 'kick') pulses.kick.hit(hit.time, hit.velocity);
    },
  });
  const wobble = createWobbleVoice({ output: musicBus.input, note: ROOT_NOTE });
  const reloadSound = createReloadSound(musicBus.input);
  const slot = createWeaponSlot({
    spec: WOBBLE_GUN,
    voice: {
      fire: (time, duration) => {
        wobble.fire(time, duration);
        pulses.shot.hit(time);
      },
    },
    reloadSound,
    bpm: BPM,
    now,
  });

  const unsubscribe = [
    bus.on('tick', drums.onTick),
    bus.on('tick', slot.onTick),
    bus.on('tick', tick => {
      if (tick.sixteenth === 0) pulses.beat.hit(tick.time);
    }),
  ];
  const clock = createClock({ bpm: BPM, bus });
  clock.start();

  return {
    attach: element => {
      // The stage mounts asynchronously; a detach before it's ready still
      // has to tear it down once it arrives.
      const play = startPlay({ element, slot, pulses, audioNow: immediate });
      return () => {
        play.then(detach => detach());
      };
    },
    stop: () => {
      unsubscribe.forEach(off => off());
      clock.dispose();
      [drums, wobble, reloadSound, musicBus].forEach(node => node.dispose());
    },
  };
};

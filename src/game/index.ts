import { now, start } from 'tone';
import {
  createDrums,
  createMusicBus,
  createReloadSound,
  createWobbleVoice,
} from './audio';
import { createBus } from './bus';
import { createClock, type ClockEvents } from './clock';
import { attachTrigger } from './input';
import { createWeaponSlot } from './sim';
import { WOBBLE_GUN } from './weapons';

/** Fixed for the PoC; the level seed picks it later. */
export const BPM = 140;
/** Fixed until the level seed picks key and scale. */
const ROOT_NOTE = 'F2';

export interface Game {
  /** Wire the trigger to the element the player clicks on; returns detach. */
  attach: (element: HTMLElement) => () => void;
  stop: () => void;
}

/**
 * Must be called from a user gesture (a click): it starts the AudioContext,
 * which browsers block until then.
 */
export const startGame = async ({ seed }: { seed: number }): Promise<Game> => {
  await start();

  const bus = createBus<ClockEvents>();
  const musicBus = createMusicBus();
  const drums = await createDrums({ seed, output: musicBus.input });
  const wobble = createWobbleVoice({ output: musicBus.input, note: ROOT_NOTE });
  const reloadSound = createReloadSound(musicBus.input);
  const slot = createWeaponSlot({
    spec: WOBBLE_GUN,
    voice: wobble,
    reloadSound,
    bpm: BPM,
    now,
  });

  const unsubscribe = [
    bus.on('tick', drums.onTick),
    bus.on('tick', slot.onTick),
  ];
  const clock = createClock({ bpm: BPM, bus });
  clock.start();

  return {
    attach: element => attachTrigger(element, slot),
    stop: () => {
      unsubscribe.forEach(off => off());
      clock.dispose();
      [drums, wobble, reloadSound, musicBus].forEach(node => node.dispose());
    },
  };
};

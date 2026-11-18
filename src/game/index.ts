import { start } from 'tone';
import { createDrums, createMusicBus } from './audio';
import { createBus } from './bus';
import { createClock, type ClockEvents } from './clock';

/** Fixed for the PoC; the level seed picks it later. */
export const BPM = 140;

export interface Game {
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
  const offDrums = bus.on('tick', drums.onTick);
  const clock = createClock({ bpm: BPM, bus });
  clock.start();

  return {
    stop: () => {
      offDrums();
      clock.dispose();
      drums.dispose();
      musicBus.dispose();
    },
  };
};

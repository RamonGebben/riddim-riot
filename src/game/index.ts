import { immediate, now, start } from 'tone';
import {
  createDrums,
  createImpactSound,
  createMusicBus,
  createReloadSound,
  createWobbleVoice,
} from './audio';
import { createBus } from './bus';
import { createClock } from './clock';
import type { GameEvents } from './events';
import { secondsPerStep } from './grid';
import { startPlay, type Pulses } from './play';
import { createPulse } from './render/pulse';
import { createWeaponSlot } from './sim';
import { WOBBLE_GUN } from './weapons';

/** Fixed for the PoC; the level seed picks it later. */
export const BPM = 140;
/** Fixed until the level seed picks key and scale. */
const ROOT_NOTE = 'F2';
const IMPACT_ROOT = 'F1';
const DUCK_SECONDS = 0.6;

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
    kill: createPulse({ decay: 0.12 }),
    hit: createPulse({ decay: 0.18 }),
  };

  const bus = createBus<GameEvents>();
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
  const impact = createImpactSound({
    output: musicBus.input,
    root: IMPACT_ROOT,
  });
  const slot = createWeaponSlot({
    spec: WOBBLE_GUN,
    voice: {
      fire: (time, duration) => {
        wobble.fire(time, duration);
        pulses.shot.hit(time);
        bus.emit('shot', { time });
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
  const clock = createClock({
    bpm: BPM,
    onTick: tick => bus.emit('tick', tick),
  });
  clock.start();

  return {
    attach: element => {
      // The stage mounts asynchronously; a detach before it's ready still
      // has to tear it down once it arrives.
      const play = startPlay({
        element,
        seed,
        bus,
        trigger: slot,
        pulses,
        sounds: {
          impact: impact.play,
          duck: time => musicBus.duck(time, DUCK_SECONDS),
        },
        stepSeconds: secondsPerStep(BPM),
        audioNow: immediate,
      });
      return () => {
        play.then(detach => detach());
      };
    },
    stop: () => {
      unsubscribe.forEach(off => off());
      clock.dispose();
      [drums, wobble, reloadSound, impact, musicBus].forEach(node =>
        node.dispose(),
      );
    },
  };
};

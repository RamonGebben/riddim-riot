import { immediate, now, start } from 'tone';
import {
  createDrums,
  createImpactSound,
  createMusicBus,
  measureWeaponLoudness,
  createReloadSound,
  createWeaponVoice,
} from './audio';
import { createBus } from './bus';
import { createClock } from './clock';
import type { GameEvents } from './events';
import { secondsPerStep, STEPS_PER_BEAT } from './grid';
import { createLoadout, type Armed, type LoadoutView } from './loadout';
import { F_MINOR } from './music';
import { startPlay, type Pulses } from './play';
import { createPulse } from './render/pulse';
import { deriveSeed } from './rng';
import { createWeaponSlot } from './sim';
import { rollWeapon, spreadAngle, type Weapon } from './weapons';

export type { LoadoutView } from './loadout';

/** Fixed for the PoC; the level seed picks it later. */
export const BPM = 140;
/** Fixed until the level seed picks key and scale. */
const KEY = F_MINOR;
const IMPACT_ROOT = 'F1';
const DUCK_SECONDS = 0.6;
const SLOTS = 3;
/** Keeps weapon rolls their own random stream, apart from drums and spawns. */
const WEAPON_STREAM = 2;
/** A run opens with one of each engine; slot 3 and every reroll are free. */
const STARTING_ENGINES = ['wobble', 'laser'] as const;

export interface Game {
  /** Mount the stage and input on the play area; returns detach. */
  attach: (element: HTMLElement) => () => void;
  loadout: () => LoadoutView;
  /** Called on every weapon switch or reroll; returns unsubscribe. */
  onLoadout: (listener: (view: LoadoutView) => void) => () => void;
  stop: () => void;
}

/**
 * Must be called from a user gesture (a click): it starts the AudioContext,
 * which browsers block until then.
 */
export const startGame = async ({ seed }: { seed: number }): Promise<Game> => {
  await start();

  const stepSeconds = secondsPerStep(BPM);
  const beatSeconds = stepSeconds * STEPS_PER_BEAT;
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
  const reloadSound = createReloadSound(musicBus.input);
  const impact = createImpactSound({
    output: musicBus.input,
    root: IMPACT_ROOT,
  });

  const arm = async (weapon: Weapon): Promise<Armed> => {
    const volume = await measureWeaponLoudness(weapon, { bpm: BPM });
    const voice = createWeaponVoice({
      output: musicBus.input,
      sound: weapon.sound,
      beatSeconds,
      volume,
    });
    const { projectile, echo } = weapon;
    const slot = createWeaponSlot({
      spec: weapon.timing,
      voice: {
        fire: (time, duration, shot) => {
          voice.fire(time, duration, shot);
          pulses.shot.hit(time);
          const angle = spreadAngle(shot, projectile.spread);
          bus.emit('shot', { time, spec: projectile, angle });
          if (!echo) return;
          bus.emit('shot', {
            time: time + echo.delayBeats * beatSeconds,
            spec: { ...projectile, damage: echo.damage },
            angle: -angle,
          });
        },
      },
      reloadSound,
      bpm: BPM,
      now,
    });
    return { weapon, slot, voice };
  };

  const listeners = new Set<(view: LoadoutView) => void>();
  const loadout = await createLoadout({
    size: SLOTS,
    roll: (slot, generation) =>
      rollWeapon(deriveSeed(seed, WEAPON_STREAM, slot, generation), KEY, {
        oscillator: generation === 0 ? STARTING_ENGINES[slot] : undefined,
      }),
    arm,
    now: immediate,
    onChange: view => listeners.forEach(listener => listener(view)),
  });

  const unsubscribe = [
    bus.on('tick', drums.onTick),
    bus.on('tick', loadout.onTick),
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
        trigger: loadout,
        onWeaponAction: loadout.act,
        pulses,
        sounds: {
          impact: impact.play,
          duck: time => musicBus.duck(time, DUCK_SECONDS),
        },
        stepSeconds,
        audioNow: immediate,
      });
      return () => {
        play.then(detach => detach());
      };
    },
    loadout: loadout.view,
    onLoadout: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    stop: () => {
      unsubscribe.forEach(off => off());
      clock.dispose();
      [drums, loadout, reloadSound, impact, musicBus].forEach(node =>
        node.dispose(),
      );
    },
  };
};

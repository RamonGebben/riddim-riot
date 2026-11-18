import type { Tick } from '../../clock';
import { secondsPerStep, STEPS_PER_BAR, STEPS_PER_BEAT } from '../../grid';
import type { WeaponSpec } from '../../weapons';
import {
  advance,
  holster,
  initialTrigger,
  press,
  release,
  type TriggerEvent,
  type TriggerState,
} from '../trigger';

/**
 * A shot's timing bonus: `beat` for a press within the beat window, `swap`
 * for the first shot after a switch that lands on a downbeat.
 */
export type ShotAccent = 'beat' | 'swap' | null;

/** Anything that can sound a shot - a synth voice, or a fake in tests. */
export interface WeaponVoice {
  /** `shot` counts from 0 within the magazine - it picks the riff note. */
  fire: (
    time: number,
    duration: number,
    shot: number,
    accent: ShotAccent,
  ) => void;
}

export interface ReloadSound {
  click: (time: number) => void;
  rumble: (time: number, duration: number) => void;
}

export interface WeaponSlot {
  onTick: (tick: Tick) => void;
  /** `onBeat`: the press landed close to the weapon's grid. */
  press: (options?: { onBeat?: boolean }) => void;
  release: () => void;
  /** Put away: refills in the background, silently, and ignores presses. */
  holster: () => void;
  equip: () => void;
  getState: () => TriggerState;
}

/**
 * How far ahead of the audio clock the last tick must still be for a press to
 * land on it. Under this, the shot can't be scheduled reliably in time.
 */
const CATCH_UP_SECONDS = 0.01;

/**
 * One weapon on the clock. Ticks arrive ahead of the audio (the Transport's
 * lookahead), so a press can still land on the last tick when its sound
 * hasn't played yet - that keeps the gun feeling instant.
 */
export const createWeaponSlot = ({
  spec,
  voice,
  reloadSound,
  bpm,
  now,
}: {
  spec: WeaponSpec;
  voice: WeaponVoice;
  reloadSound: ReloadSound;
  bpm: number;
  /** The audio clock's current time. */
  now: () => number;
}): WeaponSlot => {
  const stepSeconds = secondsPerStep(bpm);
  const gateSeconds = spec.gateBeats * STEPS_PER_BEAT * stepSeconds;
  let state = initialTrigger(spec);
  let lastTick: Tick | null = null;
  let holstered = false;
  /** Just switched to: the next shot can earn the swap bonus. */
  let fresh = false;

  const accentOf = (event: { step: number; accent: boolean }): ShotAccent => {
    const swapped = fresh && event.step % STEPS_PER_BAR === 0;
    fresh = false;
    if (swapped) return 'swap';
    return event.accent ? 'beat' : null;
  };

  const play = (event: TriggerEvent, time: number) => {
    if (event.type === 'fire') {
      voice.fire(time, gateSeconds, event.shot, accentOf(event));
    }
    if (holstered) return;
    if (event.type === 'reloadClick') reloadSound.click(time);
    if (event.type === 'reloadRumble') {
      reloadSound.rumble(time, event.steps * stepSeconds);
    }
  };

  const run = (tick: Tick) => {
    const result = advance(state, spec, tick.step);
    state = result.state;
    result.events.forEach(event => play(event, tick.time));
  };

  return {
    onTick: tick => {
      lastTick = tick;
      run(tick);
    },
    press: options => {
      if (holstered) return;
      state = press(state, options);
      if (!lastTick || state.reload) return;
      if (lastTick.time - now() > CATCH_UP_SECONDS) run(lastTick);
    },
    release: () => {
      state = release(state);
    },
    holster: () => {
      holstered = true;
      state = holster(state, spec, (lastTick?.step ?? -1) + 1);
    },
    equip: () => {
      holstered = false;
      fresh = true;
    },
    getState: () => state,
  };
};

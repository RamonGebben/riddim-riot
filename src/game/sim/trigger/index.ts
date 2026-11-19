import { beatsToSteps, isOnGrid, nextSlot } from '../../grid';
import type { WeaponSpec } from '../../weapons';

/** The reload fill, with its sounds placed on the grid up front. */
export interface Reload {
  start: number;
  end: number;
  /** The first offbeat 1/8 of the fill. */
  click: number;
  /** The beat after the click, rising into the return. */
  rumble: number;
}

export interface TriggerState {
  held: boolean;
  /** A press waiting for the next slot - fires even if released before it. */
  queued: boolean;
  /** The queued press was on the beat: its shot gets the timing bonus. */
  accented: boolean;
  ammo: number;
  /** The first step the next shot may land on. */
  readyAt: number;
  reload: Reload | null;
  /** Steps since the last shot or charge regained (see `coolSteps`). */
  idleSteps: number;
}

export type TriggerEvent =
  /**
   * `shot` counts from 0 within the magazine; `accent` marks the shot of a
   * press that landed on the beat.
   */
  | { type: 'fire'; step: number; shot: number; accent: boolean }
  | { type: 'reloadClick'; step: number }
  | { type: 'reloadRumble'; step: number; steps: number }
  | { type: 'reloaded'; step: number };

export interface TriggerResult {
  state: TriggerState;
  events: Array<TriggerEvent>;
}

export const initialTrigger = (spec: WeaponSpec): TriggerState => ({
  held: false,
  queued: false,
  accented: false,
  ammo: spec.magazine,
  readyAt: 0,
  reload: null,
  idleSteps: 0,
});

/**
 * Presses during a reload don't queue - holding through it still fires
 * after. `onBeat`: the press landed close to the weapon's grid.
 */
export const press = (
  state: TriggerState,
  { onBeat = false }: { onBeat?: boolean } = {},
): TriggerState => ({
  ...state,
  held: true,
  queued: state.reload === null,
  accented: state.reload === null && onBeat,
});

export const release = (state: TriggerState): TriggerState => ({
  ...state,
  held: false,
});

const planReload = (start: number, spec: WeaponSpec): Reload => {
  const end = start + beatsToSteps(spec.reloadBeats);
  const click = nextSlot(start - 2, '1/4') + 2;
  return { start, end, click, rumble: nextSlot(click + 1, '1/4') };
};

/**
 * Put the weapon away: let go, and start refilling a partly used magazine
 * from `step`. It only comes back full once the reload beats have passed, so
 * swapping back and forth gives no free ammo.
 */
export const holster = (
  state: TriggerState,
  spec: WeaponSpec,
  step: number,
): TriggerState => {
  const released = { ...state, held: false, queued: false, accented: false };
  if (state.reload || state.ammo === spec.magazine) return released;
  return { ...released, reload: planReload(step, spec) };
};

const fillEvents = (reload: Reload, step: number): Array<TriggerEvent> => {
  if (step === reload.click) return [{ type: 'reloadClick', step }];
  if (step === reload.rumble && step < reload.end) {
    return [{ type: 'reloadRumble', step, steps: reload.end - step }];
  }
  return [];
};

const fire = (
  state: TriggerState,
  spec: WeaponSpec,
  step: number,
): TriggerResult => {
  const ammo = state.ammo - 1;
  const reload =
    ammo > 0 ? null : planReload(nextSlot(step + 1, spec.division), spec);
  return {
    state: {
      ...state,
      queued: false,
      accented: false,
      ammo,
      readyAt: step + beatsToSteps(spec.cooldownBeats),
      reload,
      idleSteps: 0,
    },
    events: [
      {
        type: 'fire',
        step,
        shot: spec.magazine - state.ammo,
        accent: state.queued && state.accented,
      },
    ],
  };
};

const tryFire = (
  state: TriggerState,
  spec: WeaponSpec,
  step: number,
): TriggerResult => {
  const wantsToFire = state.held || state.queued;
  if (!wantsToFire || state.reload || state.ammo <= 0) {
    return { state, events: [] };
  }
  if (!isOnGrid(step, spec.division) || step < state.readyAt) {
    return { state, events: [] };
  }
  return fire(state, spec, step);
};

/** A continuous weapon not firing regains a charge every `coolSteps`. */
const cool = (state: TriggerState, spec: WeaponSpec): TriggerState => {
  if (!spec.coolSteps || state.ammo >= spec.magazine) return state;
  const idleSteps = state.idleSteps + 1;
  if (idleSteps < spec.coolSteps) return { ...state, idleSteps };
  return { ...state, idleSteps: 0, ammo: state.ammo + 1 };
};

/**
 * Advance the trigger by one 1/16 step. Pure: the caller plays the events at
 * the step's scheduled time.
 */
export const advance = (
  state: TriggerState,
  spec: WeaponSpec,
  step: number,
): TriggerResult => {
  if (!state.reload) {
    const result = tryFire(state, spec, step);
    if (result.events.length > 0) return result;
    return { state: cool(result.state, spec), events: [] };
  }
  if (step < state.reload.end) {
    return { state, events: fillEvents(state.reload, step) };
  }

  // Back in on the beat the fill lands on - a held trigger fires right there.
  const reloaded = { ...state, ammo: spec.magazine, reload: null };
  const result = tryFire(reloaded, spec, step);
  return {
    state: result.state,
    events: [{ type: 'reloaded', step }, ...result.events],
  };
};

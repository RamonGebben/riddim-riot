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
  ammo: number;
  /** The first step the next shot may land on. */
  readyAt: number;
  reload: Reload | null;
}

export type TriggerEvent =
  | { type: 'fire'; step: number }
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
  ammo: spec.magazine,
  readyAt: 0,
  reload: null,
});

/** Presses during a reload don't queue - holding through it still fires after. */
export const press = (state: TriggerState): TriggerState => ({
  ...state,
  held: true,
  queued: state.reload === null,
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
      ammo,
      readyAt: step + beatsToSteps(spec.cooldownBeats),
      reload,
    },
    events: [{ type: 'fire', step }],
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

/**
 * Advance the trigger by one 1/16 step. Pure: the caller plays the events at
 * the step's scheduled time.
 */
export const advance = (
  state: TriggerState,
  spec: WeaponSpec,
  step: number,
): TriggerResult => {
  if (!state.reload) return tryFire(state, spec, step);
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

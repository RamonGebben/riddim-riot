import { describe, expect, it } from 'vitest';
import type { WeaponSpec } from '../../weapons';
import {
  advance,
  holster,
  initialTrigger,
  press,
  release,
  type TriggerEvent,
  type TriggerState,
} from '.';

/** The hand-tuned gun from milestone 2: 8 shots of 1/8, then a 2-beat fill. */
const WOBBLE_GUN: WeaponSpec = {
  division: '1/8',
  cooldownBeats: 0.5,
  gateBeats: 0.5,
  magazine: 8,
  reloadBeats: 2,
};

/** Run the trigger over a range of steps, collecting every event. */
const run = (state: TriggerState, from: number, to: number) =>
  Array.from({ length: to - from }, (_, i) => from + i).reduce<{
    state: TriggerState;
    events: Array<TriggerEvent>;
  }>(
    (acc, step) => {
      const result = advance(acc.state, WOBBLE_GUN, step);
      return { state: result.state, events: [...acc.events, ...result.events] };
    },
    { state, events: [] },
  );

const fireSteps = (events: Array<TriggerEvent>) =>
  events.flatMap(event => (event.type === 'fire' ? [event.step] : []));

const idle = initialTrigger(WOBBLE_GUN);

describe('advance', () => {
  it('stays silent without a press', () => {
    expect(run(idle, 0, 32).events).toEqual([]);
  });

  it('plays a tap on the next 1/8 slot, once', () => {
    const tapped = release(press(idle));
    const { events } = run(tapped, 5, 16);
    expect(fireSteps(events)).toEqual([6]);
  });

  it('fires every 1/8 while held', () => {
    const { events } = run(press(idle), 0, 8);
    expect(fireSteps(events)).toEqual([0, 2, 4, 6]);
  });

  it('stops firing on release', () => {
    const held = run(press(idle), 0, 4);
    const { events } = run(release(held.state), 4, 12);
    expect(fireSteps(events)).toEqual([]);
  });

  it('empties the magazine in one bar, then plays the fill', () => {
    const { events } = run(press(idle), 0, 24);
    expect(fireSteps(events)).toEqual([0, 2, 4, 6, 8, 10, 12, 14]);
    expect(events.filter(event => event.type !== 'fire')).toEqual([
      { type: 'reloadClick', step: 18 },
      { type: 'reloadRumble', step: 20, steps: 4 },
    ]);
  });

  it('comes back in on the beat the fill lands on when held', () => {
    const { events, state } = run(press(idle), 0, 26);
    expect(events).toContainEqual({ type: 'reloaded', step: 24 });
    expect(fireSteps(events).slice(8)).toEqual([24]);
    expect(state.ammo).toBe(WOBBLE_GUN.magazine - 1);
  });

  it('ignores taps during the reload', () => {
    const emptied = run(release(run(press(idle), 0, 15).state), 15, 17);
    expect(emptied.state.reload).not.toBeNull();
    const tappedDuringFill = release(press(emptied.state));
    const { events } = run(tappedDuringFill, 17, 32);
    expect(fireSteps(events)).toEqual([]);
    expect(events).toContainEqual({ type: 'reloaded', step: 24 });
  });

  it('places the fill click on an offbeat even after an off-bar reload', () => {
    const tapped = release(press({ ...idle, ammo: 1 }));
    const { events } = run(tapped, 3, 20);
    expect(fireSteps(events)).toEqual([4]);
    expect(events).toContainEqual({ type: 'reloadClick', step: 6 });
    expect(events).toContainEqual({ type: 'reloadRumble', step: 8, steps: 6 });
  });
});

describe('accents', () => {
  it('mark the shot of an on-beat press, not the held ones after it', () => {
    const { events } = run(press(idle, { onBeat: true }), 0, 6);
    expect(
      events.flatMap(event => (event.type === 'fire' ? [event.accent] : [])),
    ).toEqual([true, false, false]);
  });

  it('leave an off-beat press plain', () => {
    const { events } = run(release(press(idle)), 0, 2);
    expect(events).toContainEqual(expect.objectContaining({ accent: false }));
  });
});

describe('fire events', () => {
  it('count shots within the magazine', () => {
    const { events } = run(press(idle), 0, 6);
    expect(
      events.flatMap(event => (event.type === 'fire' ? [event.shot] : [])),
    ).toEqual([0, 1, 2]);
  });
});

describe('holster', () => {
  it('lets go and refills a used magazine over the reload beats', () => {
    const used = run(press(idle), 0, 4).state;
    const away = holster(used, WOBBLE_GUN, 5);
    expect(away.held).toBe(false);
    expect(away.reload).toMatchObject({ start: 5, end: 13 });
    const { state, events } = run(away, 5, 14);
    expect(events).toContainEqual({ type: 'reloaded', step: 13 });
    expect(state.ammo).toBe(WOBBLE_GUN.magazine);
  });

  it('leaves a full magazine alone', () => {
    expect(holster(press(idle), WOBBLE_GUN, 3).reload).toBeNull();
  });
});

describe('a continuous weapon', () => {
  const BEAM: WeaponSpec = {
    division: '1/16',
    cooldownBeats: 0.25,
    gateBeats: 0.25,
    magazine: 16,
    reloadBeats: 4,
    coolSteps: 2,
  };
  const runBeam = (state: TriggerState, from: number, to: number) =>
    Array.from({ length: to - from }, (_, i) => from + i).reduce<{
      state: TriggerState;
      events: Array<TriggerEvent>;
    }>(
      (acc, step) => {
        const result = advance(acc.state, BEAM, step);
        return {
          state: result.state,
          events: [...acc.events, ...result.events],
        };
      },
      { state, events: [] },
    );

  it('fires every 1/16 while held, then overheats into a recharge', () => {
    const { state, events } = runBeam(press(initialTrigger(BEAM)), 0, 20);
    expect(fireSteps(events)).toEqual(
      Array.from({ length: 16 }, (_, step) => step),
    );
    expect(state.reload).not.toBeNull();
  });

  it('cools while idle: one charge back per cool step count', () => {
    const fired = runBeam(press(initialTrigger(BEAM)), 0, 6);
    expect(fired.state.ammo).toBe(10);
    const rested = runBeam(release(fired.state), 6, 14);
    expect(rested.state.ammo).toBe(14);
    expect(rested.events).toEqual([]);
  });

  it('never cools past a full magazine', () => {
    const rested = runBeam(initialTrigger(BEAM), 0, 40);
    expect(rested.state.ammo).toBe(16);
  });
});

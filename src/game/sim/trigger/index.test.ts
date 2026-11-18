import { describe, expect, it } from 'vitest';
import { WOBBLE_GUN } from '../../weapons';
import {
  advance,
  initialTrigger,
  press,
  release,
  type TriggerEvent,
  type TriggerState,
} from '.';

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
  events.filter(event => event.type === 'fire').map(event => event.step);

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

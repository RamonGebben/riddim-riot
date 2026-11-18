import { describe, expect, it, vi } from 'vitest';
import { toPosition } from '../../grid';
import { WOBBLE_GUN } from '../../weapons';
import { createWeaponSlot } from '.';

const BPM = 120;
const STEP = 0.125;

const tickAt = (step: number) => ({
  ...toPosition(step),
  step,
  time: step * STEP,
});

const setup = (nowSeconds = 0) => {
  const clock = { now: nowSeconds };
  const voice = { fire: vi.fn() };
  const reloadSound = { click: vi.fn(), rumble: vi.fn() };
  const slot = createWeaponSlot({
    spec: WOBBLE_GUN,
    voice,
    reloadSound,
    bpm: BPM,
    now: () => clock.now,
  });
  return { clock, voice, reloadSound, slot };
};

describe('createWeaponSlot', () => {
  it('fires at the scheduled time of the next slot, held for the gate', () => {
    const { voice, slot } = setup();
    slot.onTick(tickAt(1));
    slot.press();
    slot.release();
    slot.onTick(tickAt(2));

    expect(voice.fire).toHaveBeenCalledTimes(1);
    expect(voice.fire).toHaveBeenCalledWith(2 * STEP, 2 * STEP);
  });

  it('lands a late press on the last tick while its sound is still ahead', () => {
    const { clock, voice, slot } = setup();
    slot.onTick(tickAt(4));
    clock.now = 4 * STEP - 0.05;
    slot.press();

    expect(voice.fire).toHaveBeenCalledWith(4 * STEP, 2 * STEP);
  });

  it('waits for the next slot once the last tick has already sounded', () => {
    const { clock, voice, slot } = setup();
    slot.onTick(tickAt(4));
    clock.now = 4 * STEP + 0.01;
    slot.press();
    expect(voice.fire).not.toHaveBeenCalled();

    slot.onTick(tickAt(5));
    slot.onTick(tickAt(6));
    expect(voice.fire).toHaveBeenCalledWith(6 * STEP, 2 * STEP);
  });

  it('never fires twice on the same step', () => {
    const { voice, slot } = setup();
    slot.press();
    slot.onTick(tickAt(0));
    slot.press();

    expect(voice.fire).toHaveBeenCalledTimes(1);
  });

  it('plays the reload fill at its steps, rumble lasting until the return', () => {
    const { reloadSound, slot } = setup();
    slot.press();
    Array.from({ length: 24 }, (_, step) => slot.onTick(tickAt(step)));

    expect(reloadSound.click).toHaveBeenCalledWith(18 * STEP);
    expect(reloadSound.rumble).toHaveBeenCalledWith(20 * STEP, 4 * STEP);
  });
});

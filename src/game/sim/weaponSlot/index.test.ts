import { describe, expect, it, vi } from 'vitest';
import { toPosition } from '../../grid';
import type { WeaponSpec } from '../../weapons';
import { createWeaponSlot } from '.';

/** The hand-tuned gun from milestone 2: 8 shots of 1/8, then a 2-beat fill. */
const WOBBLE_GUN: WeaponSpec = {
  division: '1/8',
  cooldownBeats: 0.5,
  gateBeats: 0.5,
  magazine: 8,
  reloadBeats: 2,
};

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
    expect(voice.fire).toHaveBeenCalledWith(2 * STEP, 2 * STEP, 0, null);
  });

  it('lands a late press on the last tick while its sound is still ahead', () => {
    const { clock, voice, slot } = setup();
    slot.onTick(tickAt(4));
    clock.now = 4 * STEP - 0.05;
    slot.press();

    expect(voice.fire).toHaveBeenCalledWith(4 * STEP, 2 * STEP, 0, null);
  });

  it('waits for the next slot once the last tick has already sounded', () => {
    const { clock, voice, slot } = setup();
    slot.onTick(tickAt(4));
    clock.now = 4 * STEP + 0.01;
    slot.press();
    expect(voice.fire).not.toHaveBeenCalled();

    slot.onTick(tickAt(5));
    slot.onTick(tickAt(6));
    expect(voice.fire).toHaveBeenCalledWith(6 * STEP, 2 * STEP, 0, null);
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

  it('refills silently while holstered and ignores presses', () => {
    const { voice, reloadSound, slot } = setup();
    slot.press();
    Array.from({ length: 4 }, (_, step) => slot.onTick(tickAt(step)));
    slot.holster();
    slot.press();
    Array.from({ length: 12 }, (_, i) => slot.onTick(tickAt(4 + i)));

    expect(voice.fire).toHaveBeenCalledTimes(2);
    expect(reloadSound.click).not.toHaveBeenCalled();
    expect(slot.getState().ammo).toBe(WOBBLE_GUN.magazine);
  });

  it('fires again once equipped', () => {
    const { voice, slot } = setup();
    slot.holster();
    slot.equip();
    slot.press();
    slot.onTick(tickAt(0));
    expect(voice.fire).toHaveBeenCalledTimes(1);
  });

  it('passes an on-beat press on as a beat accent', () => {
    const { voice, slot } = setup();
    slot.onTick(tickAt(1));
    slot.press({ onBeat: true });
    slot.release();
    slot.onTick(tickAt(2));
    expect(voice.fire).toHaveBeenCalledWith(2 * STEP, 2 * STEP, 0, 'beat');
  });

  it('gives the first shot after a switch the swap bonus on a downbeat', () => {
    const { voice, slot } = setup();
    slot.holster();
    slot.equip();
    slot.press();
    Array.from({ length: 18 }, (_, step) => slot.onTick(tickAt(14 + step)));
    expect(voice.fire).toHaveBeenNthCalledWith(1, 14 * STEP, 2 * STEP, 0, null);
    slot.release();

    const second = setup();
    second.slot.holster();
    second.slot.equip();
    second.slot.press();
    second.slot.onTick(tickAt(16));
    expect(second.voice.fire).toHaveBeenCalledWith(
      16 * STEP,
      2 * STEP,
      0,
      'swap',
    );
  });
});

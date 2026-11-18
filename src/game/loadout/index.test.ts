import { describe, expect, it, vi } from 'vitest';
import { F_MINOR } from '../music';
import { rollWeapon, type Weapon } from '../weapons';
import { createLoadout, type Armed } from '.';

const fakeArm = (weapon: Weapon): Armed => ({
  weapon,
  slot: {
    onTick: vi.fn(),
    press: vi.fn(),
    release: vi.fn(),
    holster: vi.fn(),
    equip: vi.fn(),
    getState: vi.fn(),
  },
  voice: {
    holster: vi.fn(),
    equip: vi.fn(),
    setSubOwner: vi.fn(),
    dispose: vi.fn(),
  },
});

const setup = async () => {
  const armed: Array<Armed> = [];
  const onChange = vi.fn();
  const loadout = await createLoadout({
    size: 3,
    roll: (slot, generation) => rollWeapon(slot * 100 + generation, F_MINOR),
    arm: async weapon => {
      const next = fakeArm(weapon);
      armed.push(next);
      return next;
    },
    now: () => 1,
    onChange,
  });
  return { armed, onChange, loadout };
};

describe('createLoadout', () => {
  it('starts on slot 1 with the others holstered, slot 1 owning the sub', async () => {
    const { armed, loadout } = await setup();
    expect(loadout.view().active).toBe(0);
    expect(armed[0].voice.setSubOwner).toHaveBeenCalledWith(true, 1);
    expect(armed[1].slot.holster).toHaveBeenCalled();
    expect(armed[2].voice.setSubOwner).toHaveBeenCalledWith(false, 1);
  });

  it('switches: old tail fades and drops the sub, new one comes in', async () => {
    const { armed, loadout, onChange } = await setup();
    loadout.act({ type: 'select', slot: 2 });
    expect(armed[0].voice.holster).toHaveBeenCalledWith(1);
    expect(armed[0].voice.setSubOwner).toHaveBeenLastCalledWith(false, 1);
    expect(armed[2].voice.equip).toHaveBeenCalledWith(1);
    expect(armed[2].voice.setSubOwner).toHaveBeenLastCalledWith(true, 1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ active: 2 }),
    );
  });

  it('carries a held trigger over to the new weapon', async () => {
    const { armed, loadout } = await setup();
    loadout.press();
    loadout.act({ type: 'cycle', direction: 1 });
    expect(armed[1].slot.press).toHaveBeenCalled();
  });

  it('cycles around both ends', async () => {
    const { loadout } = await setup();
    loadout.act({ type: 'cycle', direction: -1 });
    expect(loadout.view().active).toBe(2);
    loadout.act({ type: 'cycle', direction: 1 });
    expect(loadout.view().active).toBe(0);
  });

  it('keeps every slot on the clock', async () => {
    const { armed, loadout } = await setup();
    const tick = {
      step: 0,
      bar: 0,
      beat: 0,
      sixteenth: 0,
      stepInBar: 0,
      time: 1,
    };
    loadout.onTick(tick);
    armed.forEach(({ slot }) => expect(slot.onTick).toHaveBeenCalledWith(tick));
  });

  it('arms slots one at a time', async () => {
    let arming = 0;
    let overlapped = false;
    await createLoadout({
      size: 3,
      roll: slot => rollWeapon(slot, F_MINOR),
      arm: async weapon => {
        arming += 1;
        overlapped ||= arming > 1;
        await new Promise(resolve => setTimeout(resolve, 1));
        arming -= 1;
        return fakeArm(weapon);
      },
      now: () => 1,
      onChange: vi.fn(),
    });
    expect(overlapped).toBe(false);
  });

  it('rerolls the active slot into a new weapon', async () => {
    const { armed, loadout, onChange } = await setup();
    const before = loadout.view().slots[0].name;
    loadout.act({ type: 'reroll' });
    await vi.waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(armed[0].voice.dispose).toHaveBeenCalled();
    expect(armed[3].weapon.seed).toBe(1);
    expect(loadout.view().slots[0].name).toBe(armed[3].weapon.name);
    expect(before).toBe(armed[0].weapon.name);
  });
});

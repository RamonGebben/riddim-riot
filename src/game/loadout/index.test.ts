import { describe, expect, it, vi } from 'vitest';
import { F_MINOR } from '../music';
import { weaponFrom, type WeaponRecipe } from '../weapons';
import { createLoadout, type Armed } from '.';

const fakeArm = (recipe: WeaponRecipe): Armed => ({
  recipe,
  weapon: weaponFrom(recipe, F_MINOR),
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

const recipes = [{ seed: 1 }, { seed: 2 }, { seed: 3 }];

const setup = async (active = 0) => {
  const armed: Array<Armed> = [];
  const onChange = vi.fn();
  const loadout = await createLoadout({
    recipes,
    active,
    arm: async recipe => {
      const next = fakeArm(recipe);
      armed.push(next);
      return next;
    },
    now: () => 1,
    onChange,
  });
  return { armed, onChange, loadout };
};

describe('createLoadout', () => {
  it('starts on the given slot with the others holstered, it owning the sub', async () => {
    const { armed, loadout } = await setup(1);
    expect(loadout.view().active).toBe(1);
    expect(armed[1].voice.setSubOwner).toHaveBeenCalledWith(true, 1);
    expect(armed[0].slot.holster).toHaveBeenCalled();
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
      recipes,
      arm: async recipe => {
        arming += 1;
        overlapped ||= arming > 1;
        await new Promise(resolve => setTimeout(resolve, 1));
        arming -= 1;
        return fakeArm(recipe);
      },
      now: () => 1,
      onChange: vi.fn(),
    });
    expect(overlapped).toBe(false);
  });

  it('swaps a weapon into the active slot and hands back the old one', async () => {
    const { armed, loadout } = await setup();
    const old = await loadout.replaceActive({ seed: 99 });
    expect(old).toEqual({ seed: 1 });
    expect(armed[0].voice.dispose).toHaveBeenCalled();
    expect(loadout.recipes()).toEqual([{ seed: 99 }, { seed: 2 }, { seed: 3 }]);
  });
});

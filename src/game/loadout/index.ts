import type { Tick } from '../clock';
import type { WeaponAction } from '../input';
import type { WeaponSlot } from '../sim/weaponSlot';
import type { Weapon } from '../weapons';

/** A weapon in a slot: its trigger on the clock, and its voice. */
export interface Armed {
  weapon: Weapon;
  slot: WeaponSlot;
  voice: {
    holster: (time: number) => void;
    equip: (time: number) => void;
    setSubOwner: (owner: boolean, time: number) => void;
    dispose: () => void;
  };
}

export interface LoadoutView {
  slots: Array<{ name: string }>;
  active: number;
}

export interface Loadout {
  onTick: (tick: Tick) => void;
  press: () => void;
  release: () => void;
  act: (action: WeaponAction) => void;
  view: () => LoadoutView;
  dispose: () => void;
}

/**
 * The slots and switching between them. Every slot stays on the clock, so a
 * holstered one keeps refilling; the active one owns the trigger and the sub.
 * Switching fades the old weapon's tail while the new one comes in, and a
 * held trigger carries straight over.
 */
export const createLoadout = async ({
  size,
  roll,
  arm,
  now,
  onChange,
}: {
  size: number;
  /** The weapon for a slot's `generation`-th roll. */
  roll: (slot: number, generation: number) => Weapon;
  /** Builds the weapon's voice; never called twice at once. */
  arm: (weapon: Weapon) => Promise<Armed>;
  /** The audio time switches are scheduled at. */
  now: () => number;
  onChange: (view: LoadoutView) => void;
}): Promise<Loadout> => {
  let generations = Array.from({ length: size }, () => 0);
  // One at a time: arming measures loudness offline, which can't overlap.
  let slots = await generations.reduce<Promise<Array<Armed>>>(
    async (armed, generation, index) => [
      ...(await armed),
      await arm(roll(index, generation)),
    ],
    Promise.resolve([]),
  );
  let active = 0;
  let held = false;
  let rerolling = false;

  const view = (): LoadoutView => ({
    slots: slots.map(({ weapon }) => ({ name: weapon.name })),
    active,
  });

  const putAway = (armed: Armed) => {
    armed.slot.holster();
    armed.voice.holster(now());
    armed.voice.setSubOwner(false, now());
  };

  const takeOut = (armed: Armed) => {
    armed.slot.equip();
    armed.voice.equip(now());
    armed.voice.setSubOwner(true, now());
    if (held) armed.slot.press();
  };

  slots.forEach((armed, index) =>
    index === active ? takeOut(armed) : putAway(armed),
  );

  const select = (index: number) => {
    if (index === active || index < 0 || index >= size) return;
    putAway(slots[active]);
    active = index;
    takeOut(slots[active]);
    onChange(view());
  };

  const reroll = async () => {
    if (rerolling) return;
    rerolling = true;
    const index = active;
    generations = generations.map((generation, i) =>
      i === index ? generation + 1 : generation,
    );
    const fresh = await arm(roll(index, generations[index]));
    slots[index].voice.dispose();
    slots = slots.map((armed, i) => (i === index ? fresh : armed));
    // The player may have switched away while it was being armed.
    if (index === active) takeOut(fresh);
    else putAway(fresh);
    rerolling = false;
    onChange(view());
  };

  return {
    onTick: tick => slots.forEach(({ slot }) => slot.onTick(tick)),
    press: () => {
      held = true;
      slots[active].slot.press();
    },
    release: () => {
      held = false;
      slots[active].slot.release();
    },
    act: action => {
      if (action.type === 'select') select(action.slot);
      if (action.type === 'cycle') {
        select((active + action.direction + size) % size);
      }
      if (action.type === 'reroll') void reroll();
    },
    view,
    dispose: () => slots.forEach(({ voice }) => voice.dispose()),
  };
};

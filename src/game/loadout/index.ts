import type { Tick } from '../clock';
import type { WeaponAction } from '../input';
import type { WeaponSlot } from '../sim/weaponSlot';
import type { Weapon, WeaponRecipe } from '../weapons';

/** A weapon in a slot: its trigger on the clock, and its voice. */
export interface Armed {
  recipe: WeaponRecipe;
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
  /** `onBeat`: the press landed close to the active weapon's grid. */
  press: (options?: { onBeat?: boolean }) => void;
  release: () => void;
  act: (action: WeaponAction) => void;
  /** Swap a weapon into the active slot; resolves with the one it replaced. */
  replaceActive: (recipe: WeaponRecipe) => Promise<WeaponRecipe>;
  view: () => LoadoutView;
  activeWeapon: () => Weapon;
  /** What to carry into the next level. */
  recipes: () => Array<WeaponRecipe>;
  active: () => number;
  dispose: () => void;
}

/**
 * The slots and switching between them. Every slot stays on the clock, so a
 * holstered one keeps refilling; the active one owns the trigger and the sub.
 * Switching fades the old weapon's tail while the new one comes in, and a
 * held trigger carries straight over.
 */
export const createLoadout = async ({
  recipes,
  active: startActive = 0,
  arm,
  now,
  onChange,
}: {
  recipes: Array<WeaponRecipe>;
  active?: number;
  /** Builds the weapon's voice; never called twice at once. */
  arm: (recipe: WeaponRecipe) => Promise<Armed>;
  /** The audio time switches are scheduled at. */
  now: () => number;
  onChange: (view: LoadoutView) => void;
}): Promise<Loadout> => {
  // One at a time: arming measures loudness offline, which can't overlap.
  let slots = await recipes.reduce<Promise<Array<Armed>>>(
    async (armed, recipe) => [...(await armed), await arm(recipe)],
    Promise.resolve([]),
  );
  const size = slots.length;
  let active = startActive;
  let held = false;
  let busy = false;

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

  /** Re-arm one slot; one replacement at a time. */
  const replace = async (
    index: number,
    recipe: WeaponRecipe,
  ): Promise<WeaponRecipe> => {
    const old = slots[index].recipe;
    if (busy) return recipe;
    busy = true;
    const fresh = await arm(recipe);
    slots[index].voice.dispose();
    slots = slots.map((armed, i) => (i === index ? fresh : armed));
    // The player may have switched away while it was being armed.
    if (index === active) takeOut(fresh);
    else putAway(fresh);
    busy = false;
    onChange(view());
    return old;
  };

  return {
    onTick: tick => slots.forEach(({ slot }) => slot.onTick(tick)),
    press: options => {
      held = true;
      slots[active].slot.press(options);
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
    },
    replaceActive: recipe => replace(active, recipe),
    view,
    activeWeapon: () => slots[active].weapon,
    recipes: () => slots.map(({ recipe }) => recipe),
    active: () => active,
    dispose: () => slots.forEach(({ voice }) => voice.dispose()),
  };
};

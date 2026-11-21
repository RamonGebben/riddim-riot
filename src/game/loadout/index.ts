import type { Tick } from '../clock';
import type { WeaponAction } from '../input';
import type { WeaponSlot } from '../sim/weaponSlot';
import {
  sameRecipe,
  type FxPart,
  type LfoPart,
  type ManufacturerPart,
  type OscillatorPart,
  type Weapon,
  type WeaponRecipe,
} from '../weapons';

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

/** One slot as the HUD shows it: what the weapon is, and its magazine. */
export interface SlotView {
  name: string;
  oscillator: OscillatorPart;
  manufacturer: ManufacturerPart;
  lfo: LfoPart;
  fx: FxPart | null;
  /** Bursts at the end of its range: a slow (1/4, 1/2) weapon. */
  blasts: boolean;
  ammo: number;
  magazine: number;
  /**
   * Refilling (or a beam overheated): `id` changes with each refill, and
   * `seconds` is how long until it's back, so the HUD can animate it
   * without hearing from the loop again.
   */
  reload: { id: number; seconds: number } | null;
}

export interface LoadoutView {
  slots: Array<SlotView>;
  active: number;
}

export interface Loadout {
  onTick: (tick: Tick) => void;
  /** `onBeat`: the press landed close to the active weapon's grid. */
  press: (options?: { onBeat?: boolean }) => void;
  release: () => void;
  act: (action: WeaponAction) => void;
  /**
   * Put these weapons in the slots, in this order - the loadout menu's
   * choice. Weapons already armed move over with their magazines; only
   * new ones are armed. The active slot stays the active slot.
   */
  arrange: (recipes: Array<WeaponRecipe>) => Promise<void>;
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
  stepSeconds,
  onChange,
}: {
  recipes: Array<WeaponRecipe>;
  active?: number;
  /** Builds the weapon's voice; never called twice at once. */
  arm: (recipe: WeaponRecipe) => Promise<Armed>;
  /** The audio time switches are scheduled at. */
  now: () => number;
  stepSeconds: number;
  /** On every switch, swap, shot and refill. */
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

  let lastTick: Tick | null = null;
  const slotView = ({ weapon, slot }: Armed): SlotView => {
    const { ammo, reload } = slot.getState();
    const step = lastTick?.step ?? 0;
    // Ticks run ahead of the audio: the refill lands that much later.
    const ahead = lastTick ? Math.max(lastTick.time - now(), 0) : 0;
    return {
      name: weapon.name,
      ...weapon.parts,
      blasts: weapon.projectile.detonates === true,
      ammo,
      magazine: weapon.timing.magazine,
      reload: reload
        ? {
            id: reload.start,
            seconds: Math.max(reload.end - step, 0) * stepSeconds + ahead,
          }
        : null,
    };
  };
  const view = (): LoadoutView => ({ slots: slots.map(slotView), active });
  /** What changes shot by shot; the rest only changes with a switch or swap. */
  const magazines = () =>
    slots
      .map(({ slot }) => {
        const { ammo, reload } = slot.getState();
        return `${ammo}:${reload?.start ?? '-'}`;
      })
      .join(',');
  let lastMagazines = magazines();

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

  /** One arrangement at a time: arming can't overlap. */
  const arrange = async (next: Array<WeaponRecipe>) => {
    if (busy || next.length !== size) return;
    busy = true;
    const spare = [...slots];
    /** An armed weapon for this recipe, each used once. */
    const reuse = (recipe: WeaponRecipe) => {
      const at = spare.findIndex(armed => sameRecipe(armed.recipe, recipe));
      return at < 0 ? null : spare.splice(at, 1)[0];
    };
    const kept = next.map(reuse);
    const arranged = await next.reduce<Promise<Array<Armed>>>(
      async (done, recipe, index) => [
        ...(await done),
        kept[index] ?? (await arm(recipe)),
      ],
      Promise.resolve([]),
    );
    spare.forEach(({ voice }) => voice.dispose());
    putAway(slots[active]);
    slots = arranged;
    slots.forEach((armed, index) =>
      index === active ? takeOut(armed) : putAway(armed),
    );
    busy = false;
    onChange(view());
  };

  return {
    onTick: tick => {
      lastTick = tick;
      slots.forEach(({ slot }) => slot.onTick(tick));
      const next = magazines();
      if (next === lastMagazines) return;
      lastMagazines = next;
      onChange(view());
    },
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
    arrange,
    view,
    activeWeapon: () => slots[active].weapon,
    recipes: () => slots.map(({ recipe }) => recipe),
    active: () => active,
    dispose: () => slots.forEach(({ voice }) => voice.dispose()),
  };
};

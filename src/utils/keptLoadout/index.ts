import { z } from 'zod';
import { FX, MANUFACTURERS, OSCILLATORS } from '~/game/weapons';

const KEY = 'bass-weapons:loadout';

const keysOf = <T extends Record<string, unknown>>(record: T) =>
  Object.keys(record) as [keyof T & string, ...Array<keyof T & string>];

/** A weapon as a recipe: a seed and the parts loot may pin. */
export const recipeSchema = z.strictObject({
  seed: z
    .number()
    .int()
    .min(0)
    .max(2 ** 32 - 1),
  oscillator: z.enum(keysOf(OSCILLATORS)).optional(),
  manufacturer: z.enum(keysOf(MANUFACTURERS)).optional(),
  fx: z.enum(keysOf(FX)).optional(),
});

/** The three slots, in order: the same check here and on the server. */
export const loadoutSchema = z.array(recipeSchema).length(3);

export type KeptRecipes = z.infer<typeof loadoutSchema>;

/** A loadout and when it was chosen (epoch ms), so the newer one wins. */
export interface KeptLoadout {
  recipes: KeptRecipes;
  savedAt: number;
}

const keptSchema = z.object({
  recipes: loadoutSchema,
  savedAt: z.number().finite(),
});

/** Browser storage as far as this needs it; may be missing or throw. */
type Store = Pick<Storage, 'getItem' | 'setItem'>;

const local = (): Store | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/** The loadout kept on this device, if there's a valid one. */
export const readKeptLoadout = (
  store: Store | null = local(),
): KeptLoadout | null => {
  try {
    const saved = keptSchema.safeParse(
      JSON.parse(store?.getItem(KEY) ?? 'null'),
    );
    return saved.success ? saved.data : null;
  } catch {
    return null;
  }
};

/** Keep a loadout on this device, for a guest's next visit. */
export const keepLoadout = (
  kept: KeptLoadout,
  store: Store | null = local(),
): void => {
  try {
    store?.setItem(KEY, JSON.stringify(kept));
  } catch {
    // Private window or storage blocked: it lasts until the page closes.
  }
};

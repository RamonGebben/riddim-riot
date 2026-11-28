import type { SoundOverrides } from '~/game/playground';
import type { SoundDesign } from '~/game/sound';
import {
  DESIGN_SCHEMA,
  valueAt,
  type DesignPath,
  type Field,
} from '~/game/sound/schema';
import type { WeaponSound } from '~/game/weapons';

/**
 * What every panel reads and writes: the design being tuned (and the one
 * saved, to mark what moved), and the weapon being auditioned.
 */
export interface Tuning {
  design: SoundDesign;
  saved: SoundDesign;
  set: (path: DesignPath, value: unknown) => void;
  weapon: {
    /** What the weapon plays: its roll with any overrides on top. */
    sound: WeaponSound;
    /** The roll's own values, before any override. */
    rolled: WeaponSound;
    overrides: SoundOverrides;
    override: (key: keyof SoundOverrides, value: number | undefined) => void;
  };
}

const FIELDS = new Map(
  DESIGN_SCHEMA.flatMap(group => group.fields).map(field => [
    field.path.join('.'),
    field,
  ]),
);

/** The schema's field at `path`; the racks only point at real ones. */
export const fieldAt = (path: DesignPath): Field => {
  const field = FIELDS.get(path.join('.'));
  if (!field) throw new Error(`No sound design field at ${path.join('.')}`);
  return field;
};

/** A number of the design; `0` stands in for a value that isn't there. */
export const numberAt = (design: SoundDesign, path: DesignPath): number => {
  const value = valueAt(design, path);
  return typeof value === 'number' ? value : 0;
};

/** Set a number field, kept inside its schema range and steps. */
export const setNumber = (
  tuning: Tuning,
  path: DesignPath,
  value: number,
): void => {
  const field = fieldAt(path);
  if (field.kind !== 'number') return;
  const clamped = Math.min(Math.max(value, field.min), field.max);
  const stepped =
    field.min + Math.round((clamped - field.min) / field.step) * field.step;
  const decimals = Math.max(0, -Math.floor(Math.log10(field.step)) + 1);
  tuning.set(path, Number(stepped.toFixed(Math.min(decimals, 10))));
};

/** The values the weapon's own knobs move, as the schema would range them. */
export const WEAPON_FIELDS = {
  cutoff: { min: 100, max: 16000, step: 10, unit: 'Hz' },
  resonance: { min: 0, max: 20, step: 0.1 },
  drive: { min: 0, max: 0.8, step: 0.01 },
  feedback: { min: 0, max: 0.9, step: 0.01 },
  wet: { min: 0, max: 1, step: 0.01 },
} as const satisfies Record<
  keyof SoundOverrides,
  { min: number; max: number; step: number; unit?: 'Hz' }
>;

/** The rolled weapon's value for one of its overridable knobs. */
export const weaponValue = (
  sound: WeaponSound,
  key: keyof SoundOverrides,
): number => {
  if (key === 'feedback') return sound.delay?.feedback ?? 0;
  if (key === 'wet') return sound.delay?.wet ?? 0;
  return sound[key];
};

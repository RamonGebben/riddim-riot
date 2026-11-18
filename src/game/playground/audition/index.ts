import type { Key } from '../../music';
import type { SoundDesign } from '../../sound';
import { rollWeapon, type Weapon, type WeaponPins } from '../../weapons';

/** Fine-tune a rolled weapon's sound without rolling again. */
export interface SoundOverrides {
  cutoff?: number;
  resonance?: number;
  drive?: number;
  /** Only applies to a weapon with Echo. */
  feedback?: number;
  wet?: number;
}

/** What the playground is listening to: a roll, pinned and tweaked. */
export interface Audition {
  seed: number;
  pins: WeaponPins;
  overrides: SoundOverrides;
}

export const auditionWeapon = (
  { seed, pins, overrides }: Audition,
  key: Key,
  design: SoundDesign,
): Weapon => {
  const weapon = rollWeapon(seed, key, { pins, design });
  const { sound } = weapon;
  return {
    ...weapon,
    sound: {
      ...sound,
      cutoff: overrides.cutoff ?? sound.cutoff,
      resonance: overrides.resonance ?? sound.resonance,
      drive: overrides.drive ?? sound.drive,
      delay: sound.delay && {
        feedback: overrides.feedback ?? sound.delay.feedback,
        wet: overrides.wet ?? sound.delay.wet,
      },
    },
  };
};

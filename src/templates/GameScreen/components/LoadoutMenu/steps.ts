import type { WeaponFace } from '~/molecules/WeaponTag';

/** 1/16 steps in a bar: the grid every weapon's rhythm is drawn on. */
export const STEPS = 16;

/** Steps between shots, per beat division. */
const SPACING = { '1/2': 8, '1/4': 4, '1/8': 2, '1/16': 1 } satisfies Record<
  WeaponFace['lfo'],
  number
>;

/** An echo answers each shot an 1/8 later. */
const ECHO_STEPS = 2;

/** A step: a shot, an echo of one, the beam held through it, or rest. */
export type Step = 'hit' | 'echo' | 'held' | 'rest';

/**
 * A bar of a weapon's fire, step by step, as the menu draws it: a beam is
 * held the whole bar; anything else hits on its division, with an echo an
 * 1/8 after each hit where there isn't a hit already.
 */
export const stepsOf = ({
  oscillator,
  lfo,
  fx,
}: Pick<WeaponFace, 'oscillator' | 'lfo' | 'fx'>): Array<Step> => {
  if (oscillator === 'beam') return Array.from({ length: STEPS }, () => 'held');
  const spacing = SPACING[lfo];
  const hit = (step: number) => step % spacing === 0;
  return Array.from({ length: STEPS }, (_, step) => {
    if (hit(step)) return 'hit';
    const before = (step - ECHO_STEPS + STEPS) % STEPS;
    return fx === 'echo' && hit(before) ? 'echo' : 'rest';
  });
};

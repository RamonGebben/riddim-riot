import { describe, expect, it } from 'vitest';
import { F_MINOR } from '../../music';
import { BASE_DESIGN } from '../../sound';
import { rollWeapon } from '../../weapons';
import { auditionWeapon } from '.';

describe('auditionWeapon', () => {
  it('is the plain roll without pins or overrides', () => {
    expect(
      auditionWeapon(
        { seed: 4, pins: {}, overrides: {} },
        F_MINOR,
        BASE_DESIGN,
      ),
    ).toEqual(rollWeapon(4, F_MINOR, { design: BASE_DESIGN }));
  });

  it('applies pins and sound overrides', () => {
    const weapon = auditionWeapon(
      {
        seed: 4,
        pins: { oscillator: 'wobble', fx: 'echo' },
        overrides: { cutoff: 999, wet: 0.9 },
      },
      F_MINOR,
      BASE_DESIGN,
    );
    expect(weapon.parts.oscillator).toBe('wobble');
    expect(weapon.sound.cutoff).toBe(999);
    expect(weapon.sound.delay?.wet).toBe(0.9);
  });

  it('ignores echo overrides on a weapon without echo', () => {
    const weapon = auditionWeapon(
      { seed: 4, pins: { fx: null }, overrides: { wet: 0.9 } },
      F_MINOR,
      BASE_DESIGN,
    );
    expect(weapon.sound.delay).toBeNull();
  });

  it('rolls from the design it is given', () => {
    const narrow = {
      ...BASE_DESIGN,
      parts: {
        ...BASE_DESIGN.parts,
        engines: {
          ...BASE_DESIGN.parts.engines,
          wobble: {
            ...BASE_DESIGN.parts.engines.wobble,
            cutoff: [800, 800] as [number, number],
          },
        },
      },
    };
    const weapon = auditionWeapon(
      { seed: 9, pins: { oscillator: 'wobble' }, overrides: {} },
      F_MINOR,
      narrow,
    );
    expect(weapon.sound.cutoff).toBe(800);
  });
});

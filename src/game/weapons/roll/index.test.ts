import { describe, expect, it } from 'vitest';
import { STEPS_PER_BAR, STEPS_PER_DIVISION } from '../../grid';
import { F_MINOR, SCALES } from '../../music';
import { rollWeapon } from '.';

const rolls = Array.from({ length: 200 }, (_, seed) =>
  rollWeapon(seed, F_MINOR),
);

describe('rollWeapon', () => {
  it('is reproducible from its seed', () => {
    expect(rollWeapon(7, F_MINOR)).toEqual(rollWeapon(7, F_MINOR));
  });

  it('rolls every part from the pool', () => {
    const seen = (pick: (parts: (typeof rolls)[number]['parts']) => unknown) =>
      new Set(rolls.map(weapon => pick(weapon.parts)));
    expect(seen(parts => parts.oscillator)).toEqual(
      new Set(['wobble', 'laser']),
    );
    expect(seen(parts => parts.lfo)).toEqual(new Set(['1/4', '1/8', '1/16']));
    expect(seen(parts => parts.fx)).toEqual(
      new Set([null, 'distortion', 'echo']),
    );
  });

  it('plays every riff note in the key, starting on the root', () => {
    const inKey = new Set(
      SCALES[F_MINOR.scale].map(step => (F_MINOR.root + step) % 12),
    );
    rolls.forEach(({ sound }) => {
      expect(sound.riff[0] % 12).toBe(F_MINOR.root);
      sound.riff.forEach(note => expect(inKey.has(note % 12)).toBe(true));
    });
  });

  it('sizes every magazine to exactly one bar', () => {
    rolls.forEach(({ timing }) =>
      expect(timing.magazine * STEPS_PER_DIVISION[timing.division]).toBe(
        STEPS_PER_BAR,
      ),
    );
  });

  it('balances damage per bar across fire rates', () => {
    const perBar = (lfo: string) =>
      rolls
        .filter(
          weapon =>
            weapon.parts.lfo === lfo &&
            weapon.parts.oscillator === 'wobble' &&
            weapon.parts.manufacturer === 'vandal' &&
            weapon.parts.fx === null,
        )
        .map(weapon => weapon.projectile.damage * weapon.timing.magazine)[0];
    const slow = perBar('1/4');
    expect(perBar('1/8') / slow).toBeGreaterThan(0.8);
    expect(perBar('1/16') / slow).toBeLessThan(1.4);
  });

  it('gives echo shots only to echo weapons', () => {
    rolls.forEach(weapon =>
      expect(weapon.echo !== null).toBe(weapon.parts.fx === 'echo'),
    );
  });

  it('can pin the engine without changing the rest of the roll', () => {
    const free = rollWeapon(7, F_MINOR);
    const other = free.parts.oscillator === 'wobble' ? 'laser' : 'wobble';
    const pinned = rollWeapon(7, F_MINOR, { pins: { oscillator: other } });
    expect(pinned.parts.oscillator).toBe(other);
    expect(pinned.parts.manufacturer).toBe(free.parts.manufacturer);
    expect(pinned.parts.lfo).toBe(free.parts.lfo);
  });

  it('can pin every part, including no FX at all', () => {
    const pinned = rollWeapon(3, F_MINOR, {
      pins: {
        manufacturer: 'lumen',
        oscillator: 'laser',
        lfo: '1/16',
        fx: null,
      },
    });
    expect(pinned.parts).toEqual({
      manufacturer: 'lumen',
      oscillator: 'laser',
      lfo: '1/16',
      fx: null,
    });
    expect(pinned.timing.magazine).toBe(16);
    expect(
      rollWeapon(3, F_MINOR, { pins: { fx: 'echo' } }).echo,
    ).not.toBeNull();
  });

  it('names a weapon after its parts', () => {
    expect(rollWeapon(7, F_MINOR).name).toMatch(
      /^(Vandal|Lumen) (Wobble|Laser) /,
    );
  });

  it('makes two rerolls of a slot differ in sound', () => {
    const different = rolls
      .slice(0, 50)
      .filter(
        (weapon, i) =>
          JSON.stringify(weapon.sound) !== JSON.stringify(rolls[i + 1].sound),
      );
    expect(different).toHaveLength(50);
  });
});

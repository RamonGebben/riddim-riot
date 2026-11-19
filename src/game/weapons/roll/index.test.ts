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
      new Set(['wobble', 'laser', 'beam']),
    );
    expect(seen(parts => parts.lfo)).toEqual(
      new Set(['1/2', '1/4', '1/8', '1/16']),
    );
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

describe('a beam', () => {
  const beam = rollWeapon(3, F_MINOR, { pins: { oscillator: 'beam' } });

  it('ticks on every 1/16 for a bar, cools while idle and recharges longer', () => {
    expect(beam.projectile.kind).toBe('beam');
    expect(beam.timing).toMatchObject({
      division: '1/16',
      magazine: STEPS_PER_BAR,
      coolSteps: expect.any(Number),
    });
    expect(beam.timing.reloadBeats).toBeGreaterThan(2);
  });

  it('holds its aim', () => {
    expect(beam.projectile.spread).toBe(0);
  });
});

describe('crush', () => {
  const crushed = (seed: number) =>
    rollWeapon(seed, F_MINOR, {
      pins: { oscillator: 'wobble', lfo: '1/8', fx: 'distortion' },
    });

  it('bursts on hit, wider the harder it drives', () => {
    const weapons = Array.from({ length: 40 }, (_, seed) => crushed(seed));
    weapons.forEach(weapon => expect(weapon.projectile.splash).toBeDefined());
    const byDrive = [...weapons].sort((a, b) => a.sound.drive - b.sound.drive);
    expect(byDrive[0].projectile.splash!.radius).toBeLessThan(
      byDrive[byDrive.length - 1].projectile.splash!.radius,
    );
  });

  it('never bursts a beam, and nothing else bursts', () => {
    const beam = rollWeapon(1, F_MINOR, {
      pins: { oscillator: 'beam', fx: 'distortion' },
    });
    expect(beam.projectile.splash).toBeUndefined();
    const clean = rollWeapon(1, F_MINOR, { pins: { lfo: '1/8', fx: null } });
    expect(clean.projectile.splash).toBeUndefined();
  });
});

describe('slow rates', () => {
  const at = (lfo: '1/2' | '1/4' | '1/8', fx: 'distortion' | null = null) =>
    rollWeapon(5, F_MINOR, { pins: { oscillator: 'wobble', lfo, fx } });

  it('burst on a hit or at the end of their range, wider the slower', () => {
    const half = at('1/2').projectile;
    const quarter = at('1/4').projectile;
    expect(half.detonates).toBe(true);
    expect(quarter.detonates).toBe(true);
    expect(half.splash!.radius).toBeGreaterThan(quarter.splash!.radius);
    expect(half.radius).toBeGreaterThan(quarter.radius);
    expect(at('1/8').projectile.detonates).toBeUndefined();
  });

  it('grow their blast with Crush', () => {
    expect(at('1/4', 'distortion').projectile.splash!.radius).toBeGreaterThan(
      at('1/4').projectile.splash!.radius,
    );
  });

  it('never make a beam burst', () => {
    const beam = rollWeapon(5, F_MINOR, {
      pins: { oscillator: 'beam', lfo: '1/2' },
    });
    expect(beam.projectile.splash).toBeUndefined();
    expect(beam.projectile.detonates).toBeUndefined();
  });

  it('fire two shots a bar at 1/2', () => {
    expect(at('1/2').timing.magazine).toBe(2);
  });
});

import { describe, expect, it } from 'vitest';
import { styleFor, SUBGENRES, weightsFor, type Subgenre } from '.';

const rolled = (level: number) =>
  new Set(
    Array.from({ length: 400 }, (_, seed) => styleFor(seed, level).subgenre),
  );

describe('subgenres', () => {
  it('rolls the same style and tempo for the same level every time', () => {
    expect(styleFor(1234, 4)).toEqual(styleFor(1234, 4));
  });

  it("only rolls a level's own subgenres, all of them in time", () => {
    [1, 2, 3, 4, 5].forEach(level => {
      const allowed = weightsFor(level).map(([subgenre]) => subgenre);
      expect([...rolled(level)].toSorted()).toEqual(allowed.toSorted());
    });
  });

  it('plays halftime early in a run and two-step at the end', () => {
    const feels = (level: number) =>
      new Set([...rolled(level)].map(s => SUBGENRES[s].drums.feel));
    expect(feels(1)).toEqual(new Set(['halftime']));
    expect(feels(3)).toEqual(new Set(['halftime']));
    expect(feels(5)).toEqual(new Set(['twostep']));
  });

  it('keeps every tempo within its subgenre, faster further in', () => {
    Array.from({ length: 200 }, (_, seed) => seed).forEach(seed => {
      [1, 2, 3, 4, 5].forEach(level => {
        const { style, bpm } = styleFor(seed, level);
        expect(bpm).toBeGreaterThanOrEqual(style.bpm[0]);
        expect(bpm).toBeLessThanOrEqual(style.bpm[1]);
      });
      expect(styleFor(seed, 5).bpm).toBeGreaterThan(styleFor(seed, 1).bpm);
    });
  });

  it('presses harder in the intense styles than the relaxed ones', () => {
    const pressure = (subgenre: Subgenre) => SUBGENRES[subgenre].pressure;
    expect(pressure('liquid')).toBeLessThan(pressure('neurofunk'));
    expect(pressure('deep')).toBeLessThan(pressure('brostep'));
  });

  it('picks by weight: liquid leads level 4', () => {
    const counts = Array.from({ length: 1000 }, (_, seed) =>
      styleFor(seed, 4),
    ).reduce<Partial<Record<Subgenre, number>>>(
      (acc, { subgenre }) => ({ ...acc, [subgenre]: (acc[subgenre] ?? 0) + 1 }),
      {},
    );
    expect(counts.liquid ?? 0).toBeGreaterThan(500);
    expect(counts.neurofunk ?? 0).toBeLessThan(200);
  });
});

import { describe, expect, it } from 'vitest';
import { BASE_DESIGN, mergeDesign } from '.';

describe('mergeDesign', () => {
  it('fills everything from the base when nothing is saved', () => {
    expect(mergeDesign({})).toEqual(BASE_DESIGN);
    expect(mergeDesign(null)).toEqual(BASE_DESIGN);
  });

  it('takes saved values over the base', () => {
    const design = mergeDesign({
      wobble: { voices: 5 },
      drums: { kick: { decay: 0.7 } },
    });
    expect(design.wobble.voices).toBe(5);
    expect(design.drums.kick.decay).toBe(0.7);
    expect(design.wobble.spread).toBe(BASE_DESIGN.wobble.spread);
  });

  it('ignores values of the wrong type, and unknown keys', () => {
    const design = mergeDesign({
      wobble: { voices: 'lots', spread: Number.NaN, bogus: 1 },
      parts: { engines: { wobble: { degrees: [0, 'x'] } } },
    });
    expect(design.wobble.voices).toBe(BASE_DESIGN.wobble.voices);
    expect(design.wobble.spread).toBe(BASE_DESIGN.wobble.spread);
    expect(design.wobble).not.toHaveProperty('bogus');
    expect(design.parts.engines.wobble.degrees).toEqual(
      BASE_DESIGN.parts.engines.wobble.degrees,
    );
  });

  it('accepts a saved list of a different length', () => {
    const design = mergeDesign({
      parts: { engines: { laser: { degrees: [0, 7] } } },
    });
    expect(design.parts.engines.laser.degrees).toEqual([0, 7]);
  });

  it('keeps a range a pair', () => {
    const design = mergeDesign({ parts: { crush: { drive: [0.5] } } });
    expect(design.parts.crush.drive).toEqual(BASE_DESIGN.parts.crush.drive);
  });

  it('round-trips a full design', () => {
    expect(mergeDesign(JSON.parse(JSON.stringify(BASE_DESIGN)))).toEqual(
      BASE_DESIGN,
    );
  });
});

import { describe, expect, it } from 'vitest';
import { fromPosition, nudge, snap, toPosition } from '.';

const hz = { min: 20, max: 20_000, step: 10, log: true };
const level = { min: -40, max: 6, step: 0.5 };
const voices = { min: 1, max: 8, step: 1 };

describe('knobScale', () => {
  it('turns a log knob by octaves, not Hz', () => {
    expect(toPosition(632, { ...hz, step: 1 })).toBeCloseTo(0.5, 2);
    expect(fromPosition(0.5, { ...hz, step: 1 })).toBe(632);
  });

  it('turns a linear knob evenly', () => {
    expect(toPosition(-17, level)).toBeCloseTo(0.5);
    expect(fromPosition(1, level)).toBe(6);
  });

  it('snaps to the steps and stays in range', () => {
    expect(snap(0.30000000004, { min: 0, max: 1, step: 0.1 })).toBe(0.3);
    expect(snap(99, voices)).toBe(8);
    expect(snap(2.4, voices)).toBe(2);
  });

  it('nudges a few-valued knob a whole step', () => {
    expect(nudge(3, voices, 1)).toBe(4);
    expect(nudge(1, voices, -1)).toBe(1);
  });

  it('nudges a fine knob a hundredth of the way, or a step when fine', () => {
    expect(nudge(0, level, 1)).toBe(0.5);
    expect(nudge(0, { min: 0, max: 1, step: 0.001 }, 1)).toBe(0.01);
    expect(nudge(0, { min: 0, max: 1, step: 0.001 }, 1, { fine: true })).toBe(
      0.001,
    );
    expect(nudge(0, { min: 0, max: 1, step: 0.001 }, 1, { coarse: true })).toBe(
      0.1,
    );
  });
});

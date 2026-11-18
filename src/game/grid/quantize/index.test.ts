import { describe, expect, it } from 'vitest';
import { beatsToSteps, nextSlot } from '.';

describe('nextSlot', () => {
  it('keeps a step that is already on the grid', () => {
    expect(nextSlot(8, '1/8')).toBe(8);
    expect(nextSlot(5, '1/16')).toBe(5);
  });

  it('pushes an off-grid step to the next slot', () => {
    expect(nextSlot(9, '1/8')).toBe(10);
    expect(nextSlot(5, '1/4')).toBe(8);
    expect(nextSlot(17, '1/1')).toBe(32);
  });
});

describe('beatsToSteps', () => {
  it('converts beats to 1/16 steps', () => {
    expect(beatsToSteps(2)).toBe(8);
    expect(beatsToSteps(0.5)).toBe(2);
  });
});

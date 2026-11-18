import { describe, expect, it } from 'vitest';
import { createPulse } from '.';

describe('createPulse', () => {
  it('is flat before any hit lands', () => {
    const pulse = createPulse({ decay: 0.1 });
    expect(pulse.valueAt(1)).toBe(0);
    pulse.hit(2);
    expect(pulse.valueAt(1.99)).toBe(0);
  });

  it('peaks at the hit time with its strength, then decays', () => {
    const pulse = createPulse({ decay: 0.1 });
    pulse.hit(1, 0.8);
    expect(pulse.valueAt(1)).toBeCloseTo(0.8);
    expect(pulse.valueAt(1.1)).toBeCloseTo(0.8 / Math.E);
  });

  it('follows the latest hit that has already sounded', () => {
    const pulse = createPulse({ decay: 0.1 });
    pulse.hit(1);
    pulse.hit(1.5, 0.5);
    expect(pulse.valueAt(1.4)).toBeCloseTo(Math.exp(-4));
    expect(pulse.valueAt(1.5)).toBeCloseTo(0.5);
  });
});

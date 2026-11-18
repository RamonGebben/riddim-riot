import { describe, expect, it } from 'vitest';
import { spreadAngle } from '.';

describe('spreadAngle', () => {
  it('opens with a dead-centre shot, then fans out within the spread', () => {
    expect(spreadAngle(0, 0.1)).toBe(0);
    Array.from({ length: 20 }, (_, shot) => spreadAngle(shot, 0.1)).forEach(
      angle => expect(Math.abs(angle)).toBeLessThanOrEqual(0.1),
    );
  });

  it('repeats every five shots', () => {
    expect(spreadAngle(6, 0.1)).toBe(spreadAngle(1, 0.1));
  });
});

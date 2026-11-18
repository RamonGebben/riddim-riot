import { describe, expect, it } from 'vitest';
import { toPosition } from '.';

describe('toPosition', () => {
  it('starts at the top of the first bar', () => {
    expect(toPosition(0)).toEqual({
      bar: 0,
      beat: 0,
      sixteenth: 0,
      stepInBar: 0,
    });
  });

  it('places a step inside its beat and bar', () => {
    expect(toPosition(11)).toEqual({
      bar: 0,
      beat: 2,
      sixteenth: 3,
      stepInBar: 11,
    });
  });

  it('wraps into the next bar', () => {
    expect(toPosition(16)).toEqual({
      bar: 1,
      beat: 0,
      sixteenth: 0,
      stepInBar: 0,
    });
    expect(toPosition(16 * 300 + 9)).toMatchObject({ bar: 300, stepInBar: 9 });
  });
});

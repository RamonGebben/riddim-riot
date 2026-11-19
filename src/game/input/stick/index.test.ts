import { describe, expect, it } from 'vitest';
import { dragStick, readStick, startStick, STICK_RIMS } from '.';

const at = { x: 100, y: 100 };
const knobAt = (dx: number, dy: number) =>
  dragStick(startStick(at), { x: at.x + dx, y: at.y + dy });

describe('readStick', () => {
  it('holds the facing while the thumb rests', () => {
    expect(readStick(knobAt(2, 2))).toEqual({
      move: { x: 0, y: 0 },
      aim: null,
    });
  });

  it('turns without moving inside the inner rim', () => {
    const { move, aim } = readStick(knobAt(0, -STICK_RIMS.inner + 2));
    expect(move).toEqual({ x: 0, y: 0 });
    expect(aim?.x).toBeCloseTo(0);
    expect(aim?.y).toBeCloseTo(-1);
  });

  it('moves and faces the same way past the inner rim', () => {
    const halfway = (STICK_RIMS.inner + STICK_RIMS.outer) / 2;
    const { move, aim } = readStick(knobAt(halfway, 0));
    expect(move.x).toBeCloseTo(0.5);
    expect(move.y).toBeCloseTo(0);
    expect(aim?.x).toBeCloseTo(1);
    expect(aim?.y).toBeCloseTo(0);
  });

  it('reaches full speed at the outer rim', () => {
    expect(readStick(knobAt(-STICK_RIMS.outer, 0)).move).toEqual({
      x: -1,
      y: 0,
    });
  });
});

describe('dragStick', () => {
  it('keeps the ring still inside the outer rim', () => {
    expect(knobAt(30, 0).origin).toEqual(at);
  });

  it('drags the ring along past the outer rim', () => {
    const stick = knobAt(STICK_RIMS.outer + 40, 0);
    expect(stick.origin).toEqual({ x: at.x + 40, y: at.y });
    expect(readStick(stick).move).toEqual({ x: 1, y: 0 });
  });
});

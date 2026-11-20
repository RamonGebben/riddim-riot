import { describe, expect, it } from 'vitest';
import type { Frame } from '../stage';
import { calmFrame } from '.';

const frame = {
  now: 1,
  camera: { x: 10, y: 20 },
  shake: { x: 3, y: -2 },
  kick: 1,
  beat: 1,
  shot: 1,
  hit: 1,
  drop: 1,
  barSeconds: 2,
} as Frame;

describe('calmFrame', () => {
  it('stops the shake and the drop flash', () => {
    const calm = calmFrame(frame);
    expect(calm.shake).toEqual({ x: 0, y: 0 });
    expect(calm.drop).toBe(0);
  });

  it('turns the pulses down without losing the hit', () => {
    const calm = calmFrame(frame);
    expect(calm.kick).toBeLessThan(0.5);
    expect(calm.shot).toBeLessThan(0.5);
    expect(calm.hit).toBeGreaterThan(0);
    expect(calm.hit).toBeLessThan(0.5);
  });

  it('leaves the camera and the beat alone', () => {
    const calm = calmFrame(frame);
    expect(calm.camera).toEqual(frame.camera);
    expect(calm.beat).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';
import {
  clampCamera,
  followCamera,
  screenToWorld,
  shakeOffset,
  worldOffset,
} from '.';

const viewport = { x: 800, y: 600 };

describe('camera', () => {
  it('eases towards its target without overshooting', () => {
    const next = followCamera({ x: 0, y: 0 }, { x: 100, y: 0 }, 1 / 60);
    expect(next.x).toBeGreaterThan(0);
    expect(next.x).toBeLessThan(100);
  });

  it('maps the screen centre to the camera point', () => {
    expect(
      screenToWorld({ x: 400, y: 300 }, { x: 1000, y: 700 }, viewport),
    ).toEqual({
      x: 1000,
      y: 700,
    });
  });

  it('round-trips between screen and world', () => {
    const camera = { x: 1000, y: 700 };
    const world = screenToWorld({ x: 10, y: 20 }, camera, viewport);
    const offset = worldOffset(camera, viewport);
    expect({ x: world.x + offset.x, y: world.y + offset.y }).toEqual({
      x: 10,
      y: 20,
    });
  });
});

describe('shakeOffset', () => {
  it('stays within its strength and is still at zero strength', () => {
    Array.from({ length: 200 }, (_, i) => shakeOffset(i / 60, 8)).forEach(
      ({ x, y }) => {
        expect(Math.abs(x)).toBeLessThanOrEqual(8);
        expect(Math.abs(y)).toBeLessThanOrEqual(8);
      },
    );
    const still = shakeOffset(1.23, 0);
    expect(Math.abs(still.x) + Math.abs(still.y)).toBe(0);
  });
});

describe('clampCamera', () => {
  const world = { width: 3000, height: 2000 };

  it('leaves a camera well inside the level alone', () => {
    expect(clampCamera({ x: 1500, y: 1000 }, viewport, world)).toEqual({
      x: 1500,
      y: 1000,
    });
  });

  it('stops at the level edges', () => {
    expect(clampCamera({ x: 10, y: 1990 }, viewport, world)).toEqual({
      x: 400,
      y: 1700,
    });
  });

  it('centres a level smaller than the screen', () => {
    expect(
      clampCamera({ x: 10, y: 10 }, viewport, { width: 500, height: 400 }),
    ).toEqual({
      x: 250,
      y: 200,
    });
  });
});

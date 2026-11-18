import { add, lerp, scale, subtract, type Vec } from '../../vec';

/** How quickly the camera catches up with its target; higher is tighter. */
const FOLLOW = 10;

/** The camera is the world point at the centre of the screen. */
export const followCamera = (camera: Vec, target: Vec, dt: number): Vec =>
  lerp(camera, target, 1 - Math.exp(-FOLLOW * dt));

export const screenToWorld = (point: Vec, camera: Vec, viewport: Vec): Vec =>
  add(camera, subtract(point, scale(viewport, 0.5)));

/** Where the world container sits so `camera` lands at the screen centre. */
export const worldOffset = (camera: Vec, viewport: Vec): Vec =>
  subtract(scale(viewport, 0.5), camera);

/**
 * Screen shake for an envelope at `time`: a smooth wobble from layered sines
 * (no RNG, so it's the same every run), scaled by `strength` in pixels.
 */
export const shakeOffset = (time: number, strength: number): Vec => ({
  x: (Math.sin(time * 91) + Math.sin(time * 57) * 0.5) * (strength / 1.5),
  y: (Math.sin(time * 77 + 1.3) + Math.sin(time * 43) * 0.5) * (strength / 1.5),
});

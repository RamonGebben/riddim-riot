import { add, lerp, scale, subtract, type Vec } from '../../vec';

/** How quickly the camera catches up with its target; higher is tighter. */
const FOLLOW = 10;

/**
 * The least world, in pixels, the screen's short side shows. A laptop
 * already shows more and plays at 1:1; a phone in landscape (~390 px tall)
 * zooms out to this, so waves come into view before they reach you.
 */
export const MIN_VIEW_PIXELS = 720;

/** World pixels to screen pixels: 1, or less on a small screen. */
export const zoomFor = (screen: Vec): number =>
  Math.min(1, Math.min(screen.x, screen.y) / MIN_VIEW_PIXELS);

/** What a screen shows: its zoom, and how much world fits on it. */
export const viewOf = (screen: Vec): { zoom: number; size: Vec } => {
  const zoom = zoomFor(screen);
  return { zoom, size: scale(screen, 1 / zoom) };
};

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

/**
 * Keep the view inside the level, so the screen never shows past its edge.
 * A level narrower than the screen stays centred on that axis.
 */
export const clampCamera = (
  camera: Vec,
  viewport: Vec,
  world: { width: number; height: number },
): Vec => {
  const axis = (value: number, view: number, size: number) =>
    size <= view
      ? size / 2
      : Math.min(Math.max(value, view / 2), size - view / 2);
  return {
    x: axis(camera.x, viewport.x, world.width),
    y: axis(camera.y, viewport.y, world.height),
  };
};

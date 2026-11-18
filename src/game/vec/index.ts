export interface Vec {
  x: number;
  y: number;
}

export const ZERO: Vec = { x: 0, y: 0 };

export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });

export const subtract = (a: Vec, b: Vec): Vec => ({
  x: a.x - b.x,
  y: a.y - b.y,
});

export const scale = (v: Vec, factor: number): Vec => ({
  x: v.x * factor,
  y: v.y * factor,
});

export const length = (v: Vec): number => Math.hypot(v.x, v.y);

export const normalize = (v: Vec): Vec => {
  const size = length(v);
  return size === 0 ? ZERO : scale(v, 1 / size);
};

/** Move `t` of the way from `a` to `b`. */
export const lerp = (a: Vec, b: Vec, t: number): Vec =>
  add(a, scale(subtract(b, a), t));

export const angleOf = (v: Vec): number => Math.atan2(v.y, v.x);

import { defaultFilterVert, Filter, GlProgram, UniformGroup } from 'pixi.js';
import fragment from './rave.frag?raw';

export interface RaveFilter {
  filter: Filter;
  /** Set this frame's envelopes, 0-1 each. */
  set: (pulses: {
    kick: number;
    shot: number;
    hit: number;
    drop: number;
  }) => void;
}

/**
 * The one fullscreen pass: chromatic aberration, bloom and vignette, all
 * spiking with the kick, a red flash when the player is hit, and a
 * bright palette flash on a drop. WebGL only - the stage asks Pixi for WebGL.
 */
export const createRaveFilter = (): RaveFilter => {
  const uniforms = new UniformGroup({
    uKick: { value: 0, type: 'f32' },
    uShot: { value: 0, type: 'f32' },
    uHit: { value: 0, type: 'f32' },
    uDrop: { value: 0, type: 'f32' },
  });
  const filter = new Filter({
    glProgram: GlProgram.from({
      vertex: defaultFilterVert,
      fragment,
      name: 'rave-filter',
    }),
    resources: { raveUniforms: uniforms },
    // Pixi renders a filter at 1x unless told otherwise; this one covers the
    // whole stage, so at 1x a 3x phone screen shows everything upscaled.
    resolution: 'inherit',
    antialias: 'inherit',
  });

  return {
    filter,
    set: ({ kick, shot, hit, drop }) => {
      uniforms.uniforms.uDrop = drop;
      uniforms.uniforms.uKick = kick;
      uniforms.uniforms.uShot = shot;
      uniforms.uniforms.uHit = hit;
    },
  };
};

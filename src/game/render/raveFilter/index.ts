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

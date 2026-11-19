import type { Graph, Output } from '../graph';

/**
 * Soft-clip saturation that keeps full scale at full scale: 0 passes the
 * signal through untouched, higher amounts round it into tanh, adding the
 * harmonics that let a sine sub read on small speakers. Unlike Tone's
 * `Distortion`, it doesn't turn the level down as it drives.
 */
export const createSaturator = (
  graph: Graph,
  amount: number,
  output: Output,
): WaveShaperNode => {
  const drive = 1 + amount * 10;
  return graph.shaper(
    value => (amount > 0 ? Math.tanh(drive * value) / Math.tanh(drive) : value),
    2048,
    output,
  );
};

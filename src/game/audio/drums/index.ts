import type { DrumsPatch } from '../../sound';
import type { Tick } from '../../clock';
import type { Output } from '../graph';
import { createDrumKit } from './kit';
import { generateDrumBar, hitsAt, type DrumVoice } from './pattern';

export type { DrumBar, DrumVoice } from './pattern';

export interface Drums {
  onTick: (tick: Tick) => void;
  dispose: () => void;
}

export interface DrumHit {
  voice: DrumVoice;
  /** The AudioContext time it plays at. */
  time: number;
  velocity: number;
}

export const createDrums = ({
  seed,
  output,
  kickHz,
  patch,
  onHit,
}: {
  seed: number;
  output: Output;
  kickHz: number;
  patch?: DrumsPatch;
  /** Every scheduled hit, so visuals can land with it. */
  onHit?: (hit: DrumHit) => void;
}): Drums => {
  const kit = createDrumKit(output, kickHz, patch);

  return {
    onTick: tick =>
      hitsAt(generateDrumBar(seed, tick.bar), tick.stepInBar).forEach(
        ({ voice, velocity }) => {
          kit.play(voice, tick.time, velocity);
          onHit?.({ voice, time: tick.time, velocity });
        },
      ),
    dispose: kit.dispose,
  };
};

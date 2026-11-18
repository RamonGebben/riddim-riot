import type { ToneAudioNode } from 'tone';
import type { Tick } from '../../clock';
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

export const createDrums = async ({
  seed,
  output,
  kickHz,
  onHit,
}: {
  seed: number;
  output: ToneAudioNode;
  kickHz: number;
  /** Every scheduled hit, so visuals can land with it. */
  onHit?: (hit: DrumHit) => void;
}): Promise<Drums> => {
  const kit = await createDrumKit(output, kickHz);

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

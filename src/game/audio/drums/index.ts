import type { ToneAudioNode } from 'tone';
import type { Tick } from '../../clock';
import { createDrumKit } from './kit';
import { generateDrumBar, hitsAt } from './pattern';

export type { DrumBar, DrumVoice } from './pattern';

export interface Drums {
  onTick: (tick: Tick) => void;
  dispose: () => void;
}

export const createDrums = async ({
  seed,
  output,
}: {
  seed: number;
  output: ToneAudioNode;
}): Promise<Drums> => {
  const kit = await createDrumKit(output);

  return {
    onTick: tick =>
      hitsAt(generateDrumBar(seed, tick.bar), tick.stepInBar).forEach(
        ({ voice, velocity }) => kit.play(voice, tick.time, velocity),
      ),
    dispose: kit.dispose,
  };
};

import type { DrumStyle } from '../../genre';
import type { DrumsPatch } from '../../sound';
import type { Tick } from '../../clock';
import type { Output } from '../graph';
import { createDrumKit } from './kit';
import {
  generateDrumBar,
  halfSpeedStep,
  hitsAt,
  type DrumVoice,
} from './pattern';

export type { DrumBar, DrumVoice } from './pattern';

export interface Drums {
  onTick: (tick: Tick) => void;
  /**
   * Play at half speed over bars `from` up to `to` (a half-time powerup),
   * or as written again with null.
   */
  halfTime: (bars: { from: number; to: number } | null) => void;
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
  style,
  output,
  kickHz,
  patch,
  onHit,
}: {
  seed: number;
  /** How the level's subgenre plays them; riddim's halftime unless given. */
  style?: DrumStyle;
  output: Output;
  kickHz: number;
  patch?: DrumsPatch;
  /** Every scheduled hit, so visuals can land with it. */
  onHit?: (hit: DrumHit) => void;
}): Drums => {
  const kit = createDrumKit(output, kickHz, patch);
  let half: { from: number; to: number } | null = null;

  return {
    onTick: tick => {
      const slowed =
        half !== null && tick.bar >= half.from && tick.bar < half.to;
      const at = slowed && half ? halfSpeedStep(tick, half.from) : tick;
      if (!at) return;
      hitsAt(generateDrumBar(seed, at.bar, style), at.stepInBar).forEach(
        ({ voice, velocity }) => {
          kit.play(voice, tick.time, velocity);
          onHit?.({ voice, time: tick.time, velocity });
        },
      );
    },
    halfTime: bars => {
      half = bars;
    },
    dispose: kit.dispose,
  };
};

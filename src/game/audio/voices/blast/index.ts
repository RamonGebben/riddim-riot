import {
  Channel,
  Filter,
  Noise,
  Oscillator,
  type ToneAudioNode,
  type Unit,
} from 'tone';
import { SOUND_DESIGN, type BlastPatch } from '../../../sound';
import { createGate } from '../../gate';
import { createSaturator } from '../../saturate';

export interface BlastSound {
  play: (time: number) => void;
  dispose: () => void;
}

/**
 * A crushed shot bursting: a saturated boom dropping onto the root under a
 * low noise blast - heavier and wider than a kill, so area damage reads by
 * ear before the ring clears.
 */
export const createBlastSound = ({
  output,
  root,
  patch = SOUND_DESIGN.blast,
}: {
  output: ToneAudioNode;
  root: Unit.Frequency;
  patch?: BlastPatch;
}): BlastSound => {
  const channel = new Channel({ volume: patch.level }).connect(output);

  const boom = createGate({
    envelope: {
      attack: 0.001,
      decay: patch.boomDecay,
      sustain: 0,
      release: 0.05,
    },
    volume: patch.boomLevel,
    output: channel,
  });
  const saturation = createSaturator(patch.boomSaturation).connect(boom.input);
  const boomOsc = new Oscillator({ type: 'sine' }).connect(saturation).start();
  const boomHz = boomOsc.toFrequency(root);

  const noise = new Noise('brown').start();
  const noiseFilter = new Filter({
    type: 'lowpass',
    frequency: patch.noiseHz,
    rolloff: -24,
  });
  const rush = createGate({
    envelope: {
      attack: 0.002,
      decay: patch.noiseDecay,
      sustain: 0,
      release: 0.05,
    },
    volume: patch.noiseLevel,
    output: channel,
  });
  noise.chain(noiseFilter, rush.input);

  const nodes = [boomOsc, saturation, boom, noise, noiseFilter, rush, channel];

  return {
    play: time => {
      boomOsc.frequency.cancelScheduledValues(time);
      boomOsc.frequency.setValueAtTime(boomHz * patch.boomMultiple, time);
      boomOsc.frequency.exponentialRampToValueAtTime(
        boomHz,
        time + patch.boomSeconds,
      );
      noiseFilter.frequency.cancelScheduledValues(time);
      noiseFilter.frequency.setValueAtTime(patch.noiseHz, time);
      noiseFilter.frequency.exponentialRampToValueAtTime(
        patch.noiseHz / 4,
        time + patch.noiseDecay,
      );
      boom.envelope.triggerAttackRelease(0.05, time);
      rush.envelope.triggerAttackRelease(0.03, time);
    },
    dispose: () => nodes.forEach(node => node.dispose()),
  };
};

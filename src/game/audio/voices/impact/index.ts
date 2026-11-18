import {
  Channel,
  Filter,
  Noise,
  Oscillator,
  type ToneAudioNode,
  type Unit,
} from 'tone';
import { SOUND_DESIGN, type ImpactPatch } from '../../../sound';
import { createGate } from '../../gate';

export interface ImpactSound {
  play: (time: number) => void;
  dispose: () => void;
}

/**
 * A kill: a crunchy noise hit over a sub thump on the root, so a string of
 * kills lands as a percussion line in key rather than random noise.
 */
export const createImpactSound = ({
  output,
  root,
  patch = SOUND_DESIGN.impact,
}: {
  output: ToneAudioNode;
  root: Unit.Frequency;
  patch?: ImpactPatch;
}): ImpactSound => {
  const channel = new Channel({ volume: patch.level }).connect(output);

  const noise = new Noise('pink').start();
  const crunchFilter = new Filter({
    type: 'bandpass',
    frequency: patch.crunchHz,
    Q: patch.crunchQ,
  });
  const crunch = createGate({
    envelope: {
      attack: 0.001,
      decay: patch.crunchDecay,
      sustain: 0,
      release: 0.02,
    },
    volume: patch.crunchLevel,
    output: channel,
  });
  noise.chain(crunchFilter, crunch.input);

  const thumpOsc = new Oscillator({ type: 'sine' }).start();
  const thumpHz = thumpOsc.toFrequency(root);
  thumpOsc.frequency.value = thumpHz;
  const thump = createGate({
    envelope: {
      attack: 0.001,
      decay: patch.thumpDecay,
      sustain: 0,
      release: 0.03,
    },
    volume: patch.thumpLevel,
    output: channel,
  });
  thumpOsc.connect(thump.input);

  const nodes = [noise, crunchFilter, crunch, thumpOsc, thump, channel];

  return {
    play: time => {
      thumpOsc.frequency.cancelScheduledValues(time);
      thumpOsc.frequency.setValueAtTime(thumpHz * patch.thumpMultiple, time);
      thumpOsc.frequency.exponentialRampToValueAtTime(
        thumpHz,
        time + patch.thumpSeconds,
      );
      crunch.envelope.triggerAttackRelease(0.06, time);
      thump.envelope.triggerAttackRelease(0.1, time);
    },
    dispose: () => nodes.forEach(node => node.dispose()),
  };
};

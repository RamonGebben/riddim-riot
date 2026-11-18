import {
  Channel,
  Filter,
  Noise,
  Oscillator,
  type ToneAudioNode,
  type Unit,
} from 'tone';
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
}: {
  output: ToneAudioNode;
  root: Unit.Frequency;
}): ImpactSound => {
  const channel = new Channel({ volume: -9 }).connect(output);

  const noise = new Noise('pink').start();
  const crunchFilter = new Filter({
    type: 'bandpass',
    frequency: 1100,
    Q: 1.2,
  });
  const crunch = createGate({
    envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.02 },
    volume: 2,
    output: channel,
  });
  noise.chain(crunchFilter, crunch.input);

  const thumpOsc = new Oscillator({ type: 'sine' }).start();
  const thumpHz = thumpOsc.toFrequency(root);
  thumpOsc.frequency.value = thumpHz;
  const thump = createGate({
    envelope: { attack: 0.001, decay: 0.22, sustain: 0, release: 0.03 },
    output: channel,
  });
  thumpOsc.connect(thump.input);

  const nodes = [noise, crunchFilter, crunch, thumpOsc, thump, channel];

  return {
    play: time => {
      thumpOsc.frequency.cancelScheduledValues(time);
      thumpOsc.frequency.setValueAtTime(thumpHz * 4, time);
      thumpOsc.frequency.exponentialRampToValueAtTime(thumpHz, time + 0.06);
      crunch.envelope.triggerAttackRelease(0.06, time);
      thump.envelope.triggerAttackRelease(0.1, time);
    },
    dispose: () => nodes.forEach(node => node.dispose()),
  };
};

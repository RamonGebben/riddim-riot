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
import { createSaturator } from '../../saturate';

export interface ImpactSound {
  play: (time: number) => void;
  dispose: () => void;
}

/**
 * A kill: a bright snap and a crunchy noise hit over a saturated body and a
 * sub thump on the root, so a string of kills lands as a percussion line in
 * key rather than random noise.
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

  const snapFilter = new Filter({ type: 'highpass', frequency: patch.snapHz });
  const snap = createGate({
    envelope: {
      attack: 0.001,
      decay: patch.snapDecay,
      sustain: 0,
      release: 0.01,
    },
    volume: patch.snapLevel,
    output: channel,
  });
  noise.chain(snapFilter, snap.input);

  const bodyHz = thumpHz * 2 ** patch.bodyOctave;
  const body = createGate({
    envelope: {
      attack: 0.001,
      decay: patch.bodyDecay,
      sustain: 0,
      release: 0.02,
    },
    volume: patch.bodyLevel,
    output: channel,
  });
  const bodySaturation = createSaturator(patch.bodySaturation).connect(
    body.input,
  );
  const bodyOsc = new Oscillator({ type: 'square', frequency: bodyHz })
    .connect(bodySaturation)
    .start();

  const nodes = [
    noise,
    crunchFilter,
    crunch,
    thumpOsc,
    thump,
    snapFilter,
    snap,
    bodyOsc,
    bodySaturation,
    body,
    channel,
  ];

  return {
    play: time => {
      thumpOsc.frequency.cancelScheduledValues(time);
      thumpOsc.frequency.setValueAtTime(thumpHz * patch.thumpMultiple, time);
      thumpOsc.frequency.exponentialRampToValueAtTime(
        thumpHz,
        time + patch.thumpSeconds,
      );
      bodyOsc.frequency.cancelScheduledValues(time);
      bodyOsc.frequency.setValueAtTime(bodyHz * patch.thumpMultiple, time);
      bodyOsc.frequency.exponentialRampToValueAtTime(
        bodyHz,
        time + patch.thumpSeconds,
      );
      snap.envelope.triggerAttackRelease(0.005, time);
      crunch.envelope.triggerAttackRelease(0.06, time);
      body.envelope.triggerAttackRelease(0.03, time);
      thump.envelope.triggerAttackRelease(0.1, time);
    },
    dispose: () => nodes.forEach(node => node.dispose()),
  };
};

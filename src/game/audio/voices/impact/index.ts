import { Frequency, type Unit } from 'tone';
import { SOUND_DESIGN, type ImpactPatch } from '../../../sound';
import { createGate } from '../../gate';
import { createGraph, type Output } from '../../graph';
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
  output: Output;
  root: Unit.Frequency;
  patch?: ImpactPatch;
}): ImpactSound => {
  const graph = createGraph();
  const channel = graph.channel(patch.level, output);

  const noise = graph.noise('pink');
  const crunch = createGate(graph, {
    envelope: {
      attack: 0.001,
      decay: patch.crunchDecay,
      sustain: 0,
      release: 0.02,
    },
    volume: patch.crunchLevel,
    output: channel,
  });
  noise.connect(
    graph.filter({
      type: 'bandpass',
      frequency: patch.crunchHz,
      Q: patch.crunchQ,
      output: crunch.input,
    }).input,
  );

  const thumpHz = Frequency(root).toFrequency();
  const thump = createGate(graph, {
    envelope: {
      attack: 0.001,
      decay: patch.thumpDecay,
      sustain: 0,
      release: 0.03,
    },
    volume: patch.thumpLevel,
    output: channel,
  });
  const thumpOsc = graph.oscillator(
    { type: 'sine', frequency: thumpHz },
    thump.input,
  );

  const snap = createGate(graph, {
    envelope: {
      attack: 0.001,
      decay: patch.snapDecay,
      sustain: 0,
      release: 0.01,
    },
    volume: patch.snapLevel,
    output: channel,
  });
  noise.connect(
    graph.filter({
      type: 'highpass',
      frequency: patch.snapHz,
      output: snap.input,
    }).input,
  );

  const bodyHz = thumpHz * 2 ** patch.bodyOctave;
  const body = createGate(graph, {
    envelope: {
      attack: 0.001,
      decay: patch.bodyDecay,
      sustain: 0,
      release: 0.02,
    },
    volume: patch.bodyLevel,
    output: channel,
  });
  const bodyOsc = graph.oscillator(
    { type: 'square', frequency: bodyHz },
    createSaturator(graph, patch.bodySaturation, body.input),
  );

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
    dispose: graph.dispose,
  };
};

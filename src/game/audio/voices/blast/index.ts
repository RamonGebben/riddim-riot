import { Frequency, type Unit } from 'tone';
import { SOUND_DESIGN, type BlastPatch } from '../../../sound';
import { createGate } from '../../gate';
import { createGraph, type Output } from '../../graph';
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
  output: Output;
  root: Unit.Frequency;
  patch?: BlastPatch;
}): BlastSound => {
  const graph = createGraph();
  const channel = graph.channel(patch.level, output);

  const boom = createGate(graph, {
    envelope: {
      attack: 0.001,
      decay: patch.boomDecay,
      sustain: 0,
      release: 0.05,
    },
    volume: patch.boomLevel,
    output: channel,
  });
  const boomHz = Frequency(root).toFrequency();
  const boomOsc = graph.oscillator(
    { type: 'sine', frequency: boomHz },
    createSaturator(graph, patch.boomSaturation, boom.input),
  );

  const rush = createGate(graph, {
    envelope: {
      attack: 0.002,
      decay: patch.noiseDecay,
      sustain: 0,
      release: 0.05,
    },
    volume: patch.noiseLevel,
    output: channel,
  });
  const noiseFilter = graph.filter({
    type: 'lowpass',
    frequency: patch.noiseHz,
    rolloff: -24,
    output: rush.input,
  });
  graph.noise('brown').connect(noiseFilter.input);

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
    dispose: graph.dispose,
  };
};

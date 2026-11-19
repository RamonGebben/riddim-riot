import { degreeToMidi, midiToHz, type Key } from '../../../music';
import { MAX_MULTIPLIER } from '../../../sim/combo';
import { SOUND_DESIGN, type ScorePatch } from '../../../sound';
import { createGate } from '../../gate';
import { createGraph, type Output } from '../../graph';

export interface ScoreSound {
  /** Points landing at `time`, from a kill that made the combo `combo`. */
  play: (time: number, combo: number) => void;
  dispose: () => void;
}

/**
 * The score as a melody: each kill in a combo plucks the next scale degree,
 * so a chain climbs a full octave by the top multiplier and a broken one
 * falls back to the root. An echo throws it into the space around the beat.
 */
export const createScoreSound = ({
  output,
  key,
  beatSeconds,
  patch = SOUND_DESIGN.score,
}: {
  output: Output;
  key: Key;
  beatSeconds: number;
  patch?: ScorePatch;
}): ScoreSound => {
  const graph = createGraph();
  const channel = graph.channel(patch.level, output);
  const echo = graph.feedbackDelay(
    {
      delayTime: beatSeconds * patch.echoBeats,
      feedback: patch.echoFeedback,
      wet: patch.echoWet,
    },
    channel,
  );
  const filter = graph.filter({
    type: 'lowpass',
    frequency: patch.brightnessHz,
    output: echo,
  }).input;
  const envelope = {
    attack: 0.002,
    decay: patch.decay,
    sustain: 0,
    release: 0.05,
  };
  const pluck = createGate(graph, { envelope, output: filter });
  const shimmer = createGate(graph, {
    envelope,
    volume: patch.shimmerLevel,
    output: filter,
  });
  const osc = graph.oscillator(
    { type: patch.waveform, frequency: 440 },
    pluck.input,
  );
  const shimmerOsc = graph.oscillator(
    { type: patch.waveform, frequency: 440 },
    shimmer.input,
  );

  return {
    play: (time, combo) => {
      const degree = Math.min(Math.max(combo, 1), MAX_MULTIPLIER) - 1;
      const hz = midiToHz(degreeToMidi(key, degree, patch.octave));
      osc.frequency.setValueAtTime(hz, time);
      shimmerOsc.frequency.setValueAtTime(hz * 2, time);
      pluck.envelope.triggerAttackRelease(0.01, time);
      shimmer.envelope.triggerAttackRelease(0.01, time);
    },
    dispose: graph.dispose,
  };
};

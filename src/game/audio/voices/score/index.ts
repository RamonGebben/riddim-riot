import {
  Channel,
  FeedbackDelay,
  Filter,
  Oscillator,
  type ToneAudioNode,
} from 'tone';
import { degreeToMidi, midiToHz, type Key } from '../../../music';
import { MAX_MULTIPLIER } from '../../../sim/combo';
import { SOUND_DESIGN, type ScorePatch } from '../../../sound';
import { createGate } from '../../gate';

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
  output: ToneAudioNode;
  key: Key;
  beatSeconds: number;
  patch?: ScorePatch;
}): ScoreSound => {
  const channel = new Channel({ volume: patch.level }).connect(output);
  const echo = new FeedbackDelay({
    delayTime: beatSeconds * patch.echoBeats,
    feedback: patch.echoFeedback,
    wet: patch.echoWet,
  }).connect(channel);
  const filter = new Filter({
    type: 'lowpass',
    frequency: patch.brightnessHz,
  }).connect(echo);
  const envelope = {
    attack: 0.002,
    decay: patch.decay,
    sustain: 0,
    release: 0.05,
  };
  const pluck = createGate({ envelope, output: filter });
  const shimmer = createGate({
    envelope,
    volume: patch.shimmerLevel,
    output: filter,
  });
  const osc = new Oscillator({ type: patch.waveform })
    .connect(pluck.input)
    .start();
  const shimmerOsc = new Oscillator({ type: patch.waveform })
    .connect(shimmer.input)
    .start();

  const nodes = [osc, shimmerOsc, pluck, shimmer, filter, echo, channel];

  return {
    play: (time, combo) => {
      const degree = Math.min(Math.max(combo, 1), MAX_MULTIPLIER) - 1;
      const hz = midiToHz(degreeToMidi(key, degree, patch.octave));
      osc.frequency.setValueAtTime(hz, time);
      shimmerOsc.frequency.setValueAtTime(hz * 2, time);
      pluck.envelope.triggerAttackRelease(0.01, time);
      shimmer.envelope.triggerAttackRelease(0.01, time);
    },
    dispose: () => nodes.forEach(node => node.dispose()),
  };
};

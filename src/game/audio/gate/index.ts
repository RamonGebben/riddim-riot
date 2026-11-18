import {
  AmplitudeEnvelope,
  Volume,
  type EnvelopeOptions,
  type ToneAudioNode,
} from 'tone';

export interface Gate {
  /** Connect an always-running source here. */
  input: ToneAudioNode;
  envelope: AmplitudeEnvelope;
  dispose: () => void;
}

/**
 * An envelope gating a source that runs the whole game. Tone's instruments
 * create fresh source nodes on every note, and some of those never get
 * released - the audio graph grows until it crackles. Voices built from
 * gates create no nodes per hit: a hit only reschedules the envelope.
 */
export const createGate = ({
  envelope,
  volume = 0,
  output,
}: {
  envelope: Partial<EnvelopeOptions>;
  /** dB */
  volume?: number;
  output: ToneAudioNode;
}): Gate => {
  const level = new Volume(volume).connect(output);
  const amplitude = new AmplitudeEnvelope(envelope).connect(level);
  return {
    input: amplitude,
    envelope: amplitude,
    dispose: () => {
      amplitude.dispose();
      level.dispose();
    },
  };
};

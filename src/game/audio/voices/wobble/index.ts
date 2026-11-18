import {
  Channel,
  Distortion,
  FatOscillator,
  Filter,
  LFO,
  Oscillator,
  type ToneAudioNode,
  type Unit,
} from 'tone';
import { createGate } from '../../gate';

export interface WobbleVoice {
  fire: (time: number, duration: number) => void;
  dispose: () => void;
}

/**
 * Leaves a sliver of silence between back-to-back shots, so held fire reads
 * as separate "whobs" instead of one smeared note.
 */
const ARTICULATION = 0.9;

/**
 * The hand-tuned wobble: a detuned saw through a resonant low-pass whose
 * cutoff an LFO sweeps once per 1/8. The LFO runs on the Transport, so every
 * shot - landing on the same grid - opens with the same phase. A clean sine
 * sub sits under it, kept out of the distortion so the low end stays tight.
 * Both oscillators run all game and are gated per shot (see `createGate`).
 */
export const createWobbleVoice = ({
  output,
  note,
}: {
  output: ToneAudioNode;
  /** The pitch of the main voice; the sub plays an octave below. */
  note: Unit.Frequency;
}): WobbleVoice => {
  const channel = new Channel({ volume: -10 }).connect(output);
  const drive = new Distortion({ distortion: 0.4, wet: 0.5 }).connect(channel);
  const saw = createGate({
    envelope: { attack: 0.004, decay: 0.05, sustain: 1, release: 0.05 },
    output: drive,
  });
  const wobbleFilter = new Filter({
    type: 'lowpass',
    frequency: 300,
    rolloff: -24,
    Q: 6,
  }).connect(saw.input);
  // Starts at the bottom of its sweep (phase 270), so each shot opens up
  // from closed: "whob", not "bwo".
  const lfo = new LFO({
    frequency: '8n',
    min: 160,
    max: 2400,
    phase: 270,
  }).connect(wobbleFilter.frequency);
  lfo.sync().start(0);

  const sawOsc = new FatOscillator({
    type: 'sawtooth',
    frequency: note,
    count: 3,
    spread: 30,
  })
    .connect(wobbleFilter)
    .start();

  const sub = createGate({
    envelope: { attack: 0.004, decay: 0, sustain: 1, release: 0.05 },
    volume: -6,
    output: channel,
  });
  const subOsc = new Oscillator({
    type: 'sine',
    frequency: sawOsc.toFrequency(note) / 2,
  })
    .connect(sub.input)
    .start();

  const nodes = [sawOsc, subOsc, lfo, wobbleFilter, saw, sub, drive, channel];

  return {
    fire: (time, duration) => {
      const held = duration * ARTICULATION;
      saw.envelope.triggerAttackRelease(held, time);
      sub.envelope.triggerAttackRelease(held, time);
    },
    dispose: () => nodes.forEach(node => node.dispose()),
  };
};

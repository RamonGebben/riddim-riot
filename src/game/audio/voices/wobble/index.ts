import {
  Channel,
  Distortion,
  Filter,
  LFO,
  MonoSynth,
  Synth,
  type Unit,
  type ToneAudioNode,
} from 'tone';

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
  const wobbleFilter = new Filter({
    type: 'lowpass',
    frequency: 300,
    rolloff: -24,
    Q: 6,
  }).connect(drive);
  // Starts at the bottom of its sweep (phase 270), so each shot opens up
  // from closed: "whob", not "bwo".
  const lfo = new LFO({
    frequency: '8n',
    min: 160,
    max: 2400,
    phase: 270,
  }).connect(wobbleFilter.frequency);
  lfo.sync().start(0);

  const saw = new MonoSynth({
    oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
    envelope: { attack: 0.004, decay: 0.05, sustain: 1, release: 0.05 },
    filter: { type: 'lowpass', rolloff: -12, Q: 0 },
    filterEnvelope: {
      attack: 0.001,
      decay: 0.01,
      sustain: 1,
      release: 0.05,
      baseFrequency: 8000,
      octaves: 0,
    },
  }).connect(wobbleFilter);

  const sub = new Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.004, decay: 0, sustain: 1, release: 0.05 },
    volume: -6,
  }).connect(channel);
  const subNote = saw.toFrequency(note) / 2;

  const nodes = [saw, sub, lfo, wobbleFilter, drive, channel];

  return {
    fire: (time, duration) => {
      const held = duration * ARTICULATION;
      saw.triggerAttackRelease(note, held, time);
      sub.triggerAttackRelease(subNote, held, time);
    },
    dispose: () => nodes.forEach(node => node.dispose()),
  };
};

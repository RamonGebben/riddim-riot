import {
  Channel,
  Filter,
  MembraneSynth,
  MetalSynth,
  NoiseSynth,
  Reverb,
  type ToneAudioNode,
} from 'tone';
import type { DrumVoice } from '../pattern';

export interface DrumKit {
  play: (voice: DrumVoice, time: number, velocity: number) => void;
  dispose: () => void;
}

/** A fully synthesized kit - no samples - tuned for halftime at 140. */
export const createDrumKit = async (
  output: ToneAudioNode,
): Promise<DrumKit> => {
  const channel = new Channel({ volume: -4 }).connect(output);

  const kick = new MembraneSynth({
    pitchDecay: 0.045,
    octaves: 5,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.45, sustain: 0, release: 0.05 },
  }).connect(channel);

  const snareRoom = new Reverb({ decay: 1.4, wet: 0.22 }).connect(channel);
  await snareRoom.ready;
  const snareNoise = new NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.02 },
    volume: -6,
  }).connect(new Filter(1800, 'highpass').connect(snareRoom));
  const snareBody = new MembraneSynth({
    pitchDecay: 0.015,
    octaves: 2,
    envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.02 },
    volume: -10,
  }).connect(snareRoom);

  const hatOptions = {
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 5000,
    octaves: 1.5,
  };
  const hat = new MetalSynth({
    ...hatOptions,
    envelope: { attack: 0.001, decay: 0.045, release: 0.01 },
    volume: -24,
  }).connect(channel);
  const openHat = new MetalSynth({
    ...hatOptions,
    envelope: { attack: 0.001, decay: 0.32, release: 0.08 },
    volume: -28,
  }).connect(channel);

  const players: Record<DrumVoice, (time: number, velocity: number) => void> = {
    kick: (time, velocity) =>
      kick.triggerAttackRelease('G1', '8n', time, velocity),
    snare: (time, velocity) => {
      snareNoise.triggerAttackRelease('16n', time, velocity);
      snareBody.triggerAttackRelease('D3', '32n', time, velocity);
    },
    hat: (time, velocity) => {
      // A closed hat chokes a ringing open one, like a real hi-hat.
      openHat.triggerRelease(time);
      hat.triggerAttackRelease(300, '32n', time, velocity);
    },
    openHat: (time, velocity) =>
      openHat.triggerAttackRelease(300, '8n', time, velocity),
  };

  const nodes = [kick, snareNoise, snareBody, snareRoom, hat, openHat, channel];

  return {
    play: (voice, time, velocity) => players[voice](time, velocity),
    dispose: () => nodes.forEach(node => node.dispose()),
  };
};

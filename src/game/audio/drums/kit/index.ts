import {
  Channel,
  Filter,
  Noise,
  Oscillator,
  Reverb,
  type ToneAudioNode,
} from 'tone';
import { createGate } from '../../gate';
import type { DrumVoice } from '../pattern';

export interface DrumKit {
  play: (voice: DrumVoice, time: number, velocity: number) => void;
  dispose: () => void;
}

const KICK_HZ = 49; // G1
const SNARE_BODY_HZ = 147; // D3

/** A pitch that drops from `multiple`× down to `to` - the "boom" in a kick. */
const pitchDrop = (
  oscillator: Oscillator,
  { to, multiple, seconds }: { to: number; multiple: number; seconds: number },
  time: number,
) => {
  oscillator.frequency.cancelScheduledValues(time);
  oscillator.frequency.setValueAtTime(to * multiple, time);
  oscillator.frequency.exponentialRampToValueAtTime(to, time + seconds);
};

/**
 * A fully synthesized kit - no samples - tuned for halftime at 140. Every
 * source runs from the start and is gated per hit (see `createGate`).
 */
export const createDrumKit = async (
  output: ToneAudioNode,
): Promise<DrumKit> => {
  const channel = new Channel({ volume: -4 }).connect(output);
  const noise = new Noise('white').start();

  const kickOsc = new Oscillator({ type: 'sine', frequency: KICK_HZ }).start();
  const kick = createGate({
    envelope: { attack: 0.001, decay: 0.45, sustain: 0, release: 0.05 },
    output: channel,
  });
  kickOsc.connect(kick.input);

  const snareRoom = new Reverb({ decay: 1.4, wet: 0.22 }).connect(channel);
  await snareRoom.ready;
  const snareFilter = new Filter(1800, 'highpass');
  const snareNoise = createGate({
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.02 },
    volume: -6,
    output: snareRoom,
  });
  noise.chain(snareFilter, snareNoise.input);
  const snareOsc = new Oscillator({
    type: 'sine',
    frequency: SNARE_BODY_HZ,
  }).start();
  const snareBody = createGate({
    envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.02 },
    volume: -10,
    output: snareRoom,
  });
  snareOsc.connect(snareBody.input);

  const hatFilter = new Filter(7500, 'highpass');
  const hat = createGate({
    envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.01 },
    volume: -14,
    output: channel,
  });
  noise.chain(hatFilter, hat.input);
  const openHatFilter = new Filter(6000, 'highpass');
  const openHat = createGate({
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.06 },
    volume: -19,
    output: channel,
  });
  noise.chain(openHatFilter, openHat.input);

  const players: Record<DrumVoice, (time: number, velocity: number) => void> = {
    kick: (time, velocity) => {
      pitchDrop(kickOsc, { to: KICK_HZ, multiple: 5, seconds: 0.045 }, time);
      kick.envelope.triggerAttackRelease(0.2, time, velocity);
    },
    snare: (time, velocity) => {
      pitchDrop(
        snareOsc,
        { to: SNARE_BODY_HZ, multiple: 2, seconds: 0.015 },
        time,
      );
      snareNoise.envelope.triggerAttackRelease(0.1, time, velocity);
      snareBody.envelope.triggerAttackRelease(0.05, time, velocity);
    },
    hat: (time, velocity) => {
      // A closed hat chokes a ringing open one, like a real hi-hat.
      openHat.envelope.triggerRelease(time);
      hat.envelope.triggerAttackRelease(0.02, time, velocity);
    },
    openHat: (time, velocity) =>
      openHat.envelope.triggerAttackRelease(0.2, time, velocity),
  };

  const nodes = [
    noise,
    kickOsc,
    snareOsc,
    snareFilter,
    snareRoom,
    hatFilter,
    openHatFilter,
    channel,
    kick,
    snareNoise,
    snareBody,
    hat,
    openHat,
  ];

  return {
    play: (voice, time, velocity) => players[voice](time, velocity),
    dispose: () => nodes.forEach(node => node.dispose()),
  };
};

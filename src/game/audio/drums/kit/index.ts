import {
  Channel,
  Filter,
  Noise,
  Oscillator,
  Reverb,
  type ToneAudioNode,
} from 'tone';
import { SOUND_DESIGN, type DrumsPatch } from '../../../sound';
import { createGate } from '../../gate';
import type { DrumVoice } from '../pattern';

export interface DrumKit {
  play: (voice: DrumVoice, time: number, velocity: number) => void;
  dispose: () => void;
}

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
  /** The kick's fundamental - tuned to the level's root. */
  kickHz: number,
  patch: DrumsPatch = SOUND_DESIGN.drums,
): Promise<DrumKit> => {
  const { kick: k, snare: s, hat: h, openHat: o } = patch;
  const channel = new Channel({ volume: patch.level }).connect(output);
  const noise = new Noise('white').start();

  const kickOsc = new Oscillator({ type: 'sine', frequency: kickHz }).start();
  const kick = createGate({
    envelope: { attack: 0.001, decay: k.decay, sustain: 0, release: 0.05 },
    volume: k.level,
    output: channel,
  });
  kickOsc.connect(kick.input);

  const snareRoom = new Reverb({ decay: s.roomDecay, wet: s.roomWet }).connect(
    channel,
  );
  await snareRoom.ready;
  const snareFilter = new Filter(s.noiseHz, 'highpass');
  const snareNoise = createGate({
    envelope: { attack: 0.001, decay: s.noiseDecay, sustain: 0, release: 0.02 },
    volume: s.noiseLevel,
    output: snareRoom,
  });
  noise.chain(snareFilter, snareNoise.input);
  const snareOsc = new Oscillator({
    type: 'sine',
    frequency: s.bodyHz,
  }).start();
  const snareBody = createGate({
    envelope: { attack: 0.001, decay: s.bodyDecay, sustain: 0, release: 0.02 },
    volume: s.bodyLevel,
    output: snareRoom,
  });
  snareOsc.connect(snareBody.input);

  const hatFilter = new Filter(h.hz, 'highpass');
  const hat = createGate({
    envelope: { attack: 0.001, decay: h.decay, sustain: 0, release: 0.01 },
    volume: h.level,
    output: channel,
  });
  noise.chain(hatFilter, hat.input);
  const openHatFilter = new Filter(o.hz, 'highpass');
  const openHat = createGate({
    envelope: { attack: 0.001, decay: o.decay, sustain: 0, release: 0.06 },
    volume: o.level,
    output: channel,
  });
  noise.chain(openHatFilter, openHat.input);

  const players: Record<DrumVoice, (time: number, velocity: number) => void> = {
    kick: (time, velocity) => {
      pitchDrop(
        kickOsc,
        { to: kickHz, multiple: k.pitchMultiple, seconds: k.pitchSeconds },
        time,
      );
      kick.envelope.triggerAttackRelease(0.2, time, velocity);
    },
    snare: (time, velocity) => {
      pitchDrop(snareOsc, { to: s.bodyHz, multiple: 2, seconds: 0.015 }, time);
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

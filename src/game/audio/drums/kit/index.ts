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

const CLAP_STRIKES = [0, 0.011, 0.022];

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
  const kickClickFilter = new Filter({
    type: 'bandpass',
    frequency: k.clickHz,
  });
  const kickClick = createGate({
    envelope: { attack: 0.001, decay: k.clickDecay, sustain: 0, release: 0.01 },
    volume: k.clickLevel,
    output: channel,
  });
  noise.chain(kickClickFilter, kickClick.input);
  // The tail rides the same oscillator: a second sine would drift out of
  // phase with the punch and cancel it on some hits.
  const kickSub = createGate({
    envelope: { attack: 0.004, decay: k.subDecay, sustain: 0, release: 0.05 },
    volume: k.subLevel,
    output: channel,
  });
  kickOsc.connect(kickSub.input);

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
  const clapFilter = new Filter({ type: 'bandpass', frequency: s.clapHz });
  const clap = createGate({
    envelope: { attack: 0.001, decay: s.clapDecay, sustain: 0, release: 0.02 },
    volume: s.clapLevel,
    output: snareRoom,
  });
  noise.chain(clapFilter, clap.input);

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
      kickClick.envelope.triggerAttackRelease(0.004, time, velocity);
      kickSub.envelope.triggerAttackRelease(0.2, time, velocity);
    },
    snare: (time, velocity) => {
      pitchDrop(snareOsc, { to: s.bodyHz, multiple: 2, seconds: 0.015 }, time);
      snareNoise.envelope.triggerAttackRelease(0.1, time, velocity);
      snareBody.envelope.triggerAttackRelease(0.05, time, velocity);
      // A clap is a few hands a hair apart: three quick strikes, the last
      // left to ring.
      CLAP_STRIKES.forEach((offset, strike) =>
        clap.envelope.triggerAttackRelease(
          strike < CLAP_STRIKES.length - 1 ? 0.004 : 0.02,
          time + offset,
          velocity,
        ),
      );
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
    kickClickFilter,
    snareOsc,
    clapFilter,
    snareFilter,
    snareRoom,
    hatFilter,
    openHatFilter,
    channel,
    kick,
    kickClick,
    kickSub,
    clap,
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

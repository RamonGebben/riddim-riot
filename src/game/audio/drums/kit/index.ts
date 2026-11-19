import { SOUND_DESIGN, type DrumsPatch } from '../../../sound';
import { createGate } from '../../gate';
import { createGraph, type Automation, type Output } from '../../graph';
import { createSaturator } from '../../saturate';
import type { DrumVoice } from '../pattern';

export interface DrumKit {
  play: (voice: DrumVoice, time: number, velocity: number) => void;
  dispose: () => void;
}

const CLAP_STRIKES = [0, 0.011, 0.022];

/** A pitch that drops from `multiple`× down to `to` - the "boom" in a kick. */
const pitchDrop = (
  frequency: Automation,
  { to, multiple, seconds }: { to: number; multiple: number; seconds: number },
  time: number,
) => {
  frequency.cancelScheduledValues(time);
  frequency.setValueAtTime(to * multiple, time);
  frequency.exponentialRampToValueAtTime(to, time + seconds);
};

/**
 * A fully synthesized kit - no samples - tuned for halftime at 140. Every
 * source runs from the start and is gated per hit (see `createGate`).
 */
export const createDrumKit = (
  output: Output,
  /** The kick's fundamental - tuned to the level's root. */
  kickHz: number,
  patch: DrumsPatch = SOUND_DESIGN.drums,
): DrumKit => {
  const { kick: k, snare: s, hat: h, openHat: o } = patch;
  const graph = createGraph();
  // Kit → drive → glue: soft-clipped together and squeezed, so the hits
  // land as one heavy kit instead of thin separate layers.
  const glue = graph.compressor(
    { threshold: patch.glueThreshold, ratio: patch.glueRatio, release: 0.12 },
    output,
  );
  const channel = graph.channel(
    patch.level,
    createSaturator(graph, patch.drive, glue),
  );
  const noise = graph.noise('white');

  const kickDrive = createSaturator(graph, k.drive, channel);
  const kick = createGate(graph, {
    envelope: { attack: 0.001, decay: k.decay, sustain: 0, release: 0.05 },
    volume: k.level,
    output: kickDrive,
  });
  // The tail rides the same oscillator: a second sine would drift out of
  // phase with the punch and cancel it on some hits.
  const kickSub = createGate(graph, {
    envelope: { attack: 0.004, decay: k.subDecay, sustain: 0, release: 0.05 },
    volume: k.subLevel,
    output: kickDrive,
  });
  const kickOsc = graph.oscillator(
    { type: 'sine', frequency: kickHz },
    kick.input,
  );
  kickOsc.node.connect(kickSub.input);
  const kickKnock = createGate(graph, {
    envelope: { attack: 0.001, decay: k.knockDecay, sustain: 0, release: 0.02 },
    volume: k.knockLevel,
    output: kickDrive,
  });
  const knockOsc = graph.oscillator(
    { type: 'triangle', frequency: kickHz * 2 },
    kickKnock.input,
  );
  const kickClick = createGate(graph, {
    envelope: { attack: 0.001, decay: k.clickDecay, sustain: 0, release: 0.01 },
    volume: k.clickLevel,
    output: channel,
  });
  noise.connect(
    graph.filter({
      type: 'bandpass',
      frequency: k.clickHz,
      output: kickClick.input,
    }).input,
  );

  const snareRoom = createSaturator(
    graph,
    s.drive,
    graph.reverb({ decay: s.roomDecay, wet: s.roomWet }, channel),
  );
  const snareNoise = createGate(graph, {
    envelope: { attack: 0.001, decay: s.noiseDecay, sustain: 0, release: 0.02 },
    volume: s.noiseLevel,
    output: snareRoom,
  });
  noise.connect(
    graph.filter({
      type: 'highpass',
      frequency: s.noiseHz,
      output: snareNoise.input,
    }).input,
  );
  const snareBody = createGate(graph, {
    envelope: { attack: 0.001, decay: s.bodyDecay, sustain: 0, release: 0.02 },
    volume: s.bodyLevel,
    output: snareRoom,
  });
  const snareOsc = graph.oscillator(
    { type: 'sine', frequency: s.bodyHz },
    snareBody.input,
  );
  const clap = createGate(graph, {
    envelope: { attack: 0.001, decay: s.clapDecay, sustain: 0, release: 0.02 },
    volume: s.clapLevel,
    output: snareRoom,
  });
  noise.connect(
    graph.filter({ type: 'bandpass', frequency: s.clapHz, output: clap.input })
      .input,
  );

  const hat = createGate(graph, {
    envelope: { attack: 0.001, decay: h.decay, sustain: 0, release: 0.01 },
    volume: h.level,
    output: channel,
  });
  noise.connect(
    graph.filter({ type: 'highpass', frequency: h.hz, output: hat.input })
      .input,
  );
  const openHat = createGate(graph, {
    envelope: { attack: 0.001, decay: o.decay, sustain: 0, release: 0.06 },
    volume: o.level,
    output: channel,
  });
  noise.connect(
    graph.filter({ type: 'highpass', frequency: o.hz, output: openHat.input })
      .input,
  );

  const players: Record<DrumVoice, (time: number, velocity: number) => void> = {
    kick: (time, velocity) => {
      pitchDrop(
        kickOsc.frequency,
        { to: kickHz, multiple: k.pitchMultiple, seconds: k.pitchSeconds },
        time,
      );
      kick.envelope.triggerAttackRelease(0.2, time, velocity);
      pitchDrop(
        knockOsc.frequency,
        {
          to: kickHz * 2,
          multiple: k.pitchMultiple / 2,
          seconds: k.pitchSeconds,
        },
        time,
      );
      kickKnock.envelope.triggerAttackRelease(0.02, time, velocity);
      kickClick.envelope.triggerAttackRelease(0.004, time, velocity);
      kickSub.envelope.triggerAttackRelease(0.2, time, velocity);
    },
    snare: (time, velocity) => {
      pitchDrop(
        snareOsc.frequency,
        { to: s.bodyHz, multiple: 2, seconds: 0.015 },
        time,
      );
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

  return {
    play: (voice, time, velocity) => players[voice](time, velocity),
    dispose: graph.dispose,
  };
};

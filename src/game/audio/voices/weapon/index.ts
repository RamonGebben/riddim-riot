import {
  Channel,
  Distortion,
  FatOscillator,
  FeedbackDelay,
  Filter,
  Gain,
  LFO,
  Oscillator,
  type ToneAudioNode,
} from 'tone';
import { midiToHz } from '../../../music';
import type { LfoPart, WeaponSound } from '../../../weapons';
import { createGate, type Gate } from '../../gate';

export interface WeaponVoice {
  fire: (time: number, duration: number, shot: number) => void;
  /** Fade the tail out while the next weapon comes in. */
  holster: (time: number) => void;
  equip: (time: number) => void;
  /**
   * Only one voice owns the sub; the others are high-passed so layered
   * weapons don't turn to mud.
   */
  setSubOwner: (owner: boolean, time: number) => void;
  dispose: () => void;
}

/** Leaves a sliver of silence between back-to-back shots. */
const ARTICULATION = 0.9;
const HOLSTER_FADE_SECONDS = 0.35;
const SUB_CUT_HZ = 180;
const LFO_RATE = { '1/4': '4n', '1/8': '8n', '1/16': '16n' } satisfies Record<
  LfoPart,
  string
>;

interface Engine {
  output: ToneAudioNode;
  play: (time: number, duration: number, hz: number) => void;
  nodes: Array<{ dispose: () => void }>;
}

/**
 * Wobble: a detuned oscillator through a resonant low-pass that a
 * Transport-synced LFO sweeps at the rolled rate, so every shot - landing on
 * the grid - opens with the same phase. A clean sine sub sits under it.
 */
const createWobble = (sound: WeaponSound): Engine => {
  const output = new Gain();
  const gate = createGate({
    envelope: { attack: 0.004, decay: 0.05, sustain: 1, release: 0.05 },
    output,
  });
  const filter = new Filter({
    type: 'lowpass',
    frequency: 300,
    rolloff: -24,
    Q: sound.resonance,
  }).connect(gate.input);
  // Phase 270 starts each sweep closed: "whob", not "bwo".
  const lfo = new LFO({
    frequency: LFO_RATE[sound.lfo],
    min: 160,
    max: sound.cutoff,
    phase: 270,
  }).connect(filter.frequency);
  lfo.sync().start(0);
  const osc = new FatOscillator({
    type: sound.waveform,
    frequency: midiToHz(sound.riff[0]),
    count: 3,
    spread: 30,
  })
    .connect(filter)
    .start();

  const sub: Gate = createGate({
    envelope: { attack: 0.004, decay: 0, sustain: 1, release: 0.05 },
    volume: -6,
    output,
  });
  const subOsc = new Oscillator({
    type: 'sine',
    frequency: midiToHz(sound.riff[0]) / 2,
  })
    .connect(sub.input)
    .start();

  return {
    output,
    play: (time, duration, hz) => {
      osc.frequency.setValueAtTime(hz, time);
      subOsc.frequency.setValueAtTime(hz / 2, time);
      gate.envelope.triggerAttackRelease(duration, time);
      sub.envelope.triggerAttackRelease(duration, time);
    },
    nodes: [osc, subOsc, lfo, filter, gate, sub, output],
  };
};

/**
 * Laser: a bright "pew" - each shot's pitch drops two octaves onto the riff
 * note - with the LFO shimmering the filter. No sub; it lives up top.
 */
const createLaser = (sound: WeaponSound): Engine => {
  const output = new Gain();
  const gate = createGate({
    envelope: { attack: 0.002, decay: 0.12, sustain: 0.35, release: 0.05 },
    output,
  });
  const filter = new Filter({
    type: 'lowpass',
    frequency: sound.cutoff,
    rolloff: -12,
    Q: sound.resonance,
  }).connect(gate.input);
  const lfo = new LFO({
    frequency: LFO_RATE[sound.lfo],
    min: sound.cutoff * 0.45,
    max: sound.cutoff,
  }).connect(filter.frequency);
  lfo.sync().start(0);
  const osc = new Oscillator({
    type: sound.waveform,
    frequency: midiToHz(sound.riff[0]),
  })
    .connect(filter)
    .start();

  return {
    output,
    play: (time, duration, hz) => {
      osc.frequency.cancelScheduledValues(time);
      osc.frequency.setValueAtTime(hz * 4, time);
      osc.frequency.exponentialRampToValueAtTime(hz, time + 0.07);
      gate.envelope.triggerAttackRelease(duration, time);
    },
    nodes: [osc, lfo, filter, gate, output],
  };
};

/**
 * A rolled weapon's voice, built once and gated per shot: engine → drive →
 * echo → sub high-pass → holster fade → channel at `volume` (see
 * `measureWeaponLoudness` for picking it).
 */
export const createWeaponVoice = ({
  output,
  sound,
  beatSeconds,
  volume = 0,
}: {
  output: ToneAudioNode;
  sound: WeaponSound;
  beatSeconds: number;
  /** dB */
  volume?: number;
}): WeaponVoice => {
  const channel = new Channel({ volume }).connect(output);
  const fade = new Gain(1).connect(channel);
  const subCut = new Filter({ type: 'highpass', frequency: 20 }).connect(fade);
  const delay = sound.delay
    ? new FeedbackDelay({
        delayTime: beatSeconds / 2,
        feedback: sound.delay.feedback,
        wet: sound.delay.wet,
      }).connect(subCut)
    : null;
  const afterDrive = delay ?? subCut;
  const drive =
    sound.drive > 0
      ? new Distortion({ distortion: sound.drive, wet: 0.6 }).connect(
          afterDrive,
        )
      : null;
  const engine =
    sound.oscillator === 'wobble' ? createWobble(sound) : createLaser(sound);
  engine.output.connect(drive ?? afterDrive);

  const nodes = [
    ...engine.nodes,
    ...[drive, delay].filter(node => node !== null),
    subCut,
    fade,
    channel,
  ];

  return {
    fire: (time, duration, shot) => {
      const note = sound.riff[shot % sound.riff.length];
      engine.play(time, duration * ARTICULATION, midiToHz(note));
    },
    holster: time => {
      fade.gain.cancelScheduledValues(time);
      fade.gain.rampTo(0, HOLSTER_FADE_SECONDS, time);
    },
    equip: time => {
      fade.gain.cancelScheduledValues(time);
      fade.gain.rampTo(1, 0.01, time);
    },
    setSubOwner: (owner, time) => {
      subCut.frequency.rampTo(owner ? 20 : SUB_CUT_HZ, 0.05, time);
    },
    dispose: () => nodes.forEach(node => node.dispose()),
  };
};

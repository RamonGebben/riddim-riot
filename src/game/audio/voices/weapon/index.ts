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
import {
  SOUND_DESIGN,
  type LaserPatch,
  type SoundDesign,
  type WobblePatch,
} from '../../../sound';
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
const createWobble = (sound: WeaponSound, patch: WobblePatch): Engine => {
  const output = new Gain();
  const gate = createGate({ envelope: patch.envelope, output });
  const filter = new Filter({
    type: 'lowpass',
    frequency: 300,
    rolloff: patch.rolloff,
    Q: sound.resonance,
  }).connect(gate.input);
  // A phase of 270 starts each sweep closed: "whob", not "bwo".
  const lfo = new LFO({
    frequency: LFO_RATE[sound.lfo],
    min: patch.sweepFloor,
    max: sound.cutoff,
    phase: patch.phase,
  }).connect(filter.frequency);
  lfo.sync().start(0);
  const osc = new FatOscillator({
    type: sound.waveform,
    frequency: midiToHz(sound.riff[0]),
    count: patch.voices,
    spread: patch.spread,
  })
    .connect(filter)
    .start();

  const sub: Gate = createGate({
    envelope: {
      attack: patch.envelope.attack,
      decay: 0,
      sustain: 1,
      release: patch.subRelease,
    },
    volume: patch.subLevel,
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
const createLaser = (sound: WeaponSound, patch: LaserPatch): Engine => {
  const output = new Gain();
  const gate = createGate({ envelope: patch.envelope, output });
  const filter = new Filter({
    type: 'lowpass',
    frequency: sound.cutoff,
    rolloff: patch.rolloff,
    Q: sound.resonance,
  }).connect(gate.input);
  const lfo = new LFO({
    frequency: LFO_RATE[sound.lfo],
    min: sound.cutoff * patch.shimmerDepth,
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
      osc.frequency.setValueAtTime(hz * patch.pitchDrop, time);
      osc.frequency.exponentialRampToValueAtTime(
        hz,
        time + patch.pitchDropSeconds,
      );
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
  design = SOUND_DESIGN,
}: {
  output: ToneAudioNode;
  sound: WeaponSound;
  beatSeconds: number;
  /** dB */
  volume?: number;
  design?: SoundDesign;
}): WeaponVoice => {
  const mix = design.weaponMix;
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
      ? new Distortion({ distortion: sound.drive, wet: mix.driveWet }).connect(
          afterDrive,
        )
      : null;
  const engine =
    sound.oscillator === 'wobble'
      ? createWobble(sound, design.wobble)
      : createLaser(sound, design.laser);
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
      engine.play(time, duration * mix.articulation, midiToHz(note));
    },
    holster: time => {
      fade.gain.cancelScheduledValues(time);
      fade.gain.rampTo(0, mix.holsterFadeSeconds, time);
    },
    equip: time => {
      fade.gain.cancelScheduledValues(time);
      fade.gain.rampTo(1, 0.01, time);
    },
    setSubOwner: (owner, time) => {
      subCut.frequency.rampTo(owner ? 20 : mix.subCutHz, 0.05, time);
    },
    dispose: () => nodes.forEach(node => node.dispose()),
  };
};

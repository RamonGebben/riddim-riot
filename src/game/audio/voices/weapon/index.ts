import {
  Channel,
  Compressor,
  Distortion,
  FatOscillator,
  FeedbackDelay,
  Filter,
  Gain,
  LFO,
  Noise,
  Oscillator,
  Volume,
  type Signal,
  type ToneAudioNode,
} from 'tone';
import { midiToHz } from '../../../music';
import {
  SOUND_DESIGN,
  type EnvelopePatch,
  type LaserPatch,
  type SoundDesign,
  type WeaponLayersPatch,
  type WobblePatch,
} from '../../../sound';
import type { LfoPart, WeaponSound } from '../../../weapons';
import { createGate } from '../../gate';
import { createSaturator } from '../../saturate';

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
  /** Everything above the crossover, for the drive and echo. */
  output: ToneAudioNode;
  /** The clean sub, kept out of the drive and echo. */
  sub: ToneAudioNode;
  play: (time: number, duration: number, hz: number) => void;
  nodes: Array<{ dispose: () => void }>;
}

/** How an engine moves an oscillator onto a shot's note. */
type SetPitch = (
  frequency: Signal<'frequency'>,
  hz: number,
  time: number,
) => void;

const jump: SetPitch = (frequency, hz, time) =>
  frequency.setValueAtTime(hz, time);

/**
 * The layers around an engine's body (see `WeaponLayersPatch`). The stack
 * feeds the body's own filter so the wobble sweeps it too; the growl gets a
 * band-pass swept by a twin of the body's LFO.
 */
const createLayers = ({
  sound,
  patch,
  envelope,
  phase,
  body,
  output,
  sub: subOutput,
}: {
  sound: WeaponSound;
  patch: WeaponLayersPatch;
  envelope: EnvelopePatch;
  /** The body LFO's phase, so the growl opens with it. */
  phase: number;
  /** The body's filter input. */
  body: ToneAudioNode;
  output: ToneAudioNode;
  sub: ToneAudioNode;
}) => {
  const hz = midiToHz(sound.riff[0]);

  const subLevel = new Volume(patch.sub.level).connect(subOutput);
  const subSaturation = createSaturator(patch.sub.saturation).connect(subLevel);
  const sub = createGate({
    envelope: {
      attack: envelope.attack,
      decay: 0,
      sustain: 1,
      release: patch.sub.release,
    },
    output: subSaturation,
  });
  const subOsc = new Oscillator({
    type: 'sine',
    frequency: hz / 2 ** patch.sub.octavesDown,
  })
    .connect(sub.input)
    .start();

  const stackLevel = new Volume(patch.stack.level).connect(body);
  const stack = new FatOscillator({
    type: sound.waveform,
    frequency: hz * 2 ** patch.stack.octave,
    count: 2,
    spread: patch.stack.detune,
  })
    .connect(stackLevel)
    .start();

  const growl = createGate({ envelope, volume: patch.growl.level, output });
  const growlSaturation = createSaturator(patch.growl.saturation).connect(
    growl.input,
  );
  const growlFilter = new Filter({
    type: 'bandpass',
    frequency: patch.growl.floorHz,
    Q: patch.growl.q,
  }).connect(growlSaturation);
  const growlLfo = new LFO({
    frequency: LFO_RATE[sound.lfo],
    min: patch.growl.floorHz,
    max: Math.max(sound.cutoff * patch.growl.peak, patch.growl.floorHz),
    phase,
  }).connect(growlFilter.frequency);
  growlLfo.sync().start(0);
  const growlOsc = new Oscillator({
    type: 'square',
    frequency: hz * 2 ** patch.growl.octave,
  })
    .connect(growlFilter)
    .start();

  const click = createGate({
    envelope: {
      attack: 0.001,
      decay: patch.click.decay,
      sustain: 0,
      release: 0.01,
    },
    volume: patch.click.level,
    output,
  });
  const clickFilter = new Filter({
    type: 'bandpass',
    frequency: patch.click.hz,
  }).connect(click.input);
  const clickNoise = new Noise('white').connect(clickFilter).start();

  return {
    play: (time: number, duration: number, note: number, pitch: SetPitch) => {
      subOsc.frequency.setValueAtTime(note / 2 ** patch.sub.octavesDown, time);
      pitch(stack.frequency, note * 2 ** patch.stack.octave, time);
      pitch(growlOsc.frequency, note * 2 ** patch.growl.octave, time);
      sub.envelope.triggerAttackRelease(duration, time);
      growl.envelope.triggerAttackRelease(duration, time);
      click.envelope.triggerAttackRelease(0.005, time);
    },
    nodes: [
      subOsc,
      sub,
      subSaturation,
      subLevel,
      stack,
      stackLevel,
      growlOsc,
      growlLfo,
      growlFilter,
      growlSaturation,
      growl,
      clickNoise,
      clickFilter,
      click,
    ],
  };
};

/** The body's gate, behind a high-pass so it leaves the lows to the sub. */
const createBody = (
  envelope: EnvelopePatch,
  layers: WeaponLayersPatch,
  output: ToneAudioNode,
) => {
  const gate = createGate({ envelope, output });
  const crossover = new Filter({
    type: 'highpass',
    frequency: layers.crossoverHz,
  }).connect(gate.input);
  return { gate, crossover };
};

/**
 * Wobble: a detuned oscillator through a resonant low-pass that a
 * Transport-synced LFO sweeps at the rolled rate, so every shot - landing on
 * the grid - opens with the same phase. The layers sit around it.
 */
const createWobble = (sound: WeaponSound, patch: WobblePatch): Engine => {
  const output = new Gain();
  const subOutput = new Gain();
  const { gate, crossover } = createBody(patch.envelope, patch.layers, output);
  const filter = new Filter({
    type: 'lowpass',
    frequency: 300,
    rolloff: patch.rolloff,
    Q: sound.resonance,
  }).connect(crossover);
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
  const layers = createLayers({
    sound,
    patch: patch.layers,
    envelope: patch.envelope,
    phase: patch.phase,
    body: filter,
    output,
    sub: subOutput,
  });

  return {
    output,
    sub: subOutput,
    play: (time, duration, hz) => {
      osc.frequency.setValueAtTime(hz, time);
      gate.envelope.triggerAttackRelease(duration, time);
      layers.play(time, duration, hz, jump);
    },
    nodes: [
      osc,
      lfo,
      filter,
      crossover,
      gate,
      ...layers.nodes,
      output,
      subOutput,
    ],
  };
};

/**
 * Laser: a bright "pew" - each shot's pitch drops onto the riff note - with
 * the LFO shimmering the filter. Its sub sits well below the pew.
 */
const createLaser = (sound: WeaponSound, patch: LaserPatch): Engine => {
  const output = new Gain();
  const subOutput = new Gain();
  const { gate, crossover } = createBody(patch.envelope, patch.layers, output);
  const filter = new Filter({
    type: 'lowpass',
    frequency: sound.cutoff,
    rolloff: patch.rolloff,
    Q: sound.resonance,
  }).connect(crossover);
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
  const layers = createLayers({
    sound,
    patch: patch.layers,
    envelope: patch.envelope,
    phase: 0,
    body: filter,
    output,
    sub: subOutput,
  });
  const pew: SetPitch = (frequency, hz, time) => {
    frequency.cancelScheduledValues(time);
    frequency.setValueAtTime(hz * patch.pitchDrop, time);
    frequency.exponentialRampToValueAtTime(hz, time + patch.pitchDropSeconds);
  };

  return {
    output,
    sub: subOutput,
    play: (time, duration, hz) => {
      pew(osc.frequency, hz, time);
      gate.envelope.triggerAttackRelease(duration, time);
      layers.play(time, duration, hz, pew);
    },
    nodes: [
      osc,
      lfo,
      filter,
      crossover,
      gate,
      ...layers.nodes,
      output,
      subOutput,
    ],
  };
};

/**
 * A rolled weapon's voice, built once and gated per shot: engine → drive →
 * echo, joined by the clean sub → sub high-pass → holster fade → glue →
 * channel at `volume` (see `measureWeaponLoudness` for picking it).
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
  const glue = new Compressor({
    threshold: mix.glueThreshold,
    ratio: mix.glueRatio,
  }).connect(channel);
  const fade = new Gain(1).connect(glue);
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
  engine.sub.connect(subCut);

  const nodes = [
    ...engine.nodes,
    ...[drive, delay].filter(node => node !== null),
    subCut,
    fade,
    glue,
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

import { STEPS_PER_BEAT } from '../../../grid';
import { midiToHz } from '../../../music';
import {
  SOUND_DESIGN,
  type BeamPatch,
  type EnvelopePatch,
  type LaserPatch,
  type SoundDesign,
  type WeaponLayersPatch,
  type WobblePatch,
} from '../../../sound';
import type { LfoPart, WeaponSound } from '../../../weapons';
import { createGate } from '../../gate';
import {
  createGraph,
  type Automation,
  type Filter,
  type Graph,
  type Output,
} from '../../graph';
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

const LFO_RATE = {
  '1/2': '2n',
  '1/4': '4n',
  '1/8': '8n',
  '1/16': '16n',
} satisfies Record<LfoPart, string>;

interface Engine {
  play: (time: number, duration: number, hz: number) => void;
  /** Held across shots (a beam): give it each shot's full slot. */
  continuous?: boolean;
}

/** Where an engine plays into. */
interface EngineOutputs {
  /** Everything above the crossover, for the drive and echo. */
  output: Output;
  /** The clean sub, kept out of the drive and echo. */
  sub: Output;
}

/** How an engine moves an oscillator onto a shot's note. */
type SetPitch = (frequency: Automation, hz: number, time: number) => void;

const jump: SetPitch = (frequency, hz, time) =>
  frequency.setValueAtTime(hz, time);

/**
 * The layers around an engine's body (see `WeaponLayersPatch`). The stack
 * feeds the body's own filter so the wobble sweeps it too; the growl gets a
 * band-pass swept by a twin of the body's LFO.
 */
const createLayers = (
  graph: Graph,
  {
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
    body: Output;
  } & EngineOutputs,
) => {
  const hz = midiToHz(sound.riff[0]);

  const sub = createGate(graph, {
    envelope: {
      attack: envelope.attack,
      decay: 0,
      sustain: 1,
      release: patch.sub.release,
    },
    output: createSaturator(
      graph,
      patch.sub.saturation,
      graph.volume(patch.sub.level, subOutput),
    ),
  });
  const subOsc = graph.oscillator(
    { type: 'sine', frequency: hz / 2 ** patch.sub.octavesDown },
    sub.input,
  );

  const stack = graph.fatOscillator(
    {
      type: sound.waveform,
      frequency: hz * 2 ** patch.stack.octave,
      count: 2,
      spread: patch.stack.detune,
    },
    graph.volume(patch.stack.level, body),
  );

  const growl = createGate(graph, {
    envelope,
    volume: patch.growl.level,
    output,
  });
  const growlFilter = graph.filter({
    type: 'bandpass',
    frequency: patch.growl.floorHz,
    Q: patch.growl.q,
    output: createSaturator(graph, patch.growl.saturation, growl.input),
  });
  graph.lfo({
    filter: growlFilter,
    rate: LFO_RATE[sound.lfo],
    min: patch.growl.floorHz,
    max: Math.max(sound.cutoff * patch.growl.peak, patch.growl.floorHz),
    phase,
  });
  const growlOsc = graph.oscillator(
    { type: 'square', frequency: hz * 2 ** patch.growl.octave },
    growlFilter.input,
  );

  const click = createGate(graph, {
    envelope: {
      attack: 0.001,
      decay: patch.click.decay,
      sustain: 0,
      release: 0.01,
    },
    volume: patch.click.level,
    output,
  });
  graph.noise('white').connect(
    graph.filter({
      type: 'bandpass',
      frequency: patch.click.hz,
      output: click.input,
    }).input,
  );

  return (time: number, duration: number, note: number, pitch: SetPitch) => {
    subOsc.frequency.setValueAtTime(note / 2 ** patch.sub.octavesDown, time);
    pitch(stack.frequency, note * 2 ** patch.stack.octave, time);
    pitch(growlOsc.frequency, note * 2 ** patch.growl.octave, time);
    sub.envelope.triggerAttackRelease(duration, time);
    growl.envelope.triggerAttackRelease(duration, time);
    click.envelope.triggerAttackRelease(0.005, time);
  };
};

/** The body's gate, behind a high-pass so it leaves the lows to the sub. */
const createBody = (
  graph: Graph,
  envelope: EnvelopePatch,
  layers: WeaponLayersPatch,
  output: Output,
) => {
  const gate = createGate(graph, { envelope, output });
  const crossover = graph.filter({
    type: 'highpass',
    frequency: layers.crossoverHz,
    output: gate.input,
  });
  return { gate, crossover: crossover.input };
};

/** A resonant low-pass for an engine's body, its cutoff swept by an LFO. */
const createSweptFilter = (
  graph: Graph,
  {
    sound,
    rolloff,
    min,
    max,
    phase,
    output,
  }: {
    sound: WeaponSound;
    rolloff: -12 | -24 | -48 | -96;
    min: number;
    max: number;
    phase?: number;
    output: Output;
  },
): Filter => {
  const filter = graph.filter({
    type: 'lowpass',
    frequency: max,
    rolloff,
    Q: sound.resonance,
    output,
  });
  graph.lfo({ filter, rate: LFO_RATE[sound.lfo], min, max, phase });
  return filter;
};

/**
 * Wobble: a detuned oscillator through a resonant low-pass that a
 * Transport-synced LFO sweeps at the rolled rate, so every shot - landing on
 * the grid - opens with the same phase. The layers sit around it.
 */
const createWobble = (
  graph: Graph,
  sound: WeaponSound,
  patch: WobblePatch,
  outputs: EngineOutputs,
): Engine => {
  const { gate, crossover } = createBody(
    graph,
    patch.envelope,
    patch.layers,
    outputs.output,
  );
  // A phase of 270 starts each sweep closed: "whob", not "bwo".
  const filter = createSweptFilter(graph, {
    sound,
    rolloff: patch.rolloff,
    min: patch.sweepFloor,
    max: sound.cutoff,
    phase: patch.phase,
    output: crossover,
  });
  const osc = graph.fatOscillator(
    {
      type: sound.waveform,
      frequency: midiToHz(sound.riff[0]),
      count: patch.voices,
      spread: patch.spread,
    },
    filter.input,
  );
  const layers = createLayers(graph, {
    sound,
    patch: patch.layers,
    envelope: patch.envelope,
    phase: patch.phase,
    body: filter.input,
    ...outputs,
  });

  return {
    play: (time, duration, hz) => {
      osc.frequency.setValueAtTime(hz, time);
      gate.envelope.triggerAttackRelease(duration, time);
      layers(time, duration, hz, jump);
    },
  };
};

/**
 * Laser: a bright "pew" - each shot's pitch drops onto the riff note - with
 * the LFO shimmering the filter. Its sub sits well below the pew.
 */
const createLaser = (
  graph: Graph,
  sound: WeaponSound,
  patch: LaserPatch,
  outputs: EngineOutputs,
): Engine => {
  const { gate, crossover } = createBody(
    graph,
    patch.envelope,
    patch.layers,
    outputs.output,
  );
  const filter = createSweptFilter(graph, {
    sound,
    rolloff: patch.rolloff,
    min: sound.cutoff * patch.shimmerDepth,
    max: sound.cutoff,
    output: crossover,
  });
  const osc = graph.oscillator(
    { type: sound.waveform, frequency: midiToHz(sound.riff[0]) },
    filter.input,
  );
  const layers = createLayers(graph, {
    sound,
    patch: patch.layers,
    envelope: patch.envelope,
    phase: 0,
    body: filter.input,
    ...outputs,
  });
  const pew: SetPitch = (frequency, hz, time) => {
    frequency.cancelScheduledValues(time);
    frequency.setValueAtTime(hz * patch.pitchDrop, time);
    frequency.exponentialRampToValueAtTime(hz, time + patch.pitchDropSeconds);
  };

  return {
    play: (time, duration, hz) => {
      pew(osc.frequency, hz, time);
      gate.envelope.triggerAttackRelease(duration, time);
      layers(time, duration, hz, pew);
    },
  };
};

/** Seconds of float error a beam's tick timing may carry. */
const EPSILON = 0.001;

/**
 * Beam: opened by the first tick and held while ticks keep coming - each
 * one only moves the release on - so it sounds as one long note that glides
 * through the riff, its filter pulsed by the LFO.
 */
const createBeam = (
  graph: Graph,
  sound: WeaponSound,
  patch: BeamPatch,
  { output, sub: subOutput }: EngineOutputs,
): Engine => {
  const hz = midiToHz(sound.riff[0]);
  const gate = createGate(graph, { envelope: patch.envelope, output });
  const filter = createSweptFilter(graph, {
    sound,
    rolloff: patch.rolloff,
    min: Math.min(patch.sweepFloor, sound.cutoff),
    max: sound.cutoff,
    output: gate.input,
  });
  const osc = graph.fatOscillator(
    {
      type: sound.waveform,
      frequency: hz,
      count: patch.voices,
      spread: patch.spread,
    },
    filter.input,
  );
  const top = graph.oscillator(
    { type: 'square', frequency: hz * 2 },
    graph.volume(patch.topLevel, filter.input),
  );

  const sub = createGate(graph, {
    envelope: patch.envelope,
    output: createSaturator(
      graph,
      patch.sub.saturation,
      graph.volume(patch.sub.level, subOutput),
    ),
  });
  const subOsc = graph.oscillator(
    { type: 'sine', frequency: hz / 2 ** patch.sub.octavesDown },
    sub.input,
  );

  const sizzle = createGate(graph, {
    envelope: patch.envelope,
    volume: patch.sizzle.level,
    output,
  });
  graph.noise('white').connect(
    graph.filter({
      type: 'highpass',
      frequency: patch.sizzle.hz,
      output: sizzle.input,
    }).input,
  );

  const gates = [gate, sub, sizzle];
  const pitched: Array<[Automation, number]> = [
    [osc.frequency, 1],
    [top.frequency, 2],
    [subOsc.frequency, 1 / 2 ** patch.sub.octavesDown],
  ];
  let openUntil = -Infinity;

  return {
    continuous: true,
    play: (time, duration, note) => {
      // Ticks land where the last one's release was scheduled, give or take
      // float error: allow a hair either side.
      const held = time <= openUntil + EPSILON;
      if (held) {
        gates.forEach(({ envelope }) => envelope.cancel(openUntil - EPSILON));
      }
      pitched.forEach(([frequency, ratio]) => {
        frequency.cancelScheduledValues(time);
        if (held) {
          frequency.setValueAtTime(frequency.getValueAtTime(time), time);
          frequency.exponentialRampToValueAtTime(
            note * ratio,
            time + patch.glideSeconds,
          );
        } else frequency.setValueAtTime(note * ratio, time);
      });
      if (!held) gates.forEach(({ envelope }) => envelope.triggerAttack(time));
      gates.forEach(({ envelope }) => envelope.triggerRelease(time + duration));
      openUntil = time + duration;
    },
  };
};

const ENGINES = {
  wobble: (graph, sound, design, outputs) =>
    createWobble(graph, sound, design.wobble, outputs),
  laser: (graph, sound, design, outputs) =>
    createLaser(graph, sound, design.laser, outputs),
  beam: (graph, sound, design, outputs) =>
    createBeam(graph, sound, design.beam, outputs),
} satisfies Record<
  WeaponSound['oscillator'],
  (
    graph: Graph,
    sound: WeaponSound,
    design: SoundDesign,
    outputs: EngineOutputs,
  ) => Engine
>;

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
  output: Output;
  sound: WeaponSound;
  beatSeconds: number;
  /** dB */
  volume?: number;
  design?: SoundDesign;
}): WeaponVoice => {
  const mix = design.weaponMix;
  const graph = createGraph();
  const glue = graph.compressor(
    { threshold: mix.glueThreshold, ratio: mix.glueRatio },
    graph.channel(volume, output),
  );
  const fadeNode = graph.gain(1, glue);
  const fade = graph.param(fadeNode.gain, 'gain', 1);
  const subCut = graph.filter({
    type: 'highpass',
    frequency: 20,
    output: fadeNode,
  });
  const delay = sound.delay
    ? graph.feedbackDelay(
        {
          delayTime: beatSeconds / 2,
          feedback: sound.delay.feedback,
          wet: sound.delay.wet,
        },
        subCut.input,
      )
    : null;
  const afterDrive = delay ?? subCut.input;
  const drive =
    sound.drive > 0
      ? graph.distortion({ amount: sound.drive, wet: mix.driveWet }, afterDrive)
      : null;
  const engine = ENGINES[sound.oscillator](graph, sound, design, {
    output: drive ?? afterDrive,
    sub: subCut.input,
  });

  return {
    fire: (time, duration, shot) => {
      // A beam holds each riff note for a beat; shots play one each.
      const index = engine.continuous
        ? Math.floor(shot / STEPS_PER_BEAT)
        : shot;
      const note = sound.riff[index % sound.riff.length];
      engine.play(
        time,
        engine.continuous ? duration : duration * mix.articulation,
        midiToHz(note),
      );
    },
    holster: time => {
      fade.cancelScheduledValues(time);
      fade.rampTo(0, mix.holsterFadeSeconds, time);
    },
    equip: time => {
      fade.cancelScheduledValues(time);
      fade.rampTo(1, 0.01, time);
    },
    setSubOwner: (owner, time) => {
      subCut.frequency.rampTo(owner ? 20 : mix.subCutHz, 0.05, time);
    },
    dispose: graph.dispose,
  };
};

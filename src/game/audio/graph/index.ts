import {
  connect,
  dbToGain,
  getContext,
  getTransport,
  immediate,
  Param,
  type BaseContext,
  type InputNode,
  type Unit,
} from 'tone';

/** Where a node's output can go: a native node or param, or a Tone node. */
export type Output = InputNode;

/**
 * The automation voices schedule, on one param or on several moving
 * together (a detuned stack's oscillators, a filter's cascaded stages).
 * Tone's `Param` implements it.
 */
export interface Automation {
  setValueAtTime: (value: number, time: number) => void;
  linearRampToValueAtTime: (value: number, time: number) => void;
  exponentialRampToValueAtTime: (value: number, time: number) => void;
  /** From `time`, reach `value` after `seconds`. */
  exponentialRampTo: (value: number, seconds: number, time: number) => void;
  /** Linear or exponential, by the param's units, as Tone's `rampTo`. */
  rampTo: (value: number, seconds: number, time: number) => void;
  cancelScheduledValues: (time: number) => void;
  cancelAndHoldAtTime: (time: number) => void;
  getValueAtTime: (time: number) => number;
}

/** One or more of Tone's frequency params, moved together. */
const fan = (params: Array<Param<'frequency'>>): Automation => ({
  setValueAtTime: (value, time) =>
    params.forEach(param => param.setValueAtTime(value, time)),
  linearRampToValueAtTime: (value, time) =>
    params.forEach(param => param.linearRampToValueAtTime(value, time)),
  exponentialRampToValueAtTime: (value, time) =>
    params.forEach(param => param.exponentialRampToValueAtTime(value, time)),
  exponentialRampTo: (value, seconds, time) =>
    params.forEach(param => param.exponentialRampTo(value, seconds, time)),
  rampTo: (value, seconds, time) =>
    params.forEach(param => param.rampTo(value, seconds, time)),
  cancelScheduledValues: time =>
    params.forEach(param => param.cancelScheduledValues(time)),
  cancelAndHoldAtTime: time =>
    params.forEach(param => param.cancelAndHoldAtTime(time)),
  // Tone types a frequency loosely; its value is always in Hz.
  getValueAtTime: time => Number(params[0].getValueAtTime(time)),
});

export interface Filter {
  input: BiquadFilterNode;
  frequency: Automation;
  /** Every stage's cutoff, for an LFO to sweep. */
  cutoffs: Array<AudioParam>;
}

export type NoiseColor = 'white' | 'pink' | 'brown';

/** Tone's noise: five seconds of it, looped from a random point. */
const NOISE_SAMPLES = 44100 * 5;

type Samples = Float32Array<ArrayBuffer>;

const NOISE: Record<NoiseColor, () => Samples> = {
  white: () => Float32Array.from({ length: NOISE_SAMPLES }, () => white()),
  // Paul Kellet's filter, as Tone makes it.
  pink: () => {
    const b = [0, 0, 0, 0, 0, 0, 0];
    return Float32Array.from({ length: NOISE_SAMPLES }, () => {
      const w = white();
      b[0] = 0.99886 * b[0] + w * 0.0555179;
      b[1] = 0.99332 * b[1] + w * 0.0750759;
      b[2] = 0.969 * b[2] + w * 0.153852;
      b[3] = 0.8665 * b[3] + w * 0.3104856;
      b[4] = 0.55 * b[4] + w * 0.5329522;
      b[5] = -0.7616 * b[5] - w * 0.016898;
      const out =
        (b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + w * 0.5362) * 0.11;
      b[6] = w * 0.115926;
      return out;
    });
  },
  brown: () => {
    let last = 0;
    return Float32Array.from({ length: NOISE_SAMPLES }, () => {
      last = (last + 0.02 * white()) / 1.02;
      return last * 3.5;
    });
  },
};

const white = () => Math.random() * 2 - 1;

/** Generated once per colour and channel, then copied into each context. */
const noiseData = new Map<NoiseColor, [Samples, Samples]>();
const noiseBuffers = new WeakMap<BaseContext, Map<NoiseColor, AudioBuffer>>();

const noiseBuffer = (context: BaseContext, color: NoiseColor) => {
  const buffers =
    noiseBuffers.get(context) ?? new Map<NoiseColor, AudioBuffer>();
  noiseBuffers.set(context, buffers);
  const cached = buffers.get(color);
  if (cached) return cached;
  const data = noiseData.get(color) ?? [NOISE[color](), NOISE[color]()];
  noiseData.set(color, data);
  const buffer = context.createBuffer(2, NOISE_SAMPLES, context.sampleRate);
  data.forEach((channel, index) => buffer.copyToChannel(channel, index));
  buffers.set(color, buffer);
  return buffer;
};

/**
 * Tone's oscillator waves: its own partials rotated by `phase`, or the
 * browser's wave when there's no rotation.
 */
const PARTIALS = 2048;
const partial = (type: OscillatorType, n: number) => {
  const piFactor = 2 / (n * Math.PI);
  if (type === 'sine') return n === 1 ? 1 : 0;
  if (type === 'square') return n & 1 ? 2 * piFactor : 0;
  if (type === 'sawtooth') return piFactor * (n & 1 ? 1 : -1);
  if (type === 'triangle') {
    return n & 1 ? 2 * piFactor * piFactor * (((n - 1) >> 1) & 1 ? -1 : 1) : 0;
  }
  return 0;
};

const waves = new WeakMap<BaseContext, Map<string, PeriodicWave>>();

const rotatedWave = (
  context: BaseContext,
  type: OscillatorType,
  degrees: number,
) => {
  const cache = waves.get(context) ?? new Map<string, PeriodicWave>();
  waves.set(context, cache);
  const id = `${type}:${degrees}`;
  const cached = cache.get(id);
  if (cached) return cached;
  const phase = (degrees * Math.PI) / 180;
  const size = type === 'sine' ? 2 : PARTIALS;
  const real = new Float32Array(size);
  const imag = new Float32Array(size);
  Array.from({ length: size - 1 }, (_, i) => i + 1).forEach(n => {
    const b = partial(type, n);
    real[n] = -b * Math.sin(phase * n);
    imag[n] = b * Math.cos(phase * n);
  });
  const wave = context.createPeriodicWave(real, imag);
  cache.set(id, wave);
  return wave;
};

const setWave = (
  context: BaseContext,
  oscillator: OscillatorNode,
  type: OscillatorType,
  degrees: number,
) => {
  const turn = ((degrees % 360) + 360) % 360;
  if (turn === 0) oscillator.type = type;
  else oscillator.setPeriodicWave(rotatedWave(context, type, turn));
};

/** Tone's equal-power crossfade, as its effects mix wet and dry. */
const dryWet = (wet: number) => ({
  dry: Math.cos((wet * Math.PI) / 2),
  wet: Math.sin((wet * Math.PI) / 2),
});

/** A Reverb's impulse: stereo noise faded in after a pre-delay, then decaying. */
const impulse = (context: BaseContext, decay: number, preDelay: number) => {
  const rate = context.sampleRate;
  const length = Math.ceil((decay + preDelay) * rate);
  const buffer = context.createBuffer(2, length, rate);
  // Tone's `exponentialApproachValueAtTime`: a target curve for 90% of
  // the decay, then a straight line to silence.
  const timeConstant = Math.log(decay + 1) / Math.log(200);
  const knee = Math.exp(-(decay * 0.9) / timeConstant);
  const level = (t: number) => {
    if (t < preDelay) return 0;
    const since = t - preDelay;
    if (since < decay * 0.9) return Math.exp(-since / timeConstant);
    return knee * Math.max(0, 1 - (since - decay * 0.9) / (decay * 0.1));
  };
  [0, 1].forEach(channel =>
    buffer.copyToChannel(
      Float32Array.from({ length }, (_, i) => white() * level(i / rate)),
      channel,
    ),
  );
  return buffer;
};

/**
 * Builds a voice from the context's own nodes, one browser node each, and
 * disposes them together. Tone's wrappers cost many hidden nodes apiece (an
 * `Oscillator` is 11, an `LFO` 28, a `Filter` 15) and drive params from
 * signals, which costs per-sample work: the game's graph ran ~1,350 nodes
 * and phones couldn't keep up. Automation still goes through Tone's
 * `Param`, which adds no nodes, so ramps and envelopes keep Tone's curves.
 *
 * Built on Tone's current context, so a voice made inside `Offline` renders
 * there.
 */
export const createGraph = () => {
  const context = getContext();
  const nodes: Array<AudioNode> = [];
  const sources: Array<AudioScheduledSourceNode> = [];
  const params: Array<{ dispose: () => void }> = [];
  const events: Array<number> = [];

  const track = <Node extends AudioNode>(node: Node, output?: Output) => {
    nodes.push(node);
    if (output) connect(node, output);
    return node;
  };

  const param = <Units extends Unit.UnitName>(
    audioParam: AudioParam,
    units: Units,
    value: Unit.UnitMap[Units],
  ): Param<Units> => {
    const automated = new Param({ context, param: audioParam, units, value });
    params.push(automated);
    return automated;
  };

  const gain = (value = 1, output?: Output) => {
    const node = track(context.createGain(), output);
    node.gain.value = value;
    return node;
  };

  const oscillatorNode = (
    type: OscillatorType,
    degrees: number,
    output: Output,
  ) => {
    const node = track(context.createOscillator(), output);
    setWave(context, node, type, degrees);
    return node;
  };

  const start = (source: AudioScheduledSourceNode, time?: number) => {
    source.start(time);
    sources.push(source);
  };

  const filterStages = ({
    type,
    frequency,
    Q = 1,
    rolloff = -12,
    output,
  }: {
    type: BiquadFilterType;
    frequency: number;
    Q?: number;
    /** dB per octave: each -12 is one more biquad in the cascade. */
    rolloff?: -12 | -24 | -48 | -96;
    output?: Output;
  }): Filter => {
    const count = Math.max(1, Math.round(rolloff / -12));
    const stages = Array.from({ length: count }, () => {
      const stage = track(context.createBiquadFilter());
      stage.type = type;
      stage.Q.value = Q;
      return stage;
    });
    stages.reduce((from, to) => {
      from.connect(to);
      return to;
    });
    if (output) connect(stages[stages.length - 1], output);
    const cutoffs = stages.map(stage => stage.frequency);
    return {
      input: stages[0],
      frequency: fan(
        cutoffs.map(cutoff => param(cutoff, 'frequency', frequency)),
      ),
      cutoffs,
    };
  };

  return {
    param,
    gain,
    /** A fixed level in dB. */
    volume: (db: number, output?: Output) => gain(dbToGain(db), output),

    /** A running oscillator, as Tone's `Oscillator(...).start()`. */
    oscillator: (
      {
        type,
        frequency,
        phase = 0,
      }: { type: OscillatorType; frequency: number; phase?: number },
      output: Output,
    ) => {
      const node = oscillatorNode(type, phase, output);
      const pitch = param(node.frequency, 'frequency', frequency);
      start(node);
      return { node, frequency: fan([pitch]) };
    },

    /**
     * Tone's `FatOscillator`: `count` oscillators detuned across `spread`
     * cents, their phases staggered, each turned down so the stack isn't
     * louder for its size.
     */
    fatOscillator: (
      {
        type,
        frequency,
        count,
        spread,
        volume = 0,
      }: {
        type: OscillatorType;
        frequency: number;
        count: number;
        spread: number;
        /** dB */
        volume?: number;
      },
      output: Output,
    ) => {
      const level = gain(dbToGain(volume - 6 - count * 1.1), output);
      const pitches = Array.from({ length: count }, (_, i) => {
        const node = oscillatorNode(type, (i / count) * 360, level);
        node.detune.value =
          count > 1 ? -spread / 2 + (spread / (count - 1)) * i : 0;
        const pitch = param(node.frequency, 'frequency', frequency);
        start(node);
        return pitch;
      });
      return { frequency: fan(pitches) };
    },

    /** Looping noise, started from a random point in its buffer. */
    noise: (color: NoiseColor) => {
      const node = track(context.createBufferSource());
      node.buffer = noiseBuffer(context, color);
      node.loop = true;
      node.start(0, Math.random() * (NOISE_SAMPLES / 44100 - 0.001));
      sources.push(node);
      return node;
    },

    /** Tone's `Filter`: a biquad per -12 dB of rolloff, sharing the cutoff. */
    filter: filterStages,

    /**
     * Tone's synced `LFO` on a filter's cutoff: a sine between `min` and
     * `max` at a musical `rate`, in phase with the Transport - every shot,
     * landing on the grid, meets the sweep at the same point. It starts
     * with the Transport, or straight away in phase if that's running. The
     * rate is read then, so a BPM set before the start holds.
     */
    lfo: ({
      filter,
      rate,
      min,
      max,
      phase = 0,
    }: {
      filter: Filter;
      rate: Unit.Frequency;
      min: number;
      max: number;
      /** Degrees, as Tone's: the wave turned back by this much. */
      phase?: number;
    }) => {
      // The sweep rides on the cutoff, so the cutoff sits at its centre.
      filter.frequency.cancelScheduledValues(0);
      filter.frequency.setValueAtTime((min + max) / 2, 0);
      const depth = gain((max - min) / 2);
      filter.cutoffs.forEach(cutoff => depth.connect(cutoff));
      const transport = getTransport();
      const startAt = (time: number) => {
        const hz = transport.toFrequency(rate);
        // Tone's phase turns the wave back: start where the Transport's
        // sweep has got to.
        const cycles = (transport.getSecondsAtTime(time) * hz) % 1;
        const node = oscillatorNode('sine', phase - cycles * 360, depth);
        node.frequency.value = hz;
        start(node, time);
      };
      if (transport.state === 'started') startAt(immediate());
      else events.push(transport.schedule(startAt, 0));
    },

    /** A wave shaper over `length` points of `mapping` from -1 to 1. */
    shaper: (
      mapping: (value: number) => number,
      length: number,
      output: Output,
    ) => {
      const node = track(context.createWaveShaper(), output);
      node.curve = Float32Array.from({ length }, (_, i) =>
        mapping((i / (length - 1)) * 2 - 1),
      );
      return node;
    },

    compressor: (
      {
        threshold,
        ratio,
        attack = 0.003,
        release = 0.25,
      }: {
        threshold: number;
        ratio: number;
        attack?: number;
        release?: number;
      },
      output: Output,
    ) => {
      const node = track(context.createDynamicsCompressor(), output);
      node.threshold.value = threshold;
      node.ratio.value = ratio;
      node.attack.value = attack;
      node.release.value = release;
      return node;
    },

    /** Tone's `Limiter`: a hard, fast compressor. */
    limiter: (threshold: number, output: Output) => {
      const node = track(context.createDynamicsCompressor(), output);
      node.threshold.value = threshold;
      node.ratio.value = 20;
      node.attack.value = 0.003;
      node.release.value = 0.01;
      return node;
    },

    /**
     * Tone's `Channel` at `volume` dB: summed to mono and panned centre,
     * so a mono source sits 3 dB down, as it did.
     */
    channel: (volume: number, output: Output) => {
      const level = gain(dbToGain(volume), output);
      const panner = track(context.createStereoPanner(), level);
      panner.channelCount = 1;
      panner.channelCountMode = 'explicit';
      return panner;
    },

    /** Tone's `Distortion`, mixed `wet` with the dry signal. */
    distortion: (
      { amount, wet }: { amount: number; wet: number },
      output: Output,
    ) => {
      const mix = dryWet(wet);
      const input = gain(1);
      input.connect(gain(mix.dry, output));
      const k = amount * 100;
      const deg = Math.PI / 180;
      const node = track(context.createWaveShaper(), gain(mix.wet, output));
      node.curve = Float32Array.from({ length: 4096 }, (_, i) => {
        const x = (i / 4095) * 2 - 1;
        return Math.abs(x) < 0.001
          ? 0
          : ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      });
      input.connect(node);
      return input;
    },

    /** Tone's `FeedbackDelay`: echoes fed back on themselves, mixed `wet`. */
    feedbackDelay: (
      {
        delayTime,
        feedback,
        wet,
      }: { delayTime: number; feedback: number; wet: number },
      output: Output,
    ) => {
      const mix = dryWet(wet);
      const input = gain(1);
      input.connect(gain(mix.dry, output));
      const delay = track(context.createDelay(1), gain(mix.wet, output));
      delay.delayTime.value = delayTime;
      delay.connect(gain(feedback, delay));
      input.connect(delay);
      return input;
    },

    /** Tone's `Reverb`: a convolution with decaying noise, mixed `wet`. */
    reverb: (
      {
        decay,
        wet,
        preDelay = 0.01,
      }: { decay: number; wet: number; preDelay?: number },
      output: Output,
    ) => {
      const mix = dryWet(wet);
      const input = gain(1);
      input.connect(gain(mix.dry, output));
      const convolver = track(context.createConvolver(), gain(mix.wet, output));
      convolver.buffer = impulse(context, decay, preDelay);
      input.connect(convolver);
      return input;
    },

    dispose: () => {
      const transport = getTransport();
      events.forEach(id => transport.clear(id));
      sources.forEach(source => source.stop());
      nodes.forEach(node => node.disconnect());
      params.forEach(automated => automated.dispose());
    },
  };
};

export type Graph = ReturnType<typeof createGraph>;

import { dbToGain, getContext } from 'tone';
import type { Graph, Output } from '../graph';

export interface EnvelopeShape {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

/** Tone's `Envelope`, played on a gate's gain. */
export interface Envelope {
  /** Seconds; settable between hits (a riser stretches it). */
  attack: number;
  triggerAttack: (time: number, velocity?: number) => void;
  triggerRelease: (time: number) => void;
  triggerAttackRelease: (
    duration: number,
    time: number,
    velocity?: number,
  ) => void;
  /** Drop everything scheduled after `after`. */
  cancel: (after: number) => void;
}

export interface Gate {
  /** Connect an always-running source here. */
  input: AudioNode;
  envelope: Envelope;
}

/**
 * A gain gating a source that runs the whole game. Tone's instruments
 * create fresh source nodes on every note, and some of those never get
 * released - the audio graph grows until it crackles. Voices built from
 * gates create no nodes per hit: a hit only reschedules the gain.
 *
 * The envelope is Tone's - a linear attack, exponential decay and release
 * - on the gate's own gain, and `volume` scales its peak, so a gate is one
 * node.
 */
export const createGate = (
  graph: Graph,
  {
    envelope: shape,
    volume = 0,
    output,
  }: {
    envelope: EnvelopeShape;
    /** dB */
    volume?: number;
    output: Output;
  },
): Gate => {
  const input = graph.gain(0, output);
  const gain = graph.param(input.gain, 'gain', 0);
  const peak = dbToGain(volume);
  const sampleTime = 1 / getContext().sampleRate;
  let { attack } = shape;
  const { decay, sustain, release } = shape;

  const triggerAttack = (time: number, velocity = 1) => {
    // A hit on a ringing gate only climbs the rest of the way.
    const current = gain.getValueAtTime(time) / peak;
    const rise = current > 0 ? (1 - current) * attack : attack;
    if (rise < sampleTime) {
      gain.cancelScheduledValues(time);
      gain.setValueAtTime(velocity * peak, time);
    } else gain.linearRampTo(velocity * peak, rise, time);
    if (decay && sustain < 1) {
      gain.exponentialApproachValueAtTime(
        velocity * peak * sustain,
        time + rise,
        decay,
      );
    }
  };

  const triggerRelease = (time: number) => {
    if (gain.getValueAtTime(time) <= 0) return;
    if (release < sampleTime) gain.setValueAtTime(0, time);
    else gain.targetRampTo(0, release, time);
  };

  return {
    input,
    envelope: {
      get attack() {
        return attack;
      },
      set attack(seconds) {
        attack = seconds;
      },
      triggerAttack,
      triggerRelease,
      triggerAttackRelease: (duration, time, velocity) => {
        triggerAttack(time, velocity);
        triggerRelease(time + duration);
      },
      cancel: after => gain.cancelScheduledValues(after),
    },
  };
};

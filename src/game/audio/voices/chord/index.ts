import { degreeToMidi, midiToHz, type Key } from '../../../music';
import { SOUND_DESIGN, type ChordPatch } from '../../../sound';
import { createGate } from '../../gate';
import { createGraph, type Output } from '../../graph';

export interface ChordSound {
  /** The third and fifth over the chord on scale degree `degree`. */
  play: (time: number, degree: number) => void;
  dispose: () => void;
}

/**
 * The chord powerup's harmony: two always-running oscillators, retuned per
 * shot to the third and fifth of the chord being played, so the side shots
 * ring as the rest of the triad over the weapon's own note.
 */
export const createChordSound = ({
  output,
  key,
  patch = SOUND_DESIGN.chord,
}: {
  output: Output;
  key: Key;
  patch?: ChordPatch;
}): ChordSound => {
  const graph = createGraph();
  const channel = graph.channel(patch.level, output);
  const filter = graph.filter({
    type: 'lowpass',
    frequency: patch.brightnessHz,
    output: channel,
  }).input;
  const envelope = {
    attack: 0.003,
    decay: patch.decay,
    sustain: 0,
    release: 0.05,
  };
  const tones = [2, 4].map(offset => {
    const gate = createGate(graph, { envelope, output: filter });
    const osc = graph.oscillator(
      { type: patch.waveform, frequency: 440 },
      gate.input,
    );
    return { offset, gate, osc };
  });

  return {
    play: (time, degree) =>
      tones.forEach(({ offset, gate, osc }) => {
        const hz = midiToHz(degreeToMidi(key, degree + offset, patch.octave));
        osc.frequency.setValueAtTime(hz, time);
        gate.envelope.triggerAttackRelease(0.01, time);
      }),
    dispose: graph.dispose,
  };
};

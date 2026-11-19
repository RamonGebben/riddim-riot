import { dbToGain } from 'tone';
import { STEPS_PER_BAR } from '../../../grid';
import {
  arpFor,
  arpIndex,
  chordAt,
  leadFor,
  shiftFor,
  stabsFor,
  voiceProgression,
  type Progression,
} from '../../../harmony';
import { degreeToMidi, midiToHz, type Key } from '../../../music';
import type { SongPart } from '../../../sim/survival';
import { SOUND_DESIGN, type BackingPatch } from '../../../sound';
import { createGate } from '../../gate';
import { createGraph, type Output } from '../../graph';

export interface Backing {
  /**
   * A bar line: schedule the whole bar of the layers `part` plays, over
   * the chord `bar` bars into the progression. Null before the song.
   */
  onBar: (at: { time: number; bar: number; part: SongPart | null }) => void;
  /** A shot at `time`: dip the layers so the weapon stays on top. */
  duck: (time: number) => void;
  dispose: () => void;
}

/** Which layers play in which part of the song. */
const LAYERS = {
  intro: { arp: true, lead: false, stabs: false },
  breakdown: { arp: true, lead: false, stabs: false },
  buildup: { arp: true, lead: false, stabs: false },
  drop1: { arp: false, lead: true, stabs: true },
  drop2: { arp: false, lead: true, stabs: true },
  bridge: { arp: true, lead: true, stabs: false },
  drop3: { arp: true, lead: true, stabs: true },
  outro: { arp: true, lead: false, stabs: false },
} satisfies Record<SongPart, { arp: boolean; lead: boolean; stabs: boolean }>;

/**
 * The song's melodic layers over the level's progression: a pluck
 * arpeggiating each chord, a seeded two-bar lead hook that follows the
 * chords, and offbeat chord stabs. Each is an always-running source behind
 * a gate, so a note only reschedules envelopes and pitches. A bar is
 * scheduled at once on its bar line, on the audio clock.
 */
export const createBacking = ({
  output,
  key,
  seed,
  progression,
  stepSeconds,
  patch = SOUND_DESIGN.backing,
}: {
  /** The pumped bed (`musicBus.bed`). */
  output: Output;
  key: Key;
  seed: number;
  progression: Progression;
  stepSeconds: number;
  patch?: BackingPatch;
}): Backing => {
  const graph = createGraph();
  const duckNode = graph.gain(1, graph.volume(patch.level, output));
  const duckGain = graph.param(duckNode.gain, 'gain', 1);
  const bus = graph.filter({
    type: 'highpass',
    frequency: patch.highpassHz,
    output: duckNode,
  }).input;

  const arpPattern = arpFor(seed);
  const hook = leadFor(seed);
  const stabSteps = stabsFor(seed);
  const triad = { shape: [0, 2, 4, 7], octave: patch.arp.octave };
  const arpChords = voiceProgression(key, progression, triad);
  const stabChords = voiceProgression(key, progression, {
    shape: [0, 2, 4],
    octave: patch.stabs.octave,
  });
  const chordIndex = (bar: number) =>
    progression.chords.indexOf(chordAt(progression, bar));

  // Arp: one pluck, its filter snapped open by each note.
  const { arp } = patch;
  const arpGate = createGate(graph, {
    envelope: { attack: 0.002, decay: arp.decay, sustain: 0, release: 0.03 },
    volume: arp.level,
    output: bus,
  });
  const arpFilter = graph.filter({
    type: 'lowpass',
    frequency: arp.hz,
    Q: 3,
    output: arpGate.input,
  });
  const arpOsc = graph.oscillator(
    { type: arp.waveform, frequency: 220 },
    arpFilter.input,
  );

  // Lead: detuned saws sliding between notes, with an echo for space.
  const { lead } = patch;
  const leadGate = createGate(graph, {
    envelope: {
      attack: 0.01,
      decay: lead.decay,
      sustain: lead.sustain,
      release: lead.release,
    },
    volume: lead.level,
    output: graph.feedbackDelay(
      {
        delayTime: stepSeconds * 3,
        feedback: lead.echoFeedback,
        wet: lead.echoWet,
      },
      bus,
    ),
  });
  const leadOsc = graph.fatOscillator(
    { type: 'sawtooth', frequency: 440, count: 3, spread: lead.detune },
    graph.filter({
      type: 'lowpass',
      frequency: lead.hz,
      output: leadGate.input,
    }).input,
  );

  // Stabs: a chord of three oscillators through one short gate.
  const { stabs } = patch;
  const stabGate = createGate(graph, {
    envelope: { attack: 0.002, decay: stabs.decay, sustain: 0, release: 0.03 },
    volume: stabs.level,
    output: bus,
  });
  const stabFilter = graph.filter({
    type: 'lowpass',
    frequency: stabs.hz,
    output: stabGate.input,
  });
  // Each note at its share, so the chord isn't louder than one note.
  const stabMix = graph.volume(-20 * Math.log10(3), stabFilter.input);
  const stabOscs = [0, 1, 2].map(() =>
    graph.oscillator({ type: stabs.waveform, frequency: 220 }, stabMix),
  );

  const playArp = (time: number, bar: number) => {
    const chord = arpChords[chordIndex(bar)];
    const notes = STEPS_PER_BAR / arpPattern.steps;
    Array.from({ length: notes }, (_, n) => {
      const at = time + n * arpPattern.steps * stepSeconds;
      const note = chord[arpIndex(arpPattern.order, n, chord.length)];
      arpOsc.frequency.setValueAtTime(midiToHz(note), at);
      arpFilter.frequency.setValueAtTime(arp.peakHz, at);
      arpFilter.frequency.exponentialRampToValueAtTime(arp.hz, at + arp.decay);
      arpGate.envelope.triggerAttackRelease(stepSeconds * 0.5, at);
    });
  };

  let lastLead: number | null = null;
  const playLead = (time: number, bar: number) => {
    const root = shiftFor(chordAt(progression, bar).degree);
    hook[((bar % 2) + 2) % 2].forEach(note => {
      const at = time + note.step * stepSeconds;
      const hz = midiToHz(degreeToMidi(key, root + note.degree, lead.octave));
      if (lastLead === null) leadOsc.frequency.setValueAtTime(hz, at);
      else {
        leadOsc.frequency.setValueAtTime(lastLead, at);
        leadOsc.frequency.exponentialRampToValueAtTime(hz, at + lead.glide);
      }
      lastLead = hz;
      leadGate.envelope.triggerAttackRelease(note.steps * stepSeconds, at);
    });
  };

  const playStabs = (time: number, bar: number) => {
    const chord = stabChords[chordIndex(bar)];
    stabSteps.forEach(step => {
      const at = time + step * stepSeconds;
      stabOscs.forEach((osc, i) =>
        osc.frequency.setValueAtTime(midiToHz(chord[i]), at),
      );
      stabGate.envelope.triggerAttackRelease(stepSeconds * 0.6, at);
    });
  };

  return {
    onBar: ({ time, bar, part }) => {
      if (!part) return;
      const layers = LAYERS[part];
      if (layers.arp) playArp(time, bar);
      if (layers.lead) playLead(time, bar);
      else lastLead = null;
      if (layers.stabs) playStabs(time, bar);
    },
    duck: time => {
      duckGain.cancelAndHoldAtTime(time);
      duckGain.linearRampToValueAtTime(dbToGain(patch.duckDb), time + 0.01);
      duckGain.linearRampToValueAtTime(1, time + patch.duckSeconds);
    },
    dispose: graph.dispose,
  };
};

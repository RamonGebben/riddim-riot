import { chordAt, voiceProgression, type Progression } from '../../harmony';
import { midiToHz, type Key } from '../../music';
import type { Section } from '../../sim/survival';
import { SOUND_DESIGN, type ArrangementPatch } from '../../sound';
import { createGate } from '../gate';
import { createGraph, type Output } from '../graph';
import type { MusicBus } from '../musicBus';

export interface Arrangement {
  /**
   * Called on every bar line with the section the bar should play; `chordBar`
   * is where the progression is (it restarts with the song).
   */
  onBar: (
    section: Section,
    at: { time: number; bar: number; chordBar: number },
  ) => void;
  /** Play a drop's hit or a riser on its own, for auditioning. */
  drop: (time: number) => void;
  riser: (time: number) => void;
  /**
   * The circle charging: a riser over `seconds` with the track's filter
   * riding open under it, into the slam's drop.
   */
  charge: (time: number, seconds: number) => void;
  dispose: () => void;
}

/** How open the track is per section, in Hz. */
const opennessOf = (patch: ArrangementPatch) =>
  ({
    calm: patch.calmHz,
    groove: patch.grooveHz,
    build: 20000,
    drop: 20000,
  }) satisfies Record<Section, number>;

/**
 * Combat intensity driving the track: a quiet room is filtered, piling
 * enemies open the filter over a riser, and a cleared wave lands a drop -
 * a crash and a sub boom on the bar line. Under it all a chord pad and air
 * fill the bed, pumped by the kick (`musicBus.bed`), louder as the fight
 * builds and pulled back in the drop to leave the bass room. Everything
 * changes on bars only.
 */
export const createArrangement = ({
  musicBus,
  output,
  barSeconds,
  rootHz,
  key,
  progression,
  patch = SOUND_DESIGN.arrangement,
}: {
  musicBus: MusicBus;
  output: Output;
  barSeconds: number;
  /** The level's root in octave 1, for the drop's sub boom. */
  rootHz: number;
  /** The level's key and chords, for the pad. */
  key: Key;
  progression: Progression;
  patch?: ArrangementPatch;
}): Arrangement => {
  const OPENNESS = opennessOf(patch);
  const graph = createGraph();
  const channel = graph.channel(patch.level, output);
  const noise = graph.noise('white');

  // A riser: noise swept up over two bars, swelling in.
  const riser = createGate(graph, {
    envelope: {
      attack: barSeconds * 1.8,
      decay: 0.05,
      sustain: 1,
      release: 0.05,
    },
    volume: patch.riserLevel,
    output: channel,
  });
  const riserFilter = graph.filter({
    type: 'bandpass',
    frequency: patch.riserFrom,
    Q: 2,
    output: riser.input,
  });
  noise.connect(riserFilter.input);

  // The drop: a long bright crash over a sub boom on the root.
  const crash = createGate(graph, {
    envelope: {
      attack: 0.002,
      decay: patch.crashDecay,
      sustain: 0,
      release: 0.2,
    },
    volume: patch.crashLevel,
    output: channel,
  });
  noise.connect(
    graph.filter({
      type: 'highpass',
      frequency: patch.crashHz,
      output: crash.input,
    }).input,
  );
  const boom = createGate(graph, {
    envelope: {
      attack: 0.002,
      decay: patch.boomDecay,
      sustain: 0,
      release: 0.1,
    },
    volume: patch.boomLevel,
    output: channel,
  });
  const boomOsc = graph.oscillator(
    { type: 'sine', frequency: rootHz },
    boom.input,
  );

  const bedNode = graph.gain(1, musicBus.bed);
  const bed = graph.param(bedNode.gain, 'decibels', patch.pad.calm);
  const padFilter = graph.filter({
    type: 'lowpass',
    frequency: patch.pad.hz,
    output: graph.volume(patch.pad.level, bedNode),
  });
  // One voice per chord note, gliding to the next chord on its bar line.
  const padChords = voiceProgression(key, progression, {
    shape: patch.pad.degrees,
    octave: patch.pad.octave,
  });
  const padVoices = padChords[0].map(note =>
    graph.fatOscillator(
      {
        type: 'sawtooth',
        frequency: midiToHz(note),
        count: 2,
        spread: patch.pad.detune,
        // Each note at its share, so a bigger chord isn't a louder one.
        volume: -20 * Math.log10(Math.max(patch.pad.degrees.length, 1)),
      },
      padFilter.input,
    ),
  );
  let padChord = padChords[0];
  const moveTo = (chordBar: number, time: number) => {
    const next =
      padChords[progression.chords.indexOf(chordAt(progression, chordBar))];
    if (next === padChord) return;
    padVoices.forEach(({ frequency }, i) => {
      frequency.setValueAtTime(midiToHz(padChord[i]), time);
      frequency.exponentialRampToValueAtTime(
        midiToHz(next[i]),
        time + patch.pad.glide,
      );
    });
    padChord = next;
  };
  noise.connect(
    graph.filter({
      type: 'highpass',
      frequency: patch.air.hz,
      output: graph.volume(patch.air.level, bedNode),
    }).input,
  );

  let current: Section = 'calm';
  musicBus.open(OPENNESS.calm, 0, 0);

  const startRiser = (time: number, length = barSeconds * 2) => {
    riser.envelope.attack = length * 0.9;
    riserFilter.frequency.cancelScheduledValues(time);
    riserFilter.frequency.setValueAtTime(patch.riserFrom, time);
    riserFilter.frequency.exponentialRampToValueAtTime(
      patch.riserTo,
      time + length,
    );
    riser.envelope.triggerAttackRelease(length - 0.05, time);
  };

  const drop = (time: number) => {
    crash.envelope.triggerAttackRelease(0.05, time);
    boomOsc.frequency.cancelScheduledValues(time);
    boomOsc.frequency.setValueAtTime(rootHz * 2, time);
    boomOsc.frequency.exponentialRampToValueAtTime(rootHz, time + 0.25);
    boom.envelope.triggerAttackRelease(0.1, time);
  };

  return {
    onBar: (section, { time, bar, chordBar }) => {
      moveTo(chordBar, time);
      const entering = section !== current;
      if (section === 'build') {
        if (entering) musicBus.open(OPENNESS.build, time, barSeconds * 2);
        if (entering || bar % 2 === 0) startRiser(time);
      } else if (entering) {
        // Build-ups ride the filter up over two bars; everything else snaps
        // to the bar, so a drop hits open.
        musicBus.open(
          OPENNESS[section],
          time,
          section === 'drop' ? 0 : barSeconds,
        );
      }
      if (entering) bed.rampTo(patch.pad[section], barSeconds, time);
      if (entering && section === 'drop') drop(time);
      current = section;
    },
    drop,
    riser: time => startRiser(time),
    charge: (time, seconds) => {
      startRiser(time, seconds);
      musicBus.open(OPENNESS.build, time, seconds);
    },
    dispose: graph.dispose,
  };
};

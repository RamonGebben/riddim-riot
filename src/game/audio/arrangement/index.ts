import {
  Channel,
  FatOscillator,
  Filter,
  Noise,
  Oscillator,
  Volume,
  type ToneAudioNode,
} from 'tone';
import { degreeToMidi, midiToHz, type Key } from '../../music';
import type { Section } from '../../sim/survival';
import { SOUND_DESIGN, type ArrangementPatch } from '../../sound';
import { createGate } from '../gate';
import type { MusicBus } from '../musicBus';

export interface Arrangement {
  /** Called on every bar line with the section the bar should play. */
  onBar: (
    section: Section,
    { time, bar }: { time: number; bar: number },
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
  patch = SOUND_DESIGN.arrangement,
}: {
  musicBus: MusicBus;
  output: ToneAudioNode;
  barSeconds: number;
  /** The level's root in octave 1, for the drop's sub boom. */
  rootHz: number;
  /** The level's key, for the pad's chord. */
  key: Key;
  patch?: ArrangementPatch;
}): Arrangement => {
  const OPENNESS = opennessOf(patch);
  const channel = new Channel({ volume: patch.level }).connect(output);
  const noise = new Noise('white').start();

  // A riser: noise swept up over two bars, swelling in.
  const riserFilter = new Filter({
    type: 'bandpass',
    frequency: patch.riserFrom,
    Q: 2,
  });
  const riser = createGate({
    envelope: {
      attack: barSeconds * 1.8,
      decay: 0.05,
      sustain: 1,
      release: 0.05,
    },
    volume: patch.riserLevel,
    output: channel,
  });
  noise.chain(riserFilter, riser.input);

  // The drop: a long bright crash over a sub boom on the root.
  const crashFilter = new Filter({
    type: 'highpass',
    frequency: patch.crashHz,
  });
  const crash = createGate({
    envelope: {
      attack: 0.002,
      decay: patch.crashDecay,
      sustain: 0,
      release: 0.2,
    },
    volume: patch.crashLevel,
    output: channel,
  });
  noise.chain(crashFilter, crash.input);
  const boomOsc = new Oscillator({ type: 'sine', frequency: rootHz }).start();
  const boom = createGate({
    envelope: {
      attack: 0.002,
      decay: patch.boomDecay,
      sustain: 0,
      release: 0.1,
    },
    volume: patch.boomLevel,
    output: channel,
  });
  boomOsc.connect(boom.input);

  const bed = new Volume(patch.pad.calm).connect(musicBus.bed);
  const padLevel = new Volume(patch.pad.level).connect(bed);
  const padFilter = new Filter({
    type: 'lowpass',
    frequency: patch.pad.hz,
  }).connect(padLevel);
  const pad = patch.pad.degrees.map(degree =>
    new FatOscillator({
      type: 'sawtooth',
      frequency: midiToHz(degreeToMidi(key, degree, patch.pad.octave)),
      count: 2,
      spread: patch.pad.detune,
      // Each note at its share, so a bigger chord isn't a louder one.
      volume: -20 * Math.log10(Math.max(patch.pad.degrees.length, 1)),
    })
      .connect(padFilter)
      .start(),
  );
  const airLevel = new Volume(patch.air.level).connect(bed);
  const airFilter = new Filter({
    type: 'highpass',
    frequency: patch.air.hz,
  }).connect(airLevel);
  noise.connect(airFilter);

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

  const nodes = [
    noise,
    riserFilter,
    riser,
    crashFilter,
    crash,
    boomOsc,
    boom,
    ...pad,
    padFilter,
    padLevel,
    airFilter,
    airLevel,
    bed,
    channel,
  ];

  return {
    onBar: (section, { time, bar }) => {
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
      if (entering) bed.volume.rampTo(patch.pad[section], barSeconds, time);
      if (entering && section === 'drop') drop(time);
      current = section;
    },
    drop,
    riser: time => startRiser(time),
    charge: (time, seconds) => {
      startRiser(time, seconds);
      musicBus.open(OPENNESS.build, time, seconds);
    },
    dispose: () => nodes.forEach(node => node.dispose()),
  };
};

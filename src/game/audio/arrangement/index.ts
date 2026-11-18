import { Channel, Filter, Noise, Oscillator, type ToneAudioNode } from 'tone';
import type { Section } from '../../sim/waves';
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
 * a crash and a sub boom on the bar line. Everything changes on bars only.
 */
export const createArrangement = ({
  musicBus,
  output,
  barSeconds,
  rootHz,
  patch = SOUND_DESIGN.arrangement,
}: {
  musicBus: MusicBus;
  output: ToneAudioNode;
  barSeconds: number;
  /** The level's root in octave 1, for the drop's sub boom. */
  rootHz: number;
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

  let current: Section = 'calm';
  musicBus.open(OPENNESS.calm, 0, 0);

  const startRiser = (time: number) => {
    const length = barSeconds * 2;
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
      if (entering && section === 'drop') drop(time);
      current = section;
    },
    drop,
    riser: startRiser,
    dispose: () => nodes.forEach(node => node.dispose()),
  };
};

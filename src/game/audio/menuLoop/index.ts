import { getTransport, Offline } from 'tone';
import type { DrumStyle } from '../../genre';
import { STEPS_PER_BAR, toPosition } from '../../grid';
import type { Progression } from '../../harmony';
import type { Key } from '../../music';
import type { Section, SongPart } from '../../sim/survival';
import { SOUND_DESIGN, type SoundDesign } from '../../sound';
import { createArrangement } from '../arrangement';
import { createDrums } from '../drums';
import { createMusicBus } from '../musicBus';
import { offlineTurn } from '../offline';
import { createBacking } from '../voices';

/** Where the track is, to loop the bar it's on. */
export interface TrackMoment {
  seed: number;
  key: Key;
  progression: Progression;
  bpm: number;
  /** The level's root in octave 1: the kick's and the drop boom's pitch. */
  rootHz: number;
  /** The Transport bar being played: the drums' pattern. */
  bar: number;
  /** Bars into the progression. */
  chordBar: number;
  section: Section;
  part: SongPart | null;
  /** The drums are in (the slam has happened). */
  drums: boolean;
  /** How the level's subgenre plays the drums. */
  drumStyle?: DrumStyle;
}

/**
 * The track as it stands - drums, pad, air and backing, in the section the
 * level is in - over the whole turn of the chord progression it's on (4 or
 * 8 bars), rendered offline and ready to loop seamlessly. One bar looping
 * was heard as a stuck record; a full turn of the chords sounds complete.
 * The bar before the turn is played first to warm the voices up (pads
 * glide in, a drop hits on entering), and only the turn after it is kept.
 * Queued behind any other offline render.
 */
export const renderMenuLoop = (
  moment: TrackMoment,
  design: SoundDesign = SOUND_DESIGN,
): Promise<AudioBuffer> =>
  offlineTurn(async () => {
    const stepSeconds = 60 / moment.bpm / 4;
    const barSeconds = stepSeconds * STEPS_PER_BAR;
    const bars = moment.progression.bars;
    // The turn the current bar is in, from its first chord.
    const into = ((moment.chordBar % bars) + bars) % bars;
    const firstBar = moment.bar - into;
    const firstChordBar = moment.chordBar - into;
    const rendered = await Offline(
      () => {
        getTransport().bpm.value = moment.bpm;
        const musicBus = createMusicBus();
        const drums = createDrums({
          seed: moment.seed,
          style: moment.drumStyle,
          output: musicBus.input,
          kickHz: moment.rootHz,
          onHit: hit => {
            if (hit.voice === 'kick')
              musicBus.pump(hit.time, hit.velocity, design.mix);
          },
        });
        const arrangement = createArrangement({
          musicBus,
          output: musicBus.input,
          barSeconds,
          rootHz: moment.rootHz,
          key: moment.key,
          progression: moment.progression,
        });
        const backing = createBacking({
          output: musicBus.bed,
          key: moment.key,
          seed: moment.seed,
          progression: moment.progression,
          stepSeconds,
        });
        // The warm-up bar plays the bar before the turn, then the turn,
        // then the bar after it, which the seam crossfades from.
        Array.from({ length: bars + 2 }, (_, offset) => {
          const time = offset * barSeconds;
          const bar = firstBar - 1 + offset;
          const chordBar = firstChordBar - 1 + offset;
          arrangement.onBar(moment.section, { time, bar, chordBar });
          backing.onBar({ time, bar: chordBar, part: moment.part });
          if (!moment.drums) return;
          Array.from({ length: STEPS_PER_BAR }, (_, stepInBar) => {
            const step = bar * STEPS_PER_BAR + stepInBar;
            drums.onTick({
              ...toPosition(step),
              step,
              time: time + stepInBar * stepSeconds,
            });
          });
        });
        getTransport().start(0);
      },
      // A seam's spare past the end: the offline length truncates, and the
      // crossfade reads up to a sample past the rounded bars plus the seam.
      barSeconds * (bars + 1) + design.menu.seam * 2,
    );
    const source = rendered.get();
    if (!source) throw new Error('The loop rendered nothing');
    const start = Math.round(barSeconds * source.sampleRate);
    const length = Math.round(barSeconds * bars * source.sampleRate);
    const seam = Math.round(design.menu.seam * source.sampleRate);
    const loop = new AudioBuffer({
      numberOfChannels: source.numberOfChannels,
      length,
      sampleRate: source.sampleRate,
    });
    // Brought down to the design's loudness, never up: the bar comes off
    // the same bus as the game's, so as rendered it's as loud as the track
    // was. Levelling a calm bar (a pad alone, -41 dB RMS) up to it opened
    // the menu ~17 dB over the ambience the player had been hearing.
    const kept = source.getChannelData(0).subarray(start, start + length);
    const power =
      kept.reduce((sum, sample) => sum + sample * sample, 0) / kept.length;
    const rmsDb = 10 * Math.log10(Math.max(power, 1e-12));
    const gain = 10 ** (Math.min(design.menu.level - rmsDb, 0) / 20);
    Array.from({ length: source.numberOfChannels }, (_, channel) => {
      const from = source.getChannelData(channel);
      const to = loop.getChannelData(channel);
      to.set(from.subarray(start, start + length));
      // The loop's start fades in under what follows its end, so the end
      // runs straight into the start again.
      Array.from({ length: seam }, (_, i) => {
        const fade = i / seam;
        to[i] =
          from[start + i] * Math.sin((fade * Math.PI) / 2) +
          from[start + length + i] * Math.cos((fade * Math.PI) / 2);
      });
      to.forEach((sample, i) => (to[i] = sample * gain));
    });
    return loop;
  });

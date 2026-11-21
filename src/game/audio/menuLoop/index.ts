import { getTransport, Offline } from 'tone';
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
}

/**
 * One bar of the track as it stands - drums, pad, air and backing, in the
 * section and chord the level is in - rendered offline and ready to loop
 * seamlessly. A bar is played first to warm the voices up (pads glide in,
 * a drop hits on entering), and only the bar after it is kept. Queued
 * behind any other offline render.
 */
export const renderMenuLoop = (
  moment: TrackMoment,
  design: SoundDesign = SOUND_DESIGN,
): Promise<AudioBuffer> =>
  offlineTurn(async () => {
    const stepSeconds = 60 / moment.bpm / 4;
    const barSeconds = stepSeconds * STEPS_PER_BAR;
    const rendered = await Offline(
      () => {
        getTransport().bpm.value = moment.bpm;
        const musicBus = createMusicBus();
        const drums = createDrums({
          seed: moment.seed,
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
        // The warm-up bar plays the bar before, the loop the bar itself.
        [0, 1, 2].forEach(offset => {
          const time = offset * barSeconds;
          const bar = moment.bar - 1 + offset;
          const chordBar = moment.chordBar - 1 + offset;
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
      // crossfade reads up to a sample past two rounded bars plus the seam.
      barSeconds * 2 + design.menu.seam * 2,
    );
    const source = rendered.get();
    if (!source) throw new Error('The loop rendered nothing');
    const start = Math.round(barSeconds * source.sampleRate);
    const length = Math.round(barSeconds * source.sampleRate);
    const seam = Math.round(design.menu.seam * source.sampleRate);
    const loop = new AudioBuffer({
      numberOfChannels: source.numberOfChannels,
      length,
      sampleRate: source.sampleRate,
    });
    // Levelled to the design's loudness: a calm bar rendered from a pad
    // alone measured -41 dB RMS, and played as it was it couldn't be heard.
    const kept = source.getChannelData(0).subarray(start, start + length);
    const power =
      kept.reduce((sum, sample) => sum + sample * sample, 0) / kept.length;
    const rmsDb = 10 * Math.log10(Math.max(power, 1e-12));
    const gain = 10 ** ((design.menu.level - rmsDb) / 20);
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

import { SOUND_DESIGN, type MenuPatch } from '../../sound';
import { clipOf, encodeWav, layClips, type Clip } from '../clip';

/** Beats in the looped bar: previews start on the next one. */
const LOOP_BEATS = 4;
/**
 * How long a clip gets to load before a preview gives up on it. Only a
 * guard against a hang: a bar's file took over a second on a busy machine.
 */
const START_WAIT_MS = 5000;
/** How often the highlight checks which bar is sounding. */
const WATCH_MS = 25;
/** Steps a fade takes, on its timer: fine enough not to be heard. */
const FADE_STEPS = 20;

const dbToGain = (db: number) => 10 ** (db / 20);

/** A clip as a file a media element can play; revoke it when done. */
const urlOf = (clip: Clip) =>
  URL.createObjectURL(new Blob([encodeWav(clip)], { type: 'audio/wav' }));

/** A moment of silence, played inside a press to unlock an element. */
const SILENCE = `data:audio/wav;base64,${btoa(
  String.fromCharCode(
    ...new Uint8Array(
      encodeWav({ channels: [new Float32Array(1)], sampleRate: 8000 }),
    ),
  ),
)}`;

/** Resolves once the element can play through, rejects if it can't. */
const loaded = (element: HTMLAudioElement) =>
  new Promise<void>((resolve, reject) => {
    const done = (fail?: string) => {
      clearTimeout(timer);
      element.removeEventListener('canplaythrough', ok);
      element.removeEventListener('error', failed);
      if (fail) reject(new Error(fail));
      else resolve();
    };
    const ok = () => done();
    const failed = () => done('The preview sound failed to load');
    const timer = setTimeout(
      () => done('The preview sound took too long to load'),
      START_WAIT_MS,
    );
    if (element.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) done();
    element.addEventListener('canplaythrough', ok);
    element.addEventListener('error', failed);
  });

/** Empties an element, so it holds no file and plays nothing. */
const empty = (element: HTMLAudioElement) => {
  element.pause();
  element.removeAttribute('src');
  element.load();
};

/**
 * A bar looping under the low-pass, baked: the bar plays twice through the
 * filter and the second pass is kept, so the filter has settled across the
 * loop point.
 */
const filtered = async (bar: AudioBuffer, patch: MenuPatch): Promise<Clip> => {
  const offline = new OfflineAudioContext(
    bar.numberOfChannels,
    bar.length * 2,
    bar.sampleRate,
  );
  const source = offline.createBufferSource();
  source.buffer = bar;
  source.loop = true;
  const filter = offline.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = patch.hz;
  filter.Q.value = patch.resonance;
  source.connect(filter).connect(offline.destination);
  source.start(0);
  const rendered = clipOf(await offline.startRendering());
  return {
    ...rendered,
    channels: rendered.channels.map(samples => samples.slice(bar.length)),
  };
};

export interface PreviewOptions {
  /** How far before its first shot a rendered bar starts. */
  leadIn: number;
  /** A bar has started sounding: `turn` counts bars from 0. */
  onTurn?: (turn: number) => void;
  /** Ended, or cut off by another preview or `stop`. */
  onEnd: () => void;
}

/** Plays the menu's loop and weapon previews over it, one at a time. */
export interface Previewer {
  /**
   * Make sure the loop and previews can play. Call it inside the press:
   * Safari only lets an element play from a press, and the sound arrives
   * after it.
   */
  prime: () => void;
  /** Loop a bar of the track under the menu's low-pass, fading in. */
  startLoop: (bar: AudioBuffer) => void;
  /** Fade the loop out. */
  stopLoop: () => void;
  /**
   * Play a preview from the top, cutting off the one before. With the loop
   * running it starts on the loop's next beat, `leadIn` early so its first
   * shot lands on it. Resolves once it sounds; rejects if the browser won't
   * let it.
   */
  play: (buffer: AudioBuffer, options: PreviewOptions) => Promise<void>;
  /**
   * An A/B: `a` for a bar, then `b` the bar after, back and forth on the
   * bar grid until stopped. Starts on the loop's next beat like `play`.
   */
  alternate: (
    a: AudioBuffer,
    b: AudioBuffer,
    options: PreviewOptions,
  ) => Promise<void>;
  stop: () => void;
  dispose: () => void;
}

/**
 * Plays through media elements, not an AudioContext: the loadout menu
 * freezes the level by suspending the game's context, and Firefox on the
 * desktop then holds every context on the page silent, while elements
 * still sound. So the loop and previews are baked into WAV files - the
 * low-pass, the level and an A/B's two bars included - and the elements
 * only play them. An A/B is one two-bar file looping, so its turns stay
 * exact; only a preview's start on the loop's beat follows a timer.
 */
export const createPreviewer = ({
  barSeconds,
  patch = SOUND_DESIGN.menu,
}: {
  /** A bar at the game's tempo: an A/B's turns, without a loop to go by. */
  barSeconds: number;
  patch?: MenuPatch;
}): Previewer => {
  let elements: { loop: HTMLAudioElement; preview: HTMLAudioElement } | null =
    null;
  let loop: {
    url: string | null;
    beatSeconds: number;
    fade: ReturnType<typeof setInterval> | null;
  } | null = null;
  /** The last loop's fade out and its file, until it's done. */
  let fadingOut: {
    timer: ReturnType<typeof setInterval>;
    url: string | null;
  } | null = null;
  /** Cuts the last loop's fade out short, letting its file go. */
  const endFadeOut = () => {
    if (!fadingOut) return;
    clearInterval(fadingOut.timer);
    if (fadingOut.url) URL.revokeObjectURL(fadingOut.url);
    fadingOut = null;
  };
  /** What's sounding: its file, its timers, and who to tell it ended. */
  let playing: {
    url: string;
    timers: Array<ReturnType<typeof setTimeout>>;
    onEnd: () => void;
  } | null = null;

  const elementsOf = () => {
    elements ??= { loop: new Audio(), preview: new Audio() };
    return elements;
  };

  /** Ramps an element's volume on a timer: a fade, not musical timing. */
  const fade = (
    element: HTMLAudioElement,
    to: number,
    then: () => void = () => {},
  ) => {
    const from = element.volume;
    const steps = Math.max(Math.round(FADE_STEPS * Math.min(patch.fade, 1)), 1);
    let step = 0;
    const timer = setInterval(
      () => {
        step += 1;
        // Clamped: the sum can land an ulp outside 0-1, which throws.
        element.volume = Math.min(
          Math.max(from + ((to - from) * step) / steps, 0),
          1,
        );
        if (step < steps) return;
        clearInterval(timer);
        then();
      },
      (patch.fade * 1000) / steps,
    );
    return timer;
  };

  const stop = () => {
    if (!playing) return;
    const { url, timers, onEnd } = playing;
    playing = null;
    timers.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    if (elements) {
      elements.preview.onended = null;
      empty(elements.preview);
    }
    URL.revokeObjectURL(url);
    onEnd();
  };

  const stopLoop = () => {
    if (!loop || !elements) return;
    const { url, fade: fading } = loop;
    loop = null;
    if (fading) clearInterval(fading);
    const element = elements.loop;
    endFadeOut();
    fadingOut = {
      url,
      timer: fade(element, 0, () => {
        fadingOut = null;
        empty(element);
        if (url) URL.revokeObjectURL(url);
      }),
    };
  };

  /**
   * How long to wait before starting a clip that opens `leadIn` before its
   * first shot, so the shot lands on the loop's next beat.
   */
  const untilBeat = (leadIn: number) => {
    if (!loop?.url || !elements) return 0;
    const { beatSeconds } = loop;
    const at = elements.loop.currentTime;
    const beat =
      Math.ceil((at + leadIn + patch.ahead) / beatSeconds) * beatSeconds;
    return beat - leadIn - at;
  };

  /**
   * Plays `clip`, once or looping, from the loop's next beat; tells each
   * bar it reaches, counting on across loops.
   */
  const sound = async (
    clip: Clip,
    { looping, bar }: { looping: boolean; bar: number },
    { leadIn, onTurn, onEnd }: PreviewOptions,
  ) => {
    stop();
    const element = elementsOf().preview;
    const url = urlOf(clip);
    const current = { url, timers: [], onEnd } as NonNullable<typeof playing>;
    playing = current;
    element.src = url;
    element.loop = looping;
    element.volume = 1;
    element.load();
    try {
      await loaded(element);
    } catch (error) {
      // Cut off meanwhile: nothing failed, it just isn't wanted.
      if (playing !== current) return;
      // Failed, not ended: telling it ended would hide the error.
      current.onEnd = () => {};
      stop();
      throw error;
    }
    if (playing !== current) return;
    await new Promise<void>(resolve =>
      current.timers.push(setTimeout(resolve, untilBeat(leadIn) * 1000)),
    );
    if (playing !== current) return;
    element.onended = () => {
      if (playing !== current) return;
      // Ended by itself: clear up without cutting anything off.
      playing = null;
      current.timers.forEach(clearInterval);
      element.onended = null;
      empty(element);
      URL.revokeObjectURL(url);
      onEnd();
    };
    try {
      await element.play();
    } catch (error) {
      // Cut off meanwhile: nothing failed, it just isn't wanted.
      if (playing !== current) return;
      // Failed, not ended: telling it ended would hide the error.
      current.onEnd = () => {};
      stop();
      throw error;
    }
    // Only the highlight follows a timer; the sound is all in the file.
    let last = -1;
    let turn = -1;
    current.timers.push(
      setInterval(() => {
        if (playing !== current || element.currentTime < leadIn) return;
        const index = Math.floor((element.currentTime - leadIn) / bar);
        if (index === last) return;
        last = index;
        turn += 1;
        onTurn?.(turn);
      }, WATCH_MS),
    );
  };

  const level = dbToGain(patch.previewLevel);

  return {
    prime: () => {
      const { loop: looping, preview } = elementsOf();
      [looping, preview]
        .filter(element => !element.src)
        .forEach(element => {
          element.src = SILENCE;
          void element.play().catch(() => {});
        });
    },
    startLoop: bar => {
      stopLoop();
      // The new loop takes the element over; the old one stops at once.
      endFadeOut();
      const current = {
        url: null as string | null,
        beatSeconds: bar.duration / LOOP_BEATS,
        fade: null as ReturnType<typeof setInterval> | null,
      };
      loop = current;
      void filtered(bar, patch)
        .then(async clip => {
          if (loop !== current) return;
          const element = elementsOf().loop;
          const url = urlOf(clip);
          current.url = url;
          element.src = url;
          element.loop = true;
          element.volume = 0;
          element.load();
          await loaded(element);
          if (loop !== current) return;
          await element.play();
          current.fade = fade(element, 1);
        })
        .catch((error: unknown) => console.error(error));
    },
    stopLoop,
    play: (buffer, options) => {
      const clip = clipOf(buffer);
      return sound(
        layClips([{ clip, at: 0 }], { seconds: buffer.duration, gain: level }),
        { looping: false, bar: buffer.duration },
        options,
      );
    },
    alternate: (a, b, options) => {
      const bar = loop ? loop.beatSeconds * LOOP_BEATS : barSeconds;
      return sound(
        layClips(
          [
            { clip: clipOf(a), at: 0 },
            { clip: clipOf(b), at: bar },
          ],
          { seconds: bar * 2, gain: level, wrap: true },
        ),
        { looping: true, bar },
        options,
      );
    },
    stop,
    dispose: () => {
      stop();
      endFadeOut();
      if (loop?.fade) clearInterval(loop.fade);
      if (loop?.url) URL.revokeObjectURL(loop.url);
      loop = null;
      if (elements) [elements.loop, elements.preview].forEach(empty);
      elements = null;
    },
  };
};

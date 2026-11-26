import { SOUND_DESIGN, type MenuPatch } from '../../sound';
import { clipOf, encodeWav, layClips, type Clip } from '../clip';

/** Beats in a bar: previews start on the loop's next one. */
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

/**
 * Resolves once the element can play, rejects if it can't. `canplay` is
 * enough: the whole file is already in memory. `canplaythrough` is the
 * browser's guess at the download keeping up, and Firefox sometimes made
 * it past the wait.
 */
const loaded = (element: HTMLAudioElement) =>
  new Promise<void>((resolve, reject) => {
    const done = (fail?: string) => {
      clearTimeout(timer);
      element.removeEventListener('canplay', ok);
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
    element.addEventListener('canplay', ok);
    element.addEventListener('error', failed);
    if (element.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) done();
  });

/** Empties an element, so it holds no file and plays nothing. */
const empty = (element: HTMLAudioElement) => {
  element.pause();
  element.removeAttribute('src');
  element.load();
};

/**
 * The track looping under the low-pass, baked: it plays twice through the
 * filter and the second pass is kept, so the filter has settled across the
 * loop point.
 */
const filtered = async (
  track: AudioBuffer,
  patch: MenuPatch,
): Promise<Clip> => {
  const offline = new OfflineAudioContext(
    track.numberOfChannels,
    track.length * 2,
    track.sampleRate,
  );
  const source = offline.createBufferSource();
  source.buffer = track;
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
    channels: rendered.channels.map(samples => samples.slice(track.length)),
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
  /**
   * Bake the track (whole bars at the game's tempo) under the menu's
   * low-pass and load it, so the next `startLoop` sounds at once. The
   * latest one prepared wins; one arriving while the loop sounds takes
   * over the next time it starts.
   */
  prepareLoop: (track: AudioBuffer) => void;
  /**
   * Loop the prepared track, fading in; with none ready yet, as soon as
   * one is. Already looping, it plays on.
   */
  startLoop: () => void;
  /** Fade the loop out; it starts from the top next time. */
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
  /** A bar at the game's tempo: the loop's beat and an A/B's turns. */
  barSeconds: number;
  patch?: MenuPatch;
}): Previewer => {
  let elements: { loop: HTMLAudioElement; preview: HTMLAudioElement } | null =
    null;
  /** The loop's file on its element, and one waiting to take over. */
  const loop: {
    url: string | null;
    next: string | null;
    /** Bumped by each prepare, so a slow bake can't overtake a newer one. */
    version: number;
    /** Wanted sounding: between `startLoop` and `stopLoop`. */
    on: boolean;
    fade: ReturnType<typeof setInterval> | null;
  } = { url: null, next: null, version: 0, on: false, fade: null };
  /** What's sounding: its file, its timers, and who to tell it ended. */
  let playing: {
    url: string;
    timers: Array<ReturnType<typeof setTimeout>>;
    onEnd: () => void;
  } | null = null;

  let disposed = false;

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

  const endLoopFade = () => {
    if (loop.fade) clearInterval(loop.fade);
    loop.fade = null;
  };

  /**
   * The loop's own file is playing (fading out included): not the moment
   * of silence a press primes the element with.
   */
  const loopSounding = () =>
    elements !== null &&
    loop.url !== null &&
    !elements.loop.paused &&
    elements.loop.src === loop.url;

  /** Puts the waiting file on the loop's element, loading it. */
  const takeNext = () => {
    if (!loop.next) return;
    const element = elementsOf().loop;
    if (loop.url) URL.revokeObjectURL(loop.url);
    loop.url = loop.next;
    loop.next = null;
    element.src = loop.url;
    element.loop = true;
    element.preload = 'auto';
    element.load();
  };

  /** Fades the loaded loop in, from the top unless it's still fading out. */
  const soundLoop = () => {
    if (!loop.url || !elements) return;
    const element = elements.loop;
    endLoopFade();
    if (!loopSounding()) {
      element.volume = 0;
      element.currentTime = 0;
      element.play().catch((error: unknown) => {
        // Stopped meanwhile (paused under play()): not wanted.
        if (loop.on) console.error(error);
      });
    }
    loop.fade = fade(element, 1);
  };

  const startLoop = () => {
    loop.on = true;
    // Silent, so a newer file can take over without a jump.
    if (!loopSounding()) takeNext();
    soundLoop();
  };

  const stopLoop = () => {
    if (!loop.on) return;
    loop.on = false;
    endLoopFade();
    if (!elements) return;
    const element = elements.loop;
    loop.fade = fade(element, 0, () => {
      loop.fade = null;
      element.pause();
      takeNext();
    });
  };

  const prepareLoop = (track: AudioBuffer) => {
    const version = ++loop.version;
    void filtered(track, patch)
      .then(clip => {
        if (version !== loop.version || disposed) return;
        if (loop.next) URL.revokeObjectURL(loop.next);
        loop.next = urlOf(clip);
        // Sounding or fading out: it takes over once that's done.
        if (loopSounding()) return;
        takeNext();
        if (loop.on) soundLoop();
      })
      .catch((error: unknown) => console.error(error));
  };

  /**
   * How long to wait before starting a clip that opens `leadIn` before its
   * first shot, so the shot lands on the loop's next beat.
   */
  const untilBeat = (leadIn: number) => {
    if (!loop.on || !elements || !loopSounding()) return 0;
    const beatSeconds = barSeconds / LOOP_BEATS;
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
    prepareLoop,
    startLoop,
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
      const bar = barSeconds;
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
      disposed = true;
      loop.on = false;
      endLoopFade();
      [loop.url, loop.next].forEach(url => url && URL.revokeObjectURL(url));
      loop.url = null;
      loop.next = null;
      if (elements) [elements.loop, elements.preview].forEach(empty);
      elements = null;
    },
  };
};

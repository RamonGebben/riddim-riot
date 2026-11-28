import type { Page } from '@playwright/test';

interface Watched {
  audioContexts: Array<AudioContext>;
  filesPlayed: Array<HTMLMediaElement>;
}

/**
 * Every realtime AudioContext the page makes, and every rendered file a
 * media element starts playing: to see the game freeze, the menu's loop
 * come in and a preview play, or explain a stall.
 */
export const watchAudio = (page: Page) =>
  page.addInitScript(() => {
    const contexts: Array<AudioContext> = [];
    const played: Array<HTMLMediaElement> = [];
    Object.assign(window, { audioContexts: contexts, filesPlayed: played });
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options);
        contexts.push(this);
      }
    };
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      // Rendered sound comes as a blob; the unlocking silence doesn't.
      if (this.src.startsWith('blob:')) played.push(this);
      return play.call(this);
    };
  });

/** The state of the latest context: the game's. */
export const gameAudioState = (page: Page) =>
  page.evaluate(
    () => (window as unknown as Watched).audioContexts.at(-1)?.state,
  );

export const contextCount = (page: Page) =>
  page.evaluate(() => (window as unknown as Watched).audioContexts.length);

/** Each context's state and clock, e.g. "running 12.41s". */
export const audioClock = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as Watched).audioContexts
      .map(context => `${context.state} ${context.currentTime.toFixed(2)}s`)
      .join(', '),
  );

/** The rendered files sounding now: looping (the loop) or not (a preview). */
export const sounding = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as Watched).filesPlayed
      .filter(element => !element.paused && element.src.startsWith('blob:'))
      .map(element => (element.loop ? 'loop' : 'preview'))
      .sort(),
  );

/**
 * How long the menu's looping file runs, in seconds: null with none, NaN
 * while it can't be told. Read from the element, or - when the browser
 * won't say (Linux WebKit's media backend leaves a blob's duration NaN
 * long after it plays) - from the WAV's own header: its byte rate and data
 * size.
 */
export const loopSeconds = (page: Page) =>
  page.evaluate(async () => {
    const element = (window as unknown as Watched).filesPlayed.find(
      candidate =>
        !candidate.paused &&
        candidate.loop &&
        candidate.src.startsWith('blob:'),
    );
    if (!element) return null;
    if (Number.isFinite(element.duration)) return element.duration;
    try {
      const header = new DataView(
        await (
          await (await fetch(element.src)).blob()
        )
          .slice(0, 44)
          .arrayBuffer(),
      );
      const byteRate = header.getUint32(28, true);
      const bytes = header.getUint32(40, true);
      return byteRate > 0 ? bytes / byteRate : Number.NaN;
    } catch {
      // Revoked as a newer loop took its place: ask again on the next poll.
      return Number.NaN;
    }
  });

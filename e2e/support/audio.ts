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

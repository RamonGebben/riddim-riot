import { SOUND_DESIGN, type MenuPatch } from '../../sound';

/** Beats in the looped bar: previews start on the next one. */
const LOOP_BEATS = 4;
/** Scheduling headroom, so a start never lands in the past. */
const AHEAD = 0.03;
/** How long a held-back context gets to start before a preview gives up. */
const START_WAIT_MS = 1000;
/** Rates to run at: whichever one the game's context isn't using. */
const RATES = [48000, 44100];

const dbToGain = (db: number) => 10 ** (db / 20);

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
   * Make sure the preview context exists and runs. Call it inside the
   * press: Safari only starts a context during the gesture itself.
   */
  prime: () => void;
  /** Loop a bar of the track under the menu's low-pass, fading in. */
  startLoop: (bar: AudioBuffer) => void;
  /** Fade the loop out. */
  stopLoop: () => void;
  /**
   * Play a preview from the top, cutting off the one before. With the loop
   * running it starts on the loop's next beat, `leadIn` early so its first
   * shot lands on it. Rejects if the browser won't let the sound start.
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
 * A context of its own, apart from the game's: the loadout menu freezes the
 * level by suspending the game's context, and the loop and previews have to
 * sound anyway. It runs at another sample rate than the game's: Firefox
 * mixes contexts of one rate in one graph, and a suspended context holds
 * that graph's output silent for every other context in it. It only plays
 * finished buffers through a filter and two gains, so it's built from plain
 * browser nodes, not Tone's.
 */
export const createPreviewer = ({
  barSeconds,
  gameRate,
  patch = SOUND_DESIGN.menu,
}: {
  /** A bar at the game's tempo: an A/B's turns, without a loop to go by. */
  barSeconds: number;
  /** The game context's sample rate, to keep apart from. */
  gameRate: number;
  patch?: MenuPatch;
}): Previewer => {
  let context: AudioContext | null = null;
  let loop: {
    source: AudioBufferSourceNode;
    fader: GainNode;
    filter: BiquadFilterNode;
    startedAt: number;
    beatSeconds: number;
  } | null = null;
  /** What's sounding: its sources, the gain they share, and its timers. */
  let playing: {
    sources: Set<AudioBufferSourceNode>;
    gain: GainNode;
    timers: Array<ReturnType<typeof setTimeout>>;
    onEnd: () => void;
  } | null = null;

  const stop = () => {
    if (!playing) return;
    const { sources, gain, timers, onEnd } = playing;
    playing = null;
    timers.forEach(clearTimeout);
    sources.forEach(source => {
      source.onended = null;
      source.stop();
      source.disconnect();
    });
    gain.disconnect();
    onEnd();
  };

  const stopLoop = () => {
    if (!loop || !context) return;
    const { source, fader, filter } = loop;
    loop = null;
    const now = context.currentTime;
    fader.gain.cancelScheduledValues(now);
    fader.gain.setValueAtTime(fader.gain.value, now);
    fader.gain.linearRampToValueAtTime(0, now + patch.fade);
    source.stop(now + patch.fade);
    source.onended = () => {
      [source, filter, fader].forEach(node => node.disconnect());
    };
  };

  /** When a preview's first shot should land: the loop's next beat. */
  const nextBeat = (now: number) => {
    if (!loop) return now + AHEAD;
    const { startedAt, beatSeconds } = loop;
    const beats = Math.ceil((now + AHEAD - startedAt) / beatSeconds);
    return startedAt + Math.max(beats, 0) * beatSeconds;
  };

  /**
   * The context, running. A context the browser held back (autoplay rules)
   * gets a moment to start from the press's resume; if it still hasn't, a
   * preview would schedule into a frozen clock - silent, and never ending -
   * so this says so instead.
   */
  const running = async () => {
    const audio = context;
    if (!audio) throw new Error('The preview sound was never started');
    if (audio.state !== 'running')
      await Promise.race([
        audio.resume(),
        new Promise(resolve => setTimeout(resolve, START_WAIT_MS)),
      ]);
    if (audio.state !== 'running')
      throw new Error('The browser held the preview sound back');
    return audio;
  };

  /**
   * Start sounding: `bufferFor(turn)` from the next beat, a bar a turn,
   * each turn queued as the one two before it ends. One turn plays once.
   */
  const sound = async (
    bufferFor: (turn: number) => AudioBuffer,
    turns: number,
    { leadIn, onTurn, onEnd }: PreviewOptions,
  ) => {
    stop();
    const audio = await running();
    // Another preview may have started while this one waited.
    stop();
    const gain = audio.createGain();
    gain.gain.value = dbToGain(patch.previewLevel);
    gain.connect(audio.destination);
    const current = {
      sources: new Set<AudioBufferSourceNode>(),
      gain,
      timers: [] as Array<ReturnType<typeof setTimeout>>,
      onEnd,
    };
    playing = current;
    const first = nextBeat(audio.currentTime);
    const bar = loop ? loop.beatSeconds * LOOP_BEATS : barSeconds;
    const queue = (turn: number) => {
      const at = first + turn * bar;
      const source = audio.createBufferSource();
      source.buffer = bufferFor(turn);
      source.connect(gain);
      current.sources.add(source);
      source.onended = () => {
        current.sources.delete(source);
        source.disconnect();
        if (playing !== current) return;
        if (turns === Infinity) queue(turn + 2);
        else if (current.sources.size === 0) {
          playing = null;
          gain.disconnect();
          onEnd();
        }
      };
      source.start(Math.max(at - leadIn, audio.currentTime));
      // Only the highlight follows a timer; the sound is on the audio clock.
      if (onTurn)
        current.timers.push(
          setTimeout(
            () => {
              if (playing === current) onTurn(turn);
            },
            Math.max(at - audio.currentTime, 0) * 1000,
          ),
        );
    };
    Array.from({ length: Math.min(turns, 2) }, (_, turn) => queue(turn));
  };

  return {
    prime: () => {
      context ??= new AudioContext({
        sampleRate: RATES.find(rate => rate !== gameRate),
      });
      if (context.state === 'suspended') void context.resume();
    },
    startLoop: bar => {
      if (!context) return;
      stopLoop();
      const now = context.currentTime + AHEAD;
      const source = context.createBufferSource();
      source.buffer = bar;
      source.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = patch.hz;
      filter.Q.value = patch.resonance;
      // The bar arrives levelled (see `renderMenuLoop`): fade in to it.
      const fader = context.createGain();
      fader.gain.setValueAtTime(0, now);
      fader.gain.linearRampToValueAtTime(1, now + patch.fade);
      source.connect(filter).connect(fader).connect(context.destination);
      source.start(now);
      loop = {
        source,
        fader,
        filter,
        startedAt: now,
        beatSeconds: bar.duration / LOOP_BEATS,
      };
    },
    stopLoop,
    play: (buffer, options) => sound(() => buffer, 1, options),
    alternate: (a, b, options) =>
      sound(turn => (turn % 2 === 0 ? a : b), Infinity, options),
    stop,
    dispose: () => {
      stop();
      stopLoop();
      void context?.close();
      context = null;
    },
  };
};

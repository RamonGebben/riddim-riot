import { Context, getContext, setContext, type BaseContext } from 'tone';

export interface Audio {
  suspend: () => Promise<void>;
  /** Settles once running, or after a short wait if the browser refuses. */
  resume: () => Promise<void>;
  /** `getOutputTimestamp()` of the browser's context, if it can be reached. */
  outputTimestamp: () => AudioTimestamp | undefined;
  /** Sound is coming out: the context's clock is moving. */
  running: () => boolean;
  /** Called whenever the context starts, stops or is held back; returns off. */
  onChange: (listener: () => void) => () => void;
}

/** Long enough for a resume the browser allows; a refused one never settles. */
const RESUME_WAIT_MS = 1000;

/**
 * The browser's own context under Tone's. Tone runs on a
 * standardized-audio-context wrapper, which smooths over the gaps between
 * browsers (a phone's nodes can lack params Tone expects, so Tone must keep
 * it) but has no `getOutputTimestamp()`. The wrapper keeps the native
 * context in a private field and reads its clock from it; if that ever
 * moves, or the browser has no timestamps (older Safari), this finds
 * nothing and the heard clock falls back to the audio clock.
 */
const nativeOf = (raw: object): AudioContext | null => {
  const inner: unknown =
    raw instanceof AudioContext ? raw : Reflect.get(raw, '_nativeAudioContext');
  return inner instanceof AudioContext && 'getOutputTimestamp' in inner
    ? inner
    : null;
};

const resumeWithin = async (context: BaseContext) => {
  await Promise.race([
    context.resume(),
    new Promise(resolve => setTimeout(resolve, RESUME_WAIT_MS)),
  ]);
};

const GESTURES = ['pointerdown', 'keydown'] as const;

/**
 * Whether the game wants sound running: a pause suspends on purpose, and
 * a gesture waiting to start held-back audio mustn't undo it.
 */
let wanted: 'running' | 'suspended' = 'running';
/** The pending next-gesture resume, if one is waiting. */
let pendingGesture: (() => void) | null = null;

const cancelGesture = () => {
  pendingGesture?.();
  pendingGesture = null;
};

/**
 * The next touch or key starts held-back audio, once, and only if
 * nothing has suspended it on purpose since.
 */
const resumeOnNextGesture = (context: BaseContext) => {
  cancelGesture();
  const resume = () => {
    cancelGesture();
    if (wanted === 'running') void context.resume();
  };
  GESTURES.forEach(type =>
    window.addEventListener(type, resume, { capture: true }),
  );
  pendingGesture = () =>
    GESTURES.forEach(type =>
      window.removeEventListener(type, resume, { capture: true }),
    );
};

let realtime: { context: BaseContext; audio: Audio } | null = null;

/**
 * Start audio and hand back its controls. The first call makes Tone's
 * realtime context with `latencyHint` (still Tone's own, so the wrapper
 * keeps smoothing over browser gaps) and keeps it, before any `Offline`
 * render can swap the global one; later calls just resume it.
 *
 * Must be called from a user gesture, before anything that spends it (a
 * fullscreen request does). If the browser still holds the context back,
 * this doesn't wait on it: the next touch or key starts it.
 */
export const startAudio = async ({
  latencyHint = 'balanced',
}: { latencyHint?: AudioContextLatencyCategory } = {}): Promise<Audio> => {
  if (!realtime) {
    // Nothing is built on the context Tone made by itself at import yet.
    setContext(new Context({ latencyHint }), true);
    const context = getContext();
    const raw = context.rawContext;
    const native = nativeOf(raw);
    // A resume asked for earlier can settle after a pause has suspended
    // the sound (a slow start, the browser holding it back): put it back.
    context.on('statechange', () => {
      if (
        wanted === 'suspended' &&
        context.state === 'running' &&
        'close' in raw
      )
        void raw.suspend();
    });
    realtime = {
      context,
      audio: {
        suspend: async () => {
          wanted = 'suspended';
          cancelGesture();
          if ('close' in raw) await raw.suspend();
        },
        resume: () => {
          wanted = 'running';
          return resumeWithin(context);
        },
        outputTimestamp: () => native?.getOutputTimestamp(),
        running: () => context.state === 'running',
        onChange: listener => {
          context.on('statechange', listener);
          return () => {
            context.off('statechange', listener);
          };
        },
      },
    };
  }
  const { context, audio } = realtime;
  wanted = 'running';
  await resumeWithin(context);
  if (context.state !== 'running') resumeOnNextGesture(context);
  return audio;
};

import { getContext, type BaseContext } from 'tone';

export interface Audio {
  suspend: () => Promise<void>;
  resume: () => Promise<void>;
  /** `getOutputTimestamp()` of the browser's context, if it can be reached. */
  outputTimestamp: () => AudioTimestamp | undefined;
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

const resumeOnNextGesture = (context: BaseContext) => {
  const resume = () => {
    void context.resume();
  };
  ['pointerdown', 'keydown'].forEach(type =>
    window.addEventListener(type, resume, { once: true, capture: true }),
  );
};

let realtime: { context: BaseContext; audio: Audio } | null = null;

/**
 * Start audio and hand back its controls. The realtime context is caught on
 * the first call, before any `Offline` render can swap Tone's global one.
 *
 * Must be called from a user gesture, before anything that spends it (a
 * fullscreen request does). If the browser still holds the context back,
 * this doesn't wait on it: the next touch or key starts it.
 */
export const startAudio = async (): Promise<Audio> => {
  if (!realtime) {
    const context = getContext();
    const raw = context.rawContext;
    const native = nativeOf(raw);
    realtime = {
      context,
      audio: {
        suspend: async () => {
          if ('close' in raw) await raw.suspend();
        },
        resume: () => context.resume(),
        outputTimestamp: () => native?.getOutputTimestamp(),
      },
    };
  }
  const { context, audio } = realtime;
  await Promise.race([
    context.resume(),
    new Promise(resolve => setTimeout(resolve, RESUME_WAIT_MS)),
  ]);
  if (context.state !== 'running') resumeOnNextGesture(context);
  return audio;
};

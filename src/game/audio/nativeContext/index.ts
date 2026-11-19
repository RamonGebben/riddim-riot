import { setContext } from 'tone';

let native: AudioContext | null = null;

/** Long enough for a resume the browser allows; a refused one never settles. */
const RESUME_WAIT_MS = 1000;

const resumeOnNextGesture = (context: AudioContext) => {
  const resume = () => {
    void context.resume();
  };
  ['pointerdown', 'keydown'].forEach(type =>
    window.addEventListener(type, resume, { once: true, capture: true }),
  );
};

/**
 * Start audio on a native AudioContext, made on the first call and kept.
 * Left to itself Tone makes a standardized-audio-context wrapper, which has
 * no `getOutputTimestamp()`, so the heard clock couldn't follow the
 * speakers; Tone runs on a native context just as well. Resumed directly,
 * not through Tone's global context, which `Offline` may have swapped out
 * mid-measurement.
 *
 * Must be called from a user gesture, before anything that spends it (a
 * fullscreen request does). If the browser still holds the context back,
 * this doesn't wait on it: the next touch or key starts it.
 */
export const startAudio = async (): Promise<AudioContext> => {
  if (!native) {
    native = new AudioContext({ latencyHint: 'interactive' });
    setContext(native, true);
  }
  await Promise.race([
    native.resume(),
    new Promise(resolve => setTimeout(resolve, RESUME_WAIT_MS)),
  ]);
  if (native.state !== 'running') resumeOnNextGesture(native);
  return native;
};

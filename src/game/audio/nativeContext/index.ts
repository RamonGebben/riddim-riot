import { setContext } from 'tone';

let native: AudioContext | null = null;

/**
 * Start audio on a native AudioContext, made on the first call and kept.
 * Left to itself Tone makes a standardized-audio-context wrapper, which has
 * no `getOutputTimestamp()`, so the heard clock couldn't follow the
 * speakers; Tone runs on a native context just as well. Resumed directly,
 * not through Tone's global context, which `Offline` may have swapped out
 * mid-measurement. Must be called from a user gesture.
 */
export const startAudio = async (): Promise<AudioContext> => {
  if (!native) {
    native = new AudioContext({ latencyHint: 'interactive' });
    setContext(native, true);
  }
  await native.resume();
  return native;
};

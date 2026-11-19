/**
 * The audio-clock time of the sound coming out of the speakers right now.
 * `currentTime` is where the audio thread is rendering, which runs ahead of
 * what's heard by the output latency (~15 ms built in, 150+ ms over
 * Bluetooth). Visuals that follow `currentTime` land early; following this
 * they land with the sound.
 *
 * `timestamp` is `AudioContext.getOutputTimestamp()`; `wallNow` is
 * `performance.now()`; `audioNow` is where the audio thread is. Falls back
 * to it while the browser has no timestamp yet, and never runs past it: a
 * timestamp left over from before a pause would otherwise project the
 * whole pause forward. Nor does it trail by more than any output's latency:
 * WebKit on Linux reports a `performanceTime` that runs ahead of
 * `performance.now()` by the whole context's age, which pins the projection
 * near zero (and under it), so the beat never came.
 */
/** Bluetooth's is the worst at a few hundred ms; past this it's no latency. */
const MAX_OUTPUT_LATENCY = 1;

export const heardTime = (
  timestamp: AudioTimestamp | undefined,
  wallNow: number,
  audioNow: number,
): number => {
  if (!timestamp?.contextTime || !timestamp.performanceTime) return audioNow;
  const projected =
    timestamp.contextTime + (wallNow - timestamp.performanceTime) / 1000;
  if (projected < audioNow - MAX_OUTPUT_LATENCY) return audioNow;
  return Math.min(projected, audioNow);
};

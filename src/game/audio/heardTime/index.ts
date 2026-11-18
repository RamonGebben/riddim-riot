/**
 * The audio-clock time of the sound coming out of the speakers right now.
 * `currentTime` is where the audio thread is rendering, which runs ahead of
 * what's heard by the output latency (~15 ms built in, 150+ ms over
 * Bluetooth). Visuals that follow `currentTime` land early; following this
 * they land with the sound.
 *
 * `timestamp` is `AudioContext.getOutputTimestamp()`; `wallNow` is
 * `performance.now()`. Falls back while the browser has no timestamp yet.
 */
export const heardTime = (
  timestamp: AudioTimestamp | undefined,
  wallNow: number,
  fallback: number,
): number => {
  if (!timestamp?.contextTime || !timestamp.performanceTime) return fallback;
  return timestamp.contextTime + (wallNow - timestamp.performanceTime) / 1000;
};

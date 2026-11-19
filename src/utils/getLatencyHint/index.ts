const HINTS = ['interactive', 'balanced', 'playback'] as const;

export type LatencyHint = (typeof HINTS)[number];

/**
 * How big an audio buffer to ask for. `balanced` by default: Firefox's
 * `interactive` buffer is small enough that a phone misses deadlines and
 * crackles, and visuals follow the speakers (the heard clock) whatever the
 * buffer. `?latency=…` picks another, for tuning on a device.
 */
export const getLatencyHint = (search: string): LatencyHint => {
  const value = new URLSearchParams(search).get('latency');
  return HINTS.find(hint => hint === value) ?? 'balanced';
};

const HINTS = ['interactive', 'balanced', 'playback'] as const;

export type LatencyHint = (typeof HINTS)[number];

/**
 * How big an audio buffer to ask for. A touch screen gets `playback`, the
 * biggest: Firefox on a phone crackled on smaller ones (play-tested), and
 * visuals follow the speakers (the heard clock) whatever the buffer, so it
 * only adds a little between a tap and its sound. Anything else gets
 * `balanced`. `?latency=…` picks another, for tuning on a device.
 */
export const getLatencyHint = (
  search: string,
  { touch }: { touch: boolean },
): LatencyHint => {
  const value = new URLSearchParams(search).get('latency');
  return (
    HINTS.find(hint => hint === value) ?? (touch ? 'playback' : 'balanced')
  );
};

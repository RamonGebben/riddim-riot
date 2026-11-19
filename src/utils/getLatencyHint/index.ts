const HINTS = ['interactive', 'balanced', 'playback'] as const;

export type LatencyHint = (typeof HINTS)[number];

/**
 * How big an audio buffer to ask for. Firefox on a touch screen gets
 * `playback`, the biggest: it crackled on smaller ones (play-tested). Other
 * phones get `interactive`, the smallest: Chrome honours the hint, and on
 * `playback` its visuals (which follow the heard clock) trailed a tap
 * noticeably more than Firefox's. Anything else gets `balanced`.
 * `?latency=…` picks another, for tuning on a device.
 */
export const getLatencyHint = (
  search: string,
  { touch, firefox }: { touch: boolean; firefox: boolean },
): LatencyHint => {
  const value = new URLSearchParams(search).get('latency');
  const fallback = !touch ? 'balanced' : firefox ? 'playback' : 'interactive';
  return HINTS.find(hint => hint === value) ?? fallback;
};

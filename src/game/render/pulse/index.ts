export interface Pulse {
  /** A hit at an audio-clock time, usually still in the future. */
  hit: (time: number, strength?: number) => void;
  /** 0-1: the latest hit at or before `now`, decaying. */
  valueAt: (now: number) => number;
}

/** Hits older than this can't affect the envelope any more. */
const HISTORY_SECONDS = 2;

/**
 * A visual envelope that follows audio hits. Hits arrive with their scheduled
 * time (ahead of the audio), and each frame reads the envelope at the audio
 * clock's current time - so visuals land exactly with the sound and can't
 * drift from it.
 */
export const createPulse = ({ decay }: { decay: number }): Pulse => {
  let hits: Array<{ time: number; strength: number }> = [];

  return {
    hit: (time, strength = 1) => {
      hits = [...hits, { time, strength }]
        .filter(entry => entry.time > time - HISTORY_SECONDS)
        .sort((a, b) => a.time - b.time);
    },
    valueAt: now => {
      const latest = hits.findLast(entry => entry.time <= now);
      if (!latest) return 0;
      return latest.strength * Math.exp(-(now - latest.time) / decay);
    },
  };
};

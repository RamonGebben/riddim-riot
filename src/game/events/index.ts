import type { ClockEvents } from '../clock';

/** Everything on the game bus. */
export interface GameEvents extends ClockEvents {
  /** A shot scheduled on the audio clock - it leaves the barrel at `time`. */
  shot: { time: number };
}

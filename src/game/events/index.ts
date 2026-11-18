import type { ClockEvents } from '../clock';
import type { PendingShot } from '../sim/world';

/** Everything on the game bus. */
export interface GameEvents extends ClockEvents {
  /** A shot scheduled on the audio clock - it leaves the barrel at `time`. */
  shot: PendingShot;
}

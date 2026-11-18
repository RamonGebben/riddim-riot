import { getTransport } from 'tone';
import type { Bus } from '../bus';
import { toPosition, type Position } from '../grid';

export interface Tick extends Position {
  /** Absolute 1/16 step since the transport started. */
  step: number;
  /**
   * The AudioContext time this step plays at. It's ahead of `now()` by the
   * scheduling lookahead - schedule sound at it, and draw at it via
   * `Tone.getDraw()`, never off `setTimeout` or frame counts.
   */
  time: number;
}

export interface ClockEvents {
  tick: Tick;
}

export interface Clock {
  start: () => void;
  dispose: () => void;
}

/**
 * The game's only clock: Tone's Transport, emitting a tick per 1/16 step.
 */
export const createClock = ({
  bpm,
  bus,
}: {
  bpm: number;
  bus: Bus<ClockEvents>;
}): Clock => {
  const transport = getTransport();
  transport.bpm.value = bpm;
  const ticksPerStep = transport.PPQ / 4;

  const id = transport.scheduleRepeat(
    time => {
      // Derived from the transport position rather than counted, so a
      // dropped callback can never shift every later step.
      const step = Math.round(transport.getTicksAtTime(time) / ticksPerStep);
      bus.emit('tick', { ...toPosition(step), step, time });
    },
    '16n',
    0,
  );

  return {
    start: () => {
      transport.start('+0.05');
    },
    dispose: () => {
      transport.clear(id);
      transport.stop();
      transport.position = 0;
    },
  };
};

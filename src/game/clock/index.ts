import { getTransport } from 'tone';
import { toPosition, type Position } from '../grid';

export interface Tick extends Position {
  /** Absolute 1/16 step since the transport started. */
  step: number;
  /**
   * The AudioContext time this step plays at. It's ahead of `now()` by the
   * scheduling lookahead - schedule sound at it, never off `setTimeout` or
   * frame counts. Visuals store it and read it back at the heard clock
   * (`heardNow`), which trails by the output latency: `Tone.getDraw()`
   * fires at the audio clock, so would land early.
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
  onTick,
}: {
  bpm: number;
  /** Called per 1/16, ahead of the audio - usually emits on the bus. */
  onTick: (tick: Tick) => void;
}): Clock => {
  const transport = getTransport();
  transport.bpm.value = bpm;
  const ticksPerStep = transport.PPQ / 4;

  const id = transport.scheduleRepeat(
    time => {
      // Derived from the transport position rather than counted, so a
      // dropped callback can never shift every later step.
      const step = Math.round(transport.getTicksAtTime(time) / ticksPerStep);
      onTick({ ...toPosition(step), step, time });
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

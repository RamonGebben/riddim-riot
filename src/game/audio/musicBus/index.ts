import { Filter, Gain, Limiter, type ToneAudioNode } from 'tone';

export interface MusicBus {
  /** The track - drums and arrangement - opened and closed by `open`. */
  input: ToneAudioNode;
  /**
   * Past the arrangement filter: the player's weapons and kills stay clear
   * however filtered the track is. Still ducked when hit.
   */
  direct: ToneAudioNode;
  /** Set how open the track is: the cutoff, reached `seconds` after `time`. */
  open: (hz: number, time: number, seconds: number) => void;
  /** Muffle everything at `time`, then open back up over `seconds`. */
  duck: (time: number, seconds: number) => void;
  /** Muffle everything from `time` on, and stay there. */
  muffle: (time: number) => void;
  dispose: () => void;
}

const OPEN_HZ = 20000;
const DUCKED_HZ = 280;

export const createMusicBus = (): MusicBus => {
  const limiter = new Limiter(-1).toDestination();
  const duckFilter = new Filter({
    type: 'lowpass',
    frequency: OPEN_HZ,
    rolloff: -24,
    Q: 0.7,
  }).connect(limiter);
  const direct = new Gain(0.9).connect(duckFilter);
  const arrangementFilter = new Filter({
    type: 'lowpass',
    frequency: OPEN_HZ,
    rolloff: -24,
    Q: 1,
  }).connect(duckFilter);
  const input = new Gain(0.9).connect(arrangementFilter);

  return {
    input,
    direct,
    open: (hz, time, seconds) => {
      arrangementFilter.frequency.cancelScheduledValues(time);
      if (seconds <= 0) arrangementFilter.frequency.setValueAtTime(hz, time);
      else arrangementFilter.frequency.exponentialRampTo(hz, seconds, time);
    },
    duck: (time, seconds) => {
      duckFilter.frequency.cancelScheduledValues(time);
      duckFilter.frequency.setValueAtTime(DUCKED_HZ, time);
      duckFilter.frequency.exponentialRampToValueAtTime(
        OPEN_HZ,
        time + seconds,
      );
    },
    muffle: time => {
      duckFilter.frequency.cancelScheduledValues(time);
      duckFilter.frequency.setValueAtTime(OPEN_HZ, time);
      duckFilter.frequency.exponentialRampToValueAtTime(DUCKED_HZ, time + 1.5);
    },
    dispose: () =>
      [input, arrangementFilter, direct, duckFilter, limiter].forEach(node =>
        node.dispose(),
      ),
  };
};

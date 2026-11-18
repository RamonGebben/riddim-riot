import { Filter, Gain, Limiter, type ToneAudioNode } from 'tone';

export interface MusicBus {
  /** Everything musical connects here. */
  input: ToneAudioNode;
  /** The bus low-pass: ducked when the player is hit, opened on the drop. */
  filter: Filter;
  /** Muffle everything at `time`, then open back up over `seconds`. */
  duck: (time: number, seconds: number) => void;
  dispose: () => void;
}

const OPEN_HZ = 20000;
const DUCKED_HZ = 280;

export const createMusicBus = (): MusicBus => {
  const limiter = new Limiter(-1).toDestination();
  const filter = new Filter({
    type: 'lowpass',
    frequency: OPEN_HZ,
    rolloff: -24,
    Q: 0.7,
  }).connect(limiter);
  const input = new Gain(0.9).connect(filter);

  return {
    input,
    filter,
    duck: (time, seconds) => {
      filter.frequency.cancelScheduledValues(time);
      filter.frequency.setValueAtTime(DUCKED_HZ, time);
      filter.frequency.exponentialRampToValueAtTime(OPEN_HZ, time + seconds);
    },
    dispose: () => [input, filter, limiter].forEach(node => node.dispose()),
  };
};

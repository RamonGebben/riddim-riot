import { Filter, Gain, Limiter, type ToneAudioNode } from 'tone';

export interface MusicBus {
  /** Everything musical connects here. */
  input: ToneAudioNode;
  /** The bus low-pass: ducked when the player is hit, opened on the drop. */
  filter: Filter;
  dispose: () => void;
}

export const createMusicBus = (): MusicBus => {
  const limiter = new Limiter(-1).toDestination();
  const filter = new Filter({
    type: 'lowpass',
    frequency: 20000,
    rolloff: -24,
    Q: 0.7,
  }).connect(limiter);
  const input = new Gain(0.9).connect(filter);

  return {
    input,
    filter,
    dispose: () => [input, filter, limiter].forEach(node => node.dispose()),
  };
};

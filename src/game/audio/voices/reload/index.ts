import { Channel, Filter, NoiseSynth, type ToneAudioNode } from 'tone';

export interface ReloadSound {
  click: (time: number) => void;
  rumble: (time: number, duration: number) => void;
  dispose: () => void;
}

/**
 * The mechanical reload fill: a bright click, then a rumble rising into the
 * return. It sits above and around the gun's range so it fills the gap
 * instead of fighting the next shot.
 */
export const createReloadSound = (output: ToneAudioNode): ReloadSound => {
  const channel = new Channel({ volume: -8 }).connect(output);

  const clickFilter = new Filter({
    type: 'bandpass',
    frequency: 3200,
    Q: 3,
  }).connect(channel);
  const clickNoise = new NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 },
    volume: 6,
  }).connect(clickFilter);

  const rumbleFilter = new Filter({
    type: 'lowpass',
    frequency: 150,
    rolloff: -24,
    Q: 4,
  }).connect(channel);
  const rumbleNoise = new NoiseSynth({
    noise: { type: 'brown' },
    envelope: { attack: 0.2, decay: 0.05, sustain: 0.8, release: 0.03 },
    volume: 4,
  }).connect(rumbleFilter);

  const nodes = [clickNoise, clickFilter, rumbleNoise, rumbleFilter, channel];

  return {
    click: time => {
      clickNoise.triggerAttackRelease(0.03, time);
      // A second, quieter click right behind it: "ch-chk".
      clickNoise.triggerAttackRelease(0.02, time + 0.05, 0.5);
    },
    rumble: (time, duration) => {
      rumbleFilter.frequency.setValueAtTime(150, time);
      rumbleFilter.frequency.exponentialRampToValueAtTime(
        1400,
        time + duration,
      );
      rumbleNoise.triggerAttackRelease(duration, time);
    },
    dispose: () => nodes.forEach(node => node.dispose()),
  };
};

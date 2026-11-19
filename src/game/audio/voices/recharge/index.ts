import { Channel, Filter, Noise, Oscillator, type ToneAudioNode } from 'tone';
import { SOUND_DESIGN, type RechargePatch } from '../../../sound';
import { createGate } from '../../gate';
import type { ReloadSound } from '../reload';

/**
 * A beam's overheat and recharge, playing the reload fill's two cues: the
 * click vents the heat with a hiss falling away, and the rumble becomes a
 * whine rising through the recharge into a ping on the beat it's back.
 */
export const createRechargeSound = (
  output: ToneAudioNode,
  patch: RechargePatch = SOUND_DESIGN.recharge,
): ReloadSound => {
  const { vent: v, charge: c, ready: r } = patch;
  const channel = new Channel({ volume: patch.level }).connect(output);

  const ventNoise = new Noise('white').start();
  const ventFilter = new Filter({
    type: 'bandpass',
    frequency: v.fromHz,
    Q: 1.5,
  });
  const vent = createGate({
    envelope: { attack: 0.005, decay: v.decay, sustain: 0, release: 0.05 },
    volume: v.level,
    output: channel,
  });
  ventNoise.chain(ventFilter, vent.input);

  const charge = createGate({
    envelope: { attack: 0.3, decay: 0.05, sustain: 0.9, release: 0.02 },
    volume: c.level,
    output: channel,
  });
  const chargeOsc = new Oscillator({ type: 'triangle', frequency: c.fromHz })
    .connect(charge.input)
    .start();

  const ready = createGate({
    envelope: { attack: 0.002, decay: r.decay, sustain: 0, release: 0.05 },
    volume: r.level,
    output: channel,
  });
  const readyOsc = new Oscillator({ type: 'sine', frequency: c.toHz })
    .connect(ready.input)
    .start();

  const nodes = [
    ventNoise,
    ventFilter,
    vent,
    chargeOsc,
    charge,
    readyOsc,
    ready,
    channel,
  ];

  return {
    click: time => {
      ventFilter.frequency.cancelScheduledValues(time);
      ventFilter.frequency.setValueAtTime(v.fromHz, time);
      ventFilter.frequency.exponentialRampToValueAtTime(v.toHz, time + v.decay);
      vent.envelope.triggerAttackRelease(0.01, time);
    },
    rumble: (time, duration) => {
      chargeOsc.frequency.cancelScheduledValues(time);
      chargeOsc.frequency.setValueAtTime(c.fromHz, time);
      chargeOsc.frequency.exponentialRampToValueAtTime(c.toHz, time + duration);
      charge.envelope.triggerAttackRelease(duration, time);
      ready.envelope.triggerAttackRelease(0.01, time + duration);
    },
    dispose: () => nodes.forEach(node => node.dispose()),
  };
};

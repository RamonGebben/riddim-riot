import { SOUND_DESIGN, type RechargePatch } from '../../../sound';
import { createGate } from '../../gate';
import { createGraph, type Output } from '../../graph';
import type { ReloadSound } from '../reload';

/**
 * A beam's overheat and recharge, playing the reload fill's two cues: the
 * click vents the heat with a hiss falling away, and the rumble becomes a
 * whine rising through the recharge into a ping on the beat it's back.
 */
export const createRechargeSound = (
  output: Output,
  patch: RechargePatch = SOUND_DESIGN.recharge,
): ReloadSound => {
  const { vent: v, charge: c, ready: r } = patch;
  const graph = createGraph();
  const channel = graph.channel(patch.level, output);

  const vent = createGate(graph, {
    envelope: { attack: 0.005, decay: v.decay, sustain: 0, release: 0.05 },
    volume: v.level,
    output: channel,
  });
  const ventFilter = graph.filter({
    type: 'bandpass',
    frequency: v.fromHz,
    Q: 1.5,
    output: vent.input,
  });
  graph.noise('white').connect(ventFilter.input);

  const charge = createGate(graph, {
    envelope: { attack: 0.3, decay: 0.05, sustain: 0.9, release: 0.02 },
    volume: c.level,
    output: channel,
  });
  const chargeOsc = graph.oscillator(
    { type: 'triangle', frequency: c.fromHz },
    charge.input,
  );

  const ready = createGate(graph, {
    envelope: { attack: 0.002, decay: r.decay, sustain: 0, release: 0.05 },
    volume: r.level,
    output: channel,
  });
  graph.oscillator({ type: 'sine', frequency: c.toHz }, ready.input);

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
    dispose: graph.dispose,
  };
};

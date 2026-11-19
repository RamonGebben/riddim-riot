import { SOUND_DESIGN, type ReloadPatch } from '../../../sound';
import { createGate } from '../../gate';
import { createGraph, type Output } from '../../graph';

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
export const createReloadSound = (
  output: Output,
  patch: ReloadPatch = SOUND_DESIGN.reload,
): ReloadSound => {
  const graph = createGraph();
  const channel = graph.channel(patch.level, output);

  const click = createGate(graph, {
    envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 },
    volume: patch.clickLevel,
    output: channel,
  });
  graph.noise('white').connect(
    graph.filter({
      type: 'bandpass',
      frequency: patch.clickHz,
      Q: 3,
      output: click.input,
    }).input,
  );

  const rumble = createGate(graph, {
    envelope: { attack: 0.2, decay: 0.05, sustain: 0.8, release: 0.03 },
    volume: patch.rumbleLevel,
    output: channel,
  });
  const rumbleFilter = graph.filter({
    type: 'lowpass',
    frequency: patch.rumbleFrom,
    rolloff: -24,
    Q: 4,
    output: rumble.input,
  });
  graph.noise('brown').connect(rumbleFilter.input);

  return {
    click: time => {
      click.envelope.triggerAttackRelease(0.03, time);
      // A second, quieter click right behind it: "ch-chk".
      click.envelope.triggerAttackRelease(0.02, time + 0.05, 0.5);
    },
    rumble: (time, duration) => {
      rumbleFilter.frequency.setValueAtTime(patch.rumbleFrom, time);
      rumbleFilter.frequency.exponentialRampToValueAtTime(
        patch.rumbleTo,
        time + duration,
      );
      rumble.envelope.triggerAttackRelease(duration, time);
    },
    dispose: graph.dispose,
  };
};

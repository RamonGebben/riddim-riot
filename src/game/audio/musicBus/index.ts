import { dbToGain, getDestination } from 'tone';
import type { MixPatch } from '../../sound';
import { createGraph, type Automation } from '../graph';

export interface MusicBus {
  /** The track - drums and arrangement - opened and closed by `open`. */
  input: AudioNode;
  /** Part of the track like `input`, but pumped by the kick: the bed. */
  bed: AudioNode;
  /** Like `direct`, but pumped by the kick: the weapons. */
  weapons: AudioNode;
  /**
   * Past the arrangement filter: the player's weapons and kills stay clear
   * however filtered the track is. Still ducked when hit.
   */
  direct: AudioNode;
  /** Set how open the track is: the cutoff, reached `seconds` after `time`. */
  open: (hz: number, time: number, seconds: number) => void;
  /** Muffle everything at `time`, then open back up over `seconds`. */
  duck: (time: number, seconds: number) => void;
  /**
   * Sidechain: pull the bed and weapons down on a kick at `time`, by
   * `velocity` of the patch's depth, and let them swell back.
   */
  pump: (time: number, velocity: number, patch: MixPatch) => void;
  /** Muffle everything from `time` on, and stay there. */
  muffle: (time: number) => void;
  dispose: () => void;
}

const OPEN_HZ = 20000;
const DUCKED_HZ = 280;

export const createMusicBus = (): MusicBus => {
  const graph = createGraph();
  const limiter = graph.limiter(-1, getDestination());
  const duckFilter = graph.filter({
    type: 'lowpass',
    frequency: OPEN_HZ,
    rolloff: -24,
    Q: 0.7,
    output: limiter,
  });
  const direct = graph.gain(0.9, duckFilter.input);
  const arrangementFilter = graph.filter({
    type: 'lowpass',
    frequency: OPEN_HZ,
    rolloff: -24,
    Q: 1,
    output: duckFilter.input,
  });
  const input = graph.gain(0.9, arrangementFilter.input);
  const bedPumpNode = graph.gain(1, arrangementFilter.input);
  const bedPump = graph.param(bedPumpNode.gain, 'gain', 1);
  const bed = graph.gain(0.9, bedPumpNode);
  const weaponPumpNode = graph.gain(1, direct);
  const weaponPump = graph.param(weaponPumpNode.gain, 'gain', 1);
  const weapons = graph.gain(1, weaponPumpNode);

  const pumpDown = (
    gain: Automation,
    depthDb: number,
    time: number,
    seconds: number,
  ) => {
    gain.cancelAndHoldAtTime(time);
    // A few milliseconds down: a step would click on a held note.
    gain.linearRampToValueAtTime(dbToGain(depthDb), time + 0.005);
    gain.linearRampToValueAtTime(1, time + seconds);
  };

  return {
    input,
    bed,
    weapons,
    direct,
    pump: (time, velocity, patch) => {
      pumpDown(bedPump, patch.bedPumpDb * velocity, time, patch.pumpSeconds);
      pumpDown(
        weaponPump,
        patch.weaponPumpDb * velocity,
        time,
        patch.pumpSeconds,
      );
    },
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
    dispose: graph.dispose,
  };
};

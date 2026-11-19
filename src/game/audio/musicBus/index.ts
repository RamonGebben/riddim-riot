import { dbToGain, Filter, Gain, Limiter, type ToneAudioNode } from 'tone';
import type { MixPatch } from '../../sound';

export interface MusicBus {
  /** The track - drums and arrangement - opened and closed by `open`. */
  input: ToneAudioNode;
  /** Part of the track like `input`, but pumped by the kick: the bed. */
  bed: ToneAudioNode;
  /** Like `direct`, but pumped by the kick: the weapons. */
  weapons: ToneAudioNode;
  /**
   * Past the arrangement filter: the player's weapons and kills stay clear
   * however filtered the track is. Still ducked when hit.
   */
  direct: ToneAudioNode;
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
  const bedPump = new Gain(1).connect(arrangementFilter);
  const bed = new Gain(0.9).connect(bedPump);
  const weaponPump = new Gain(1).connect(direct);
  const weapons = new Gain(1).connect(weaponPump);

  const pumpDown = (
    gain: Gain,
    depthDb: number,
    time: number,
    seconds: number,
  ) => {
    gain.gain.cancelAndHoldAtTime(time);
    // A few milliseconds down: a step would click on a held note.
    gain.gain.linearRampToValueAtTime(dbToGain(depthDb), time + 0.005);
    gain.gain.linearRampToValueAtTime(1, time + seconds);
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
    dispose: () =>
      [
        input,
        bed,
        bedPump,
        weapons,
        weaponPump,
        arrangementFilter,
        direct,
        duckFilter,
        limiter,
      ].forEach(node => node.dispose()),
  };
};

import { Gain, getTransport, Offline } from 'tone';
import { STEPS_PER_BAR, STEPS_PER_DIVISION } from '../../grid';
import type { Weapon } from '../../weapons';
import { createWeaponVoice } from '../voices';

/** Every weapon is set to this RMS over a bar of held fire. */
export const WEAPON_TARGET_DB = -20;
const LEAD_IN = 0.05;
const TAIL = 0.3;

/**
 * Normalize by measuring, not by formula: render a bar of held fire offline
 * at 0 dB and return the gain that brings it to the target. The parts
 * interact (drive, resonance and echo change loudness differently per
 * engine), so measuring stays right as parts are added. ~35ms per weapon.
 *
 * Not safe to run two at once: `Offline` swaps Tone's global context while
 * it builds the graph.
 */
export const measureWeaponLoudness = async (
  weapon: Weapon,
  { bpm }: { bpm: number },
): Promise<number> => {
  const stepSeconds = 60 / bpm / 4;
  const steps = STEPS_PER_DIVISION[weapon.timing.division];

  const buffer = await Offline(
    () => {
      getTransport().bpm.value = bpm;
      const voice = createWeaponVoice({
        output: new Gain(1).toDestination(),
        sound: weapon.sound,
        beatSeconds: stepSeconds * 4,
      });
      Array.from({ length: weapon.timing.magazine }, (_, shot) =>
        voice.fire(
          LEAD_IN + shot * steps * stepSeconds,
          steps * stepSeconds,
          shot,
        ),
      );
      getTransport().start(0);
    },
    LEAD_IN + STEPS_PER_BAR * stepSeconds + TAIL,
  );

  const samples = buffer.getChannelData(0);
  const power =
    samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length;
  const rmsDb = 10 * Math.log10(Math.max(power, 1e-12));
  return WEAPON_TARGET_DB - rmsDb;
};

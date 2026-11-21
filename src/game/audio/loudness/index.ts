import { getDestination, getTransport, Offline } from 'tone';
import { STEPS_PER_BAR, STEPS_PER_DIVISION } from '../../grid';
import { SOUND_DESIGN, type SoundDesign } from '../../sound';
import type { Weapon } from '../../weapons';
import { offlineTurn } from '../offline';
import { createWeaponVoice } from '../voices';

/** Silence before a rendered bar's first shot. */
export const PREVIEW_LEAD_IN = 0.05;
const LEAD_IN = PREVIEW_LEAD_IN;
const TAIL = 0.3;

/** A bar of held fire, rendered offline at 0 dB. */
const renderBar = (
  weapon: Weapon,
  {
    bpm,
    design,
    pitch,
  }: { bpm: number; design: SoundDesign; pitch?: (note: number) => number },
) => {
  const stepSeconds = 60 / bpm / 4;
  const steps = STEPS_PER_DIVISION[weapon.timing.division];
  return Offline(
    () => {
      getTransport().bpm.value = bpm;
      const voice = createWeaponVoice({
        output: getDestination(),
        sound: weapon.sound,
        beatSeconds: stepSeconds * 4,
        design,
      });
      Array.from({ length: weapon.timing.magazine }, (_, shot) =>
        voice.fire(
          LEAD_IN + shot * steps * stepSeconds,
          steps * stepSeconds,
          shot,
          pitch,
        ),
      );
      getTransport().start(0);
    },
    LEAD_IN + STEPS_PER_BAR * stepSeconds + TAIL,
  );
};

/** The gain that brings a rendered bar to the design's target loudness. */
const gainToTarget = (samples: Float32Array, design: SoundDesign) => {
  const power =
    samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length;
  const rmsDb = 10 * Math.log10(Math.max(power, 1e-12));
  return design.weaponMix.targetDb - rmsDb;
};

/**
 * Normalize by measuring, not by formula: render a bar of held fire offline
 * at 0 dB and return the gain that brings it to the design's target. The parts
 * interact (drive, resonance and echo change loudness differently per
 * engine), so measuring stays right as parts are added. ~35ms per weapon.
 * Queued behind any other offline render.
 */
export const measureWeaponLoudness = (
  weapon: Weapon,
  { bpm, design = SOUND_DESIGN }: { bpm: number; design?: SoundDesign },
): Promise<number> =>
  offlineTurn(async () => {
    const buffer = await renderBar(weapon, { bpm, design });
    return gainToTarget(buffer.getChannelData(0), design);
  });

/**
 * A bar of the weapon firing its riff, as the loadout menu auditions it:
 * rendered offline and levelled to the weapons' loudness, so every preview
 * sits at the same volume. `pitch` moves the riff onto a chord. The first
 * shot is `LEAD_IN` in. Queued behind any other offline render.
 */
export const renderWeaponPreview = (
  weapon: Weapon,
  {
    bpm,
    design = SOUND_DESIGN,
    pitch,
  }: { bpm: number; design?: SoundDesign; pitch?: (note: number) => number },
): Promise<AudioBuffer> =>
  offlineTurn(async () => {
    const rendered = await renderBar(weapon, { bpm, design, pitch });
    const buffer = rendered.get();
    if (!buffer) throw new Error('The preview rendered nothing');
    const gain = 10 ** (gainToTarget(buffer.getChannelData(0), design) / 20);
    Array.from({ length: buffer.numberOfChannels }, (_, channel) =>
      buffer.getChannelData(channel),
    ).forEach(samples => samples.forEach((s, i) => (samples[i] = s * gain)));
    return buffer;
  });

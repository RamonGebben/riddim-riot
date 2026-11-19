import { STEPS_PER_BAR, STEPS_PER_BEAT, STEPS_PER_DIVISION } from '../../grid';
import { degreeToMidi, type Key } from '../../music';
import { createRng, type Rng } from '../../rng';
import { SOUND_DESIGN, type SoundDesign } from '../../sound';
import {
  BEAM,
  FX,
  FX_CHANCE,
  LFO_RATES,
  MANUFACTURERS,
  OSCILLATORS,
  RELOAD_BEATS,
  RIFF_LENGTH,
} from '../parts';
import type {
  FxPart,
  LfoPart,
  ManufacturerPart,
  OscillatorPart,
  Weapon,
} from '../types';

/** Parts to fix instead of rolling; `fx: null` pins "no FX". */
export interface WeaponPins {
  manufacturer?: ManufacturerPart;
  oscillator?: OscillatorPart;
  lfo?: LfoPart;
  fx?: FxPart | null;
}

const between = (rng: Rng, [min, max]: [number, number]) =>
  min + rng.next() * (max - min);

/** 0 at the bottom of a range, 1 at the top; the middle if it has no width. */
const along = (value: number, [min, max]: [number, number]) =>
  max === min ? 0.5 : (value - min) / (max - min);

const rollRiff = (rng: Rng, degrees: Array<number>) => [
  0,
  ...Array.from({ length: RIFF_LENGTH - 1 }, () => rng.pick(degrees)),
];

/**
 * Roll a weapon from the parts pool. The same seed always gives the same
 * weapon; every note it plays is in `key`. `pins` fix parts - the starting
 * loadout pins the engine so a run never opens with three of a kind, and
 * the sound playground pins whatever it's auditioning. A pinned roll
 * consumes the same random numbers, so the rest of it doesn't change.
 */
export const rollWeapon = (
  seed: number,
  key: Key,
  {
    pins = {},
    design = SOUND_DESIGN,
  }: { pins?: WeaponPins; design?: SoundDesign } = {},
): Weapon => {
  const sounds = design.parts;
  const rng = createRng(seed);
  const rolledMaker = rng.pick<ManufacturerPart>(['vandal', 'lumen']);
  const rolledEngine = rng.pick<OscillatorPart>(['wobble', 'laser', 'beam']);
  const rolledLfo = rng.pick<LfoPart>(['1/4', '1/8', '1/16']);
  const rolledFx: FxPart | null = rng.chance(FX_CHANCE)
    ? rng.pick<FxPart>(['distortion', 'echo'])
    : null;
  const manufacturer = pins.manufacturer ?? rolledMaker;
  const oscillator = pins.oscillator ?? rolledEngine;
  const lfo = pins.lfo ?? rolledLfo;
  const fx = pins.fx === undefined ? rolledFx : pins.fx;

  const maker = MANUFACTURERS[manufacturer];
  const makerSound = sounds.manufacturers[manufacturer];
  const engine = OSCILLATORS[oscillator];
  const ranges = sounds.engines[oscillator];
  const rate = LFO_RATES[lfo];

  const cutoff = between(rng, ranges.cutoff);
  const resonance = between(rng, ranges.resonance);
  const riff = rollRiff(rng, ranges.degrees).map(degree =>
    degreeToMidi(key, degree, ranges.octave),
  );
  const crush = fx === 'distortion' ? between(rng, sounds.crush.drive) : 0;
  const delay =
    fx === 'echo'
      ? {
          feedback: between(rng, sounds.echo.feedback),
          wet: between(rng, sounds.echo.wet),
        }
      : null;

  // A beam ticks every 1/16 whatever its LFO; the rate only shapes its sound.
  const continuous = engine.kind === 'beam';
  const division = continuous ? '1/16' : rate.division;
  const steps = STEPS_PER_DIVISION[division];
  const shotBeats = steps / STEPS_PER_BEAT;
  const damage =
    engine.damage *
    (continuous ? 1 : rate.damage) *
    maker.damage *
    (fx === 'distortion' ? FX.distortion.damage : 1);

  // Beams tick too fast to burst; the drive only roughens their sound.
  const crushed = FX.distortion.splash;
  const splash =
    fx === 'distortion' && !continuous
      ? {
          radius:
            crushed.radius[0] +
            (crushed.radius[1] - crushed.radius[0]) *
              along(crush, sounds.crush.drive),
          damage: damage * crushed.share,
          knockback: crushed.knockback,
        }
      : undefined;

  const sound = {
    oscillator,
    waveform: makerSound.waveform,
    riff,
    lfo,
    cutoff,
    resonance,
    drive: Math.min(makerSound.drive + crush, 0.8),
    delay,
  };

  return {
    seed,
    name: [maker.label, engine.label, lfo, fx ? FX[fx].label : null]
      .filter(Boolean)
      .join(' '),
    parts: { manufacturer, oscillator, lfo, fx },
    timing: {
      division,
      cooldownBeats: shotBeats,
      gateBeats: shotBeats,
      magazine: STEPS_PER_BAR / steps,
      ...(continuous
        ? { reloadBeats: BEAM.rechargeBeats, coolSteps: BEAM.coolSteps }
        : { reloadBeats: RELOAD_BEATS }),
    },
    projectile: {
      kind: engine.kind,
      speed: engine.speed * maker.speed,
      radius: engine.radius,
      damage,
      // Brighter filters reach further; more resonance focuses the shots.
      lifetime: engine.lifetime * (0.8 + 0.4 * along(cutoff, ranges.cutoff)),
      ...(splash ? { splash } : {}),
      spread: continuous ? 0 : 0.12 * (1 - along(resonance, ranges.resonance)),
    },
    echo: delay ? { delayBeats: 0.5, damage: damage * 0.5 } : null,
    sound,
  };
};

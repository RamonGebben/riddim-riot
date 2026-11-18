import { STEPS_PER_BAR, STEPS_PER_BEAT, STEPS_PER_DIVISION } from '../../grid';
import { degreeToMidi, type Key } from '../../music';
import { createRng, type Rng } from '../../rng';
import {
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

const between = (rng: Rng, [min, max]: [number, number]) =>
  min + rng.next() * (max - min);

/** 0 at the bottom of a range, 1 at the top. */
const along = (value: number, [min, max]: [number, number]) =>
  (value - min) / (max - min);

const rollRiff = (rng: Rng, degrees: Array<number>) => [
  0,
  ...Array.from({ length: RIFF_LENGTH - 1 }, () => rng.pick(degrees)),
];

/**
 * Roll a weapon from the parts pool. The same seed always gives the same
 * weapon; every note it plays is in `key`. `oscillator` pins the engine -
 * the starting loadout uses it so a run never opens with three of a kind.
 */
export const rollWeapon = (
  seed: number,
  key: Key,
  { oscillator: pinned }: { oscillator?: OscillatorPart } = {},
): Weapon => {
  const rng = createRng(seed);
  const manufacturer = rng.pick<ManufacturerPart>(['vandal', 'lumen']);
  const rolled = rng.pick<OscillatorPart>(['wobble', 'laser']);
  const oscillator = pinned ?? rolled;
  const lfo = rng.pick<LfoPart>(['1/4', '1/8', '1/16']);
  const fx: FxPart | null = rng.chance(FX_CHANCE)
    ? rng.pick<FxPart>(['distortion', 'echo'])
    : null;

  const maker = MANUFACTURERS[manufacturer];
  const engine = OSCILLATORS[oscillator];
  const rate = LFO_RATES[lfo];

  const cutoff = between(rng, engine.cutoff);
  const resonance = between(rng, engine.resonance);
  const riff = rollRiff(rng, engine.degrees).map(degree =>
    degreeToMidi(key, degree, engine.octave),
  );
  const crush = fx === 'distortion' ? between(rng, FX.distortion.drive) : 0;
  const delay =
    fx === 'echo'
      ? {
          feedback: between(rng, FX.echo.feedback),
          wet: between(rng, FX.echo.wet),
        }
      : null;

  const steps = STEPS_PER_DIVISION[rate.division];
  const shotBeats = steps / STEPS_PER_BEAT;
  const damage =
    engine.damage *
    rate.damage *
    maker.damage *
    (fx === 'distortion' ? FX.distortion.damage : 1);

  const sound = {
    oscillator,
    waveform: maker.waveform,
    riff,
    lfo,
    cutoff,
    resonance,
    drive: Math.min(maker.drive + crush, 0.8),
    delay,
  };

  return {
    seed,
    name: [maker.label, engine.label, lfo, fx ? FX[fx].label : null]
      .filter(Boolean)
      .join(' '),
    parts: { manufacturer, oscillator, lfo, fx },
    timing: {
      division: rate.division,
      cooldownBeats: shotBeats,
      gateBeats: shotBeats,
      magazine: STEPS_PER_BAR / steps,
      reloadBeats: RELOAD_BEATS,
    },
    projectile: {
      kind: engine.kind,
      speed: engine.speed * maker.speed,
      radius: engine.radius,
      damage,
      // Brighter filters reach further; more resonance focuses the shots.
      lifetime: engine.lifetime * (0.8 + 0.4 * along(cutoff, engine.cutoff)),
      spread: 0.12 * (1 - along(resonance, engine.resonance)),
    },
    echo: delay ? { delayBeats: 0.5, damage: damage * 0.5 } : null,
    sound,
  };
};

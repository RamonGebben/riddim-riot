import { STEPS_PER_BAR } from '../../../grid';
import { DEFAULT_STYLE, type DrumStyle } from '../../../genre';
import { createRng, deriveSeed, type Rng } from '../../../rng';

export type DrumVoice = 'kick' | 'snare' | 'hat' | 'openHat';

export const DRUM_VOICES = [
  'kick',
  'snare',
  'hat',
  'openHat',
] satisfies Array<DrumVoice>;

/** One velocity per 1/16 step of the bar; 0 is a rest. */
export type DrumLane = Array<number>;

export type DrumBar = Record<DrumVoice, DrumLane>;

/** Where each feel's snares land, and the kicks always under them. */
const FEELS = {
  // Halftime: the snare on beat 3, not on 2 and 4.
  halftime: { snares: [8], kicks: [0], ghostKicks: [3, 6, 10, 11, 14] },
  // Two-step: snares on 2 and 4, the kick on 1 and the "and" of 3.
  twostep: { snares: [4, 12], kicks: [0, 10], ghostKicks: [3, 6, 11] },
};
const FILL_START = 12;
const OPEN_HAT_STEP = 14;
const BARS_PER_PHRASE = 4;

const lane = (velocityAt: (step: number) => number): DrumLane =>
  Array.from({ length: STEPS_PER_BAR }, (_, step) => velocityAt(step));

export const isFillBar = (bar: number) =>
  bar % BARS_PER_PHRASE === BARS_PER_PHRASE - 1;

/** How busy the bar's extras are; rolled once per bar so bars differ in feel. */
interface BarFeel {
  steps: (typeof FEELS)[keyof typeof FEELS];
  ghostKicks: number;
  hatShuffle: number;
  ghostSnares: number;
  fill: boolean;
}

const rollFeel = (rng: Rng, bar: number, style: DrumStyle): BarFeel => ({
  steps: FEELS[style.feel],
  ghostKicks: rng.pick(style.ghostKicks),
  hatShuffle: rng.pick(style.hatShuffle),
  ghostSnares: style.ghostSnares,
  fill: isFillBar(bar),
});

const kickLane = (rng: Rng, feel: BarFeel) =>
  lane(step => {
    if (feel.fill && step >= FILL_START) return 0;
    if (feel.steps.kicks.includes(step)) return step === 0 ? 1 : 0.9;
    if (!feel.steps.ghostKicks.includes(step)) return 0;
    return rng.chance(feel.ghostKicks) ? 0.8 : 0;
  });

const snareLane = (rng: Rng, feel: BarFeel) =>
  lane(step => {
    if (feel.steps.snares.includes(step)) return 1;
    if (feel.fill && step >= FILL_START) {
      // A rising roll that lands the next bar's downbeat.
      return 0.45 + ((step - FILL_START) / (STEPS_PER_BAR - FILL_START)) * 0.5;
    }
    // Quiet ghosts leading into each backbeat, and into the next bar.
    const ghost =
      feel.steps.snares.some(snare => step === snare - 1) ||
      step === STEPS_PER_BAR - 1;
    return ghost && rng.chance(feel.ghostSnares) ? 0.3 : 0;
  });

const openHatLane = (rng: Rng, feel: BarFeel) =>
  lane(step => {
    if (step !== OPEN_HAT_STEP || feel.fill) return 0;
    return rng.chance(0.35) ? 0.6 : 0;
  });

const hatLane = (rng: Rng, feel: BarFeel, openHat: DrumLane) =>
  lane(step => {
    if (openHat[step] > 0) return 0;
    // 8ths, accented on the offbeat.
    if (step % 2 === 0) return step % 4 === 2 ? 0.7 : 0.45;
    return rng.chance(feel.hatShuffle) ? 0.3 : 0;
  });

const generateFromRng = (rng: Rng, bar: number, style: DrumStyle): DrumBar => {
  const feel = rollFeel(rng, bar, style);
  const kick = kickLane(rng, feel);
  const snare = snareLane(rng, feel);
  const openHat = openHatLane(rng, feel);
  return { kick, snare, hat: hatLane(rng, feel, openHat), openHat };
};

/**
 * One bar of drums in `style`: halftime's kick on 1 and snare on 3, or
 * two-step's kick on 1 and the "and" of 3 under snares on 2 and 4, with
 * seeded ghost kicks and snares, hat shuffle and a snare fill closing
 * every 4-bar phrase. Each bar has its own seed, so any bar can be
 * generated on its own.
 */
export const generateDrumBar = (
  seed: number,
  bar: number,
  style: DrumStyle = DEFAULT_STYLE.style.drums,
): DrumBar => generateFromRng(createRng(deriveSeed(seed, bar)), bar, style);

/** The voices hit on a step, with their velocity. */
export const hitsAt = (
  drumBar: DrumBar,
  stepInBar: number,
): Array<{ voice: DrumVoice; velocity: number }> =>
  DRUM_VOICES.map(voice => ({
    voice,
    velocity: drumBar[voice][stepInBar],
  })).filter(hit => hit.velocity > 0);

/**
 * Where bar `bar`, step `stepInBar` lands in the pattern when the drums
 * play at half speed from bar `from`: each pattern bar stretched over two,
 * one pattern step every other 1/16. Null on the steps in between.
 */
export const halfSpeedStep = (
  { bar, stepInBar }: { bar: number; stepInBar: number },
  from: number,
): { bar: number; stepInBar: number } | null => {
  if (stepInBar % 2 === 1) return null;
  const into = bar - from;
  return {
    bar: from + Math.floor(into / 2),
    stepInBar: (into % 2) * (STEPS_PER_BAR / 2) + stepInBar / 2,
  };
};

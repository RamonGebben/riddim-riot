import { STEPS_PER_BAR } from '../../../grid';
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

/** Halftime: the snare lands on beat 3, not on 2 and 4. */
const SNARE_STEP = 8;
/** Syncopated kicks that keep the halftime groove readable. */
const GHOST_KICK_STEPS = [3, 6, 10, 11, 14];
const FILL_START = 12;
const OPEN_HAT_STEP = 14;
const BARS_PER_PHRASE = 4;

const lane = (velocityAt: (step: number) => number): DrumLane =>
  Array.from({ length: STEPS_PER_BAR }, (_, step) => velocityAt(step));

export const isFillBar = (bar: number) =>
  bar % BARS_PER_PHRASE === BARS_PER_PHRASE - 1;

/** How busy the bar's extras are; rolled once per bar so bars differ in feel. */
interface BarFeel {
  ghostKicks: number;
  hatShuffle: number;
  fill: boolean;
}

const rollFeel = (rng: Rng, bar: number): BarFeel => ({
  ghostKicks: rng.pick([0.15, 0.3, 0.45]),
  hatShuffle: rng.pick([0.1, 0.25, 0.4]),
  fill: isFillBar(bar),
});

const kickLane = (rng: Rng, feel: BarFeel) =>
  lane(step => {
    if (step === 0) return 1;
    if (feel.fill && step >= FILL_START) return 0;
    if (!GHOST_KICK_STEPS.includes(step)) return 0;
    return rng.chance(feel.ghostKicks) ? 0.8 : 0;
  });

const snareLane = (rng: Rng, feel: BarFeel) =>
  lane(step => {
    if (step === SNARE_STEP) return 1;
    if (feel.fill && step >= FILL_START) {
      // A rising roll that lands the next bar's downbeat.
      return 0.45 + ((step - FILL_START) / (STEPS_PER_BAR - FILL_START)) * 0.5;
    }
    if (step === SNARE_STEP - 1 || step === STEPS_PER_BAR - 1) {
      return rng.chance(0.15) ? 0.3 : 0;
    }
    return 0;
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

const generateFromRng = (rng: Rng, bar: number): DrumBar => {
  const feel = rollFeel(rng, bar);
  const kick = kickLane(rng, feel);
  const snare = snareLane(rng, feel);
  const openHat = openHatLane(rng, feel);
  return { kick, snare, hat: hatLane(rng, feel, openHat), openHat };
};

/**
 * One bar of halftime drums: kick on 1 and snare on 3 always, with seeded
 * ghost kicks, hat shuffle and a snare fill closing every 4-bar phrase.
 * Each bar has its own seed, so any bar can be generated on its own.
 */
export const generateDrumBar = (seed: number, bar: number): DrumBar =>
  generateFromRng(createRng(deriveSeed(seed, bar)), bar);

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

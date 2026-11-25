import { createRng, deriveSeed } from '../rng';

/**
 * Each level plays one subgenre, rolled from its seed by the level's
 * weights: dubstep's halftime early in a run, drum & bass's two-step late,
 * relaxed before intense within each. A subgenre sets the tempo, how the
 * drums are played and how hard the level presses.
 *
 * 70 and 140 BPM are the same pulse: what sets a style apart is where the
 * snare falls. Halftime puts it on 3 (140 felt as 70); two-step puts it
 * on 2 and 4 with the kick on 1 and the "and" of 3, so 172 feels fast.
 */
export type Subgenre =
  | 'deep'
  | 'riddim'
  | 'brostep'
  | 'halfstep'
  | 'liquid'
  | 'jumpup'
  | 'neurofunk';

/** Where the snare falls. */
export type DrumFeel = 'halftime' | 'twostep';

/** How a subgenre plays the drums: the feel and how busy its extras are. */
export interface DrumStyle {
  feel: DrumFeel;
  /** Chances a bar's ghost kicks land, one rolled per bar. */
  ghostKicks: ReadonlyArray<number>;
  /** Chances the off-8th hats fill in, one rolled per bar. */
  hatShuffle: ReadonlyArray<number>;
  /** Chance of each quiet ghost snare around the backbeat. */
  ghostSnares: number;
}

export interface Style {
  label: string;
  /** The tempo range a level of it rolls in, both ends included. */
  bpm: readonly [number, number];
  drums: DrumStyle;
  /**
   * How hard it presses, on top of the level's tier: waves are this much
   * bigger, so a relaxed style plays easier than an intense one.
   */
  pressure: number;
}

export const SUBGENRES: Record<Subgenre, Style> = {
  deep: {
    label: 'Deep dubstep',
    bpm: [138, 140],
    drums: {
      feel: 'halftime',
      ghostKicks: [0.05, 0.15],
      hatShuffle: [0.05, 0.1],
      ghostSnares: 0.05,
    },
    pressure: 0.9,
  },
  riddim: {
    label: 'Riddim',
    bpm: [140, 140],
    drums: {
      feel: 'halftime',
      ghostKicks: [0.15, 0.3, 0.45],
      hatShuffle: [0.1, 0.25, 0.4],
      ghostSnares: 0.15,
    },
    pressure: 1,
  },
  brostep: {
    label: 'Brostep',
    bpm: [140, 145],
    drums: {
      feel: 'halftime',
      ghostKicks: [0.3, 0.45, 0.6],
      hatShuffle: [0.25, 0.4],
      ghostSnares: 0.25,
    },
    pressure: 1.1,
  },
  halfstep: {
    label: 'Halfstep',
    bpm: [170, 172],
    drums: {
      feel: 'halftime',
      ghostKicks: [0.2, 0.35],
      hatShuffle: [0.2, 0.35],
      ghostSnares: 0.2,
    },
    pressure: 1,
  },
  liquid: {
    label: 'Liquid',
    bpm: [170, 174],
    drums: {
      feel: 'twostep',
      ghostKicks: [0.1, 0.2],
      hatShuffle: [0.4, 0.6],
      ghostSnares: 0.3,
    },
    pressure: 0.85,
  },
  jumpup: {
    label: 'Jump-up',
    bpm: [172, 175],
    drums: {
      feel: 'twostep',
      ghostKicks: [0.3, 0.45],
      hatShuffle: [0.2, 0.35],
      ghostSnares: 0.2,
    },
    pressure: 1.05,
  },
  neurofunk: {
    label: 'Neurofunk',
    bpm: [174, 176],
    drums: {
      feel: 'twostep',
      ghostKicks: [0.2, 0.3],
      hatShuffle: [0.3, 0.45],
      ghostSnares: 0.35,
    },
    pressure: 1.15,
  },
};

/**
 * Which subgenres each level rolls from, by weight: dubstep that bends to
 * drum & bass's tempo on level 3 (halfstep keeps the snare on 3), then
 * two-step, with level 4 the more relaxed and level 5 the most intense.
 */
const LEVEL_WEIGHTS: ReadonlyArray<ReadonlyArray<readonly [Subgenre, number]>> =
  [
    [
      ['deep', 60],
      ['riddim', 40],
    ],
    [
      ['riddim', 50],
      ['brostep', 30],
      ['deep', 20],
    ],
    [
      ['halfstep', 60],
      ['brostep', 40],
    ],
    [
      ['liquid', 60],
      ['jumpup', 30],
      ['neurofunk', 10],
    ],
    [
      ['neurofunk', 70],
      ['jumpup', 30],
    ],
  ];

const GENRE_STREAM = 60;

/** The weights a level rolls by: its own, the last level's past the run. */
export const weightsFor = (level: number) =>
  LEVEL_WEIGHTS[Math.min(Math.max(level, 1), LEVEL_WEIGHTS.length) - 1];

export interface LevelStyle {
  subgenre: Subgenre;
  style: Style;
  bpm: number;
}

/**
 * The subgenre and tempo a level plays, rolled from its seed: the same
 * level always plays the same.
 */
export const styleFor = (levelSeed: number, level: number): LevelStyle => {
  const rng = createRng(deriveSeed(levelSeed, GENRE_STREAM));
  const weights = weightsFor(level);
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
  const roll = rng.next() * total;
  const { picked } = weights.reduce<{ picked: Subgenre | null; at: number }>(
    (acc, [subgenre, weight]) =>
      acc.picked || roll >= acc.at + weight
        ? { ...acc, at: acc.at + weight }
        : { picked: subgenre, at: acc.at + weight },
    { picked: null, at: 0 },
  );
  const subgenre = picked ?? weights[weights.length - 1][0];
  const style = SUBGENRES[subgenre];
  return { subgenre, style, bpm: rng.int(style.bpm[0], style.bpm[1]) };
};

/** Riddim at 140: what plays when no level has picked (the backdrop, tests). */
export const DEFAULT_STYLE: LevelStyle = {
  subgenre: 'riddim',
  style: SUBGENRES.riddim,
  bpm: 140,
};

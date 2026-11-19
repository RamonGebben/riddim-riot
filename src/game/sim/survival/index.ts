import { MAX_ENEMIES } from '../enemy';

/**
 * A level plays as one track. It waits for the player to step into the
 * circle; standing in charges it over a bar and slams on the downbeat, which
 * starts the song. Waves follow the song's parts - sparse in the intro and
 * breakdown, ramping through the build-up, heavy in the drops - and the
 * last drop brings the boss. Once the boss is down and the outro is playing,
 * the circle opens as the exit.
 */
export type SurvivalPhase = 'waiting' | 'charging' | 'song' | 'clear';

export type SongPart =
  | 'intro'
  | 'breakdown'
  | 'buildup'
  | 'drop1'
  | 'drop2'
  | 'bridge'
  | 'drop3'
  | 'outro';

export interface SongSection {
  part: SongPart;
  bars: number;
}

/** The song a level plays; the last drop grows from 32 to 48 bars. */
export const songFor = (level: number): Array<SongSection> => [
  { part: 'intro', bars: 16 },
  { part: 'breakdown', bars: 8 },
  { part: 'buildup', bars: 8 },
  { part: 'drop1', bars: 16 },
  { part: 'drop2', bars: 16 },
  { part: 'bridge', bars: 16 },
  { part: 'drop3', bars: Math.min(32 + 8 * (level - 1), 48) },
  { part: 'outro', bars: 16 },
];

export interface SongPosition {
  part: SongPart;
  /** Bars into the part, from 0. */
  bar: number;
  bars: number;
}

/** Where `barsIn` bars into the song falls; past the end it stays in the outro. */
export const partAt = (
  song: Array<SongSection>,
  barsIn: number,
): SongPosition => {
  const found = song.reduce<{ start: number; at: SongPosition | null }>(
    (acc, section) => {
      if (acc.at) return acc;
      const end = acc.start + section.bars;
      return barsIn < end
        ? {
            start: end,
            at: {
              part: section.part,
              bar: barsIn - acc.start,
              bars: section.bars,
            },
          }
        : { start: end, at: null };
    },
    { start: 0, at: null },
  );
  const last = song[song.length - 1];
  return (
    found.at ?? {
      part: last.part,
      bar: last.bars - 1,
      bars: last.bars,
    }
  );
};

/** How each part sends enemies: every how many bars, and how many extra. */
interface PartPlan {
  /** null: nothing new in this part. */
  everyBars: number | null;
  extra: number;
  chargers: boolean;
}

const PLANS = {
  intro: { everyBars: 8, extra: 0, chargers: false },
  breakdown: { everyBars: 8, extra: -1, chargers: false },
  buildup: { everyBars: 2, extra: 0, chargers: true },
  drop1: { everyBars: 4, extra: 2, chargers: true },
  drop2: { everyBars: 4, extra: 3, chargers: true },
  bridge: { everyBars: 8, extra: 0, chargers: false },
  drop3: { everyBars: 4, extra: 4, chargers: true },
  outro: { everyBars: null, extra: 0, chargers: false },
} satisfies Record<SongPart, PartPlan>;

export interface Survival {
  phase: SurvivalPhase;
  /** Charging: when the player stepped in (the circle lights at once). */
  steppedAt: number | null;
  /** Charging: the bar line the fill began on, and its audio time. */
  chargeBar: number | null;
  chargeAt: number | null;
  /** The bar the slam landed on: the song's first bar. */
  startBar: number;
  /** Waves sent since the slam. */
  sent: number;
  lastWaveBar: number;
  bossSent: boolean;
}

export const INITIAL_SURVIVAL: Survival = {
  phase: 'waiting',
  steppedAt: null,
  chargeBar: null,
  chargeAt: null,
  startBar: 0,
  sent: 0,
  lastWaveBar: 0,
  bossSent: false,
};

/** Already playing from `bar` - for the stress test, which skips the circle. */
export const songFrom = (bar: number): Survival => ({
  ...INITIAL_SURVIVAL,
  phase: 'song',
  startBar: bar,
  lastWaveBar: bar,
});

/** What a bar line sends: a wave (with its part's extra), the boss, or both. */
export interface SurvivalSpawn {
  wave: { extra: number; chargers: boolean } | null;
  boss: boolean;
}

/** The player stepped into the circle at `now`: it commits to the start. */
export const stepIn = (survival: Survival, now: number): Survival =>
  survival.phase === 'waiting'
    ? { ...survival, phase: 'charging', steppedAt: now }
    : survival;

/** One bar line: where the level goes next, and what to spawn. */
export const advanceSurvival = (
  survival: Survival,
  {
    bar,
    time,
    alive,
    bossAlive,
    song,
  }: {
    bar: number;
    time: number;
    alive: number;
    bossAlive: boolean;
    song: Array<SongSection>;
  },
): { survival: Survival; spawn: SurvivalSpawn | null } => {
  const hold = { survival, spawn: null };

  if (survival.phase === 'charging') {
    if (survival.chargeBar === null) {
      return {
        survival: { ...survival, chargeBar: bar, chargeAt: time },
        spawn: null,
      };
    }
    if (bar <= survival.chargeBar) return hold;
    return advanceSurvival(
      { ...survival, phase: 'song', startBar: bar, lastWaveBar: bar - 1 },
      { bar, time, alive, bossAlive, song },
    );
  }
  if (survival.phase !== 'song') return hold;

  const at = partAt(song, bar - survival.startBar);
  if (at.part === 'outro' && survival.bossSent && !bossAlive) {
    return { survival: { ...survival, phase: 'clear' }, spawn: null };
  }
  const plan: PartPlan = PLANS[at.part];
  const boss = at.part === 'drop3' && !survival.bossSent;
  const due =
    plan.everyBars !== null &&
    (at.bar === 0 ||
      bar - survival.lastWaveBar >= plan.everyBars ||
      (alive === 0 && bar > survival.lastWaveBar));
  if (!due && !boss) return hold;
  return {
    survival: {
      ...survival,
      sent: due ? survival.sent + 1 : survival.sent,
      lastWaveBar: due ? bar : survival.lastWaveBar,
      bossSent: survival.bossSent || boss,
    },
    spawn: {
      wave: due ? { extra: plan.extra, chargers: plan.chargers } : null,
      boss,
    },
  };
};

/** Waves grow with each one sent, each level and the part, never past the cap. */
export const waveSize = ({
  sent,
  level,
  alive,
  extra = 0,
}: {
  /** Waves sent before this one. */
  sent: number;
  level: number;
  alive: number;
  extra?: number;
}): number =>
  Math.max(
    0,
    Math.min(
      2 + Math.floor(sent / 2) + 2 * (level - 1) + extra,
      14,
      MAX_ENEMIES - alive,
    ),
  );

/** The arrangement section the music plays, picked on each bar line. */
export type Section = 'calm' | 'groove' | 'build' | 'drop';

const SECTIONS = {
  intro: 'groove',
  breakdown: 'calm',
  buildup: 'build',
  drop1: 'drop',
  drop2: 'drop',
  bridge: 'groove',
  drop3: 'drop',
  outro: 'calm',
} satisfies Record<SongPart, Section>;

/** Where the song is at `bar`, or null before the slam and after the exit opens. */
export const songPosition = (
  survival: Survival,
  { bar, song }: { bar: number; song: Array<SongSection> },
): SongPosition | null =>
  survival.phase === 'song' || survival.phase === 'clear'
    ? partAt(song, bar - survival.startBar)
    : null;

export const sectionFor = (
  survival: Survival,
  { bar, song }: { bar: number; song: Array<SongSection> },
): Section => {
  const at = songPosition(survival, { bar, song });
  return at ? SECTIONS[at.part] : 'calm';
};

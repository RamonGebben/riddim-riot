import { MAX_ENEMIES } from '../enemy';
import { waveCap, waveEvery } from '../../tier';

/**
 * A level plays as one track. It waits for the player to step into the
 * circle; standing in fills it over a bar (stepping out drains it again),
 * and once full it slams on the next downbeat, which starts the song. Waves follow the song's parts - sparse in the intro and
 * breakdown, ramping through the build-up, heavy in the drops - and the
 * last drop brings the boss. Once the boss is down and the outro is playing,
 * the circle opens as the exit, which fills the same way to take.
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

/** Bars of standing in it the circle takes to fill; out, it drains as fast. */
export const CHARGE_BARS = 1;

export interface Survival {
  /** `charging`: the player is in the start circle, or it's full. */
  phase: SurvivalPhase;
  /**
   * How full the circle is, 0-1: the start's before the slam, the exit's
   * once open. A full start holds until the next bar line slams it.
   */
  charge: number;
  /** The bar the slam landed on: the song's first bar. */
  startBar: number;
  /** Waves sent since the slam. */
  sent: number;
  lastWaveBar: number;
  bossSent: boolean;
}

export const INITIAL_SURVIVAL: Survival = {
  phase: 'waiting',
  charge: 0,
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

/**
 * A frame at the circle: standing in fills it, stepping out drains it. A
 * full start stays full - it's committed to the slam - and the fight
 * leaves it alone.
 */
export const chargeCircle = (
  survival: Survival,
  {
    inside,
    dt,
    barSeconds,
  }: { inside: boolean; dt: number; barSeconds: number },
): Survival => {
  if (survival.phase === 'song') return survival;
  if (survival.phase === 'charging' && survival.charge >= 1) return survival;
  const step = dt / (CHARGE_BARS * barSeconds);
  const charge = Math.min(
    Math.max(survival.charge + (inside ? step : -step), 0),
    1,
  );
  const phase =
    survival.phase === 'clear'
      ? 'clear'
      : inside || charge >= 1
        ? 'charging'
        : 'waiting';
  if (charge === survival.charge && phase === survival.phase) return survival;
  return { ...survival, phase, charge };
};

/** The exit has filled: the player takes it. */
export const exitTaken = (survival: Survival): boolean =>
  survival.phase === 'clear' && survival.charge >= 1;

/** One bar line: where the level goes next, and what to spawn. */
export const advanceSurvival = (
  survival: Survival,
  {
    bar,
    time,
    alive,
    bossAlive,
    song,
    level = 1,
  }: {
    bar: number;
    time: number;
    alive: number;
    bossAlive: boolean;
    song: Array<SongSection>;
    /** Further into a run, waves come sooner (see `tier`). */
    level?: number;
  },
): { survival: Survival; spawn: SurvivalSpawn | null } => {
  const hold = { survival, spawn: null };

  if (survival.phase === 'charging') {
    if (survival.charge < 1) return hold;
    // Emptied for the exit, which fills from nothing.
    return advanceSurvival(
      {
        ...survival,
        phase: 'song',
        charge: 0,
        startBar: bar,
        lastWaveBar: bar - 1,
      },
      { bar, time, alive, bossAlive, song, level },
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
      bar - survival.lastWaveBar >= waveEvery(plan.everyBars, level) ||
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
      waveCap(level),
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

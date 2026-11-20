import {
  LEVEL_CLEAR_BONUS,
  MAX_MULTIPLIER,
  POINTS_PER_KILL,
  RUN_LEVELS,
} from '~/game/sim';

/** A finished run as the client reports it. */
export interface RunReport {
  score: number;
  /** The level the run ended on, 1-based. */
  level: number;
  kills: number;
  outcome: 'died' | 'won';
}

/**
 * A level's song runs 128 bars or more (about 3.7 minutes at 140 BPM),
 * and a level clears only once it ends: two minutes leaves room for any
 * clock drift.
 */
export const MIN_LEVEL_MS = 120_000;
/** Far past what the 30-enemy cap allows, even with blasts. */
export const MAX_KILLS_PER_SECOND = 6;
/** A run's ticket expires after this. */
export const MAX_RUN_MS = 6 * 60 * 60 * 1000;

/**
 * Why a reported run can't have happened in `elapsedMs` since its ticket,
 * or null when it could. Light checks: they stop edited numbers, not a
 * patient cheat.
 */
export const implausible = (
  { score, level, kills, outcome }: RunReport,
  elapsedMs: number,
): string | null => {
  if (elapsedMs > MAX_RUN_MS) return 'the run ticket expired';
  if (outcome === 'won' && level !== RUN_LEVELS)
    return 'a run is only won on the last level';
  const cleared = outcome === 'won' ? RUN_LEVELS : level - 1;
  if (elapsedMs < cleared * MIN_LEVEL_MS)
    return 'the levels were cleared too fast';
  if (kills > Math.ceil((elapsedMs / 1000) * MAX_KILLS_PER_SECOND))
    return 'too many kills for the time played';
  // Every kill scores 100 to 800 points, by the combo multiplier, and
  // every cleared level its bonus.
  const killPoints = score - cleared * LEVEL_CLEAR_BONUS;
  if (killPoints < kills * POINTS_PER_KILL)
    return 'too few points for the kills';
  if (killPoints > kills * POINTS_PER_KILL * MAX_MULTIPLIER)
    return 'too many points for the kills';
  return null;
};

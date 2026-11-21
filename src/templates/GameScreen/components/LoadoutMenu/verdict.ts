/** What a weapon does, as numbers to compare: bigger is better in each. */
export interface WeaponStats {
  /** Damage a full bar of direct hits deals: the headline number. */
  perBar: number;
  hit: number;
  shots: number;
  reach: number;
  area: number;
}

export type Verdict = 'stronger' | 'trade-off' | 'weaker';

/** A damage difference smaller than this share is a wash, not a verdict. */
const MARGIN = 0.05;

const SIDE_STATS: Array<keyof WeaponStats> = ['shots', 'reach', 'area'];

/**
 * How `pick` measures up against `held`, judged on damage per bar first:
 * clearly more is stronger; clearly less with nothing else to show for it
 * is weaker; anything else - a wash, or less damage for more reach, shots
 * or blast - is a trade-off worth hearing.
 */
export const verdictOf = (pick: WeaponStats, held: WeaponStats): Verdict => {
  const change = (pick.perBar - held.perBar) / Math.max(held.perBar, 1);
  if (change >= MARGIN) return 'stronger';
  const gains = SIDE_STATS.some(stat => pick[stat] > held[stat]);
  return change <= -MARGIN && !gains ? 'weaker' : 'trade-off';
};

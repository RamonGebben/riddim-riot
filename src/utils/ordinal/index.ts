const SUFFIXES = { one: 'ST', two: 'ND', few: 'RD', other: 'TH' } as const;
const rules = new Intl.PluralRules('en', { type: 'ordinal' });

/** A rank the arcade way: 1ST, 2ND, 3RD, 11TH, 22ND. */
export const ordinal = (rank: number): string =>
  `${rank}${SUFFIXES[rules.select(rank) as keyof typeof SUFFIXES]}`;

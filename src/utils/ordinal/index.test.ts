import { describe, expect, it } from 'vitest';
import { ordinal } from '.';

describe('ordinal', () => {
  it('suffixes ranks in capitals', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 37, 101].map(ordinal)).toEqual([
      '1ST',
      '2ND',
      '3RD',
      '4TH',
      '11TH',
      '12TH',
      '13TH',
      '21ST',
      '22ND',
      '37TH',
      '101ST',
    ]);
  });
});

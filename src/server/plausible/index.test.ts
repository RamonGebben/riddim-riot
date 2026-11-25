import { describe, expect, it } from 'vitest';
import { implausible, MAX_RUN_MS, MIN_LEVEL_MS } from '.';

const MINUTE = 60_000;

describe('implausible', () => {
  it('accepts an honest death on level 2, one level bonus in', () => {
    expect(
      implausible(
        { score: 22_400, level: 2, kills: 60, outcome: 'died' },
        6 * MINUTE,
      ),
    ).toBeNull();
  });

  it('rejects a level bonus that was never earned', () => {
    expect(
      implausible(
        { score: 12_400, level: 2, kills: 60, outcome: 'died' },
        6 * MINUTE,
      ),
    ).toBe('too few points for the kills');
    expect(
      implausible(
        { score: 10_000, level: 1, kills: 0, outcome: 'died' },
        MINUTE,
      ),
    ).toBe('too many points for the kills');
  });

  it('rejects a score that is not in hundreds', () => {
    expect(
      implausible({ score: 150, level: 1, kills: 1, outcome: 'died' }, MINUTE),
    ).toBe('the score is off the scale');
  });

  it('accepts an early death with nothing scored', () => {
    expect(
      implausible({ score: 0, level: 1, kills: 0, outcome: 'died' }, 20_000),
    ).toBeNull();
  });

  it('accepts a win after five full songs', () => {
    expect(
      implausible(
        { score: 350_000, level: 5, kills: 900, outcome: 'won' },
        20 * MINUTE,
      ),
    ).toBeNull();
  });

  it('rejects levels cleared faster than their songs', () => {
    expect(
      implausible(
        { score: 1_000, level: 4, kills: 10, outcome: 'died' },
        3 * MIN_LEVEL_MS - 1,
      ),
    ).toBe('the levels were cleared too fast');
  });

  it('rejects a win before the last level', () => {
    expect(
      implausible(
        { score: 1_000, level: 3, kills: 10, outcome: 'won' },
        20 * MINUTE,
      ),
    ).toBe('a run is only won on the last level');
  });

  it('rejects points the kills could not score', () => {
    expect(
      implausible(
        { score: 8_100, level: 1, kills: 1, outcome: 'died' },
        MINUTE,
      ),
    ).toBe('too many points for the kills');
    expect(
      implausible({ score: 0, level: 1, kills: 5, outcome: 'died' }, MINUTE),
    ).toBe('too few points for the kills');
  });

  it('rejects more kills than the time allows', () => {
    expect(
      implausible(
        { score: 100_000, level: 1, kills: 1_000, outcome: 'died' },
        MINUTE,
      ),
    ).toBe('too many kills for the time played');
  });

  it('keeps a run paused overnight', () => {
    expect(
      implausible(
        { score: 35_700, level: 1, kills: 148, outcome: 'died' },
        20 * 60 * MINUTE,
      ),
    ).toBeNull();
  });

  it('rejects a run started more than a week ago', () => {
    expect(
      implausible(
        { score: 0, level: 1, kills: 0, outcome: 'died' },
        MAX_RUN_MS + MINUTE,
      ),
    ).toBe('it started more than a week ago');
  });
});

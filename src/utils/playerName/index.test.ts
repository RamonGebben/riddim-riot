import { describe, expect, it } from 'vitest';
import { nameProblem, normalizeName, passwordProblem } from '.';

describe('normalizeName', () => {
  it('trims, capitalizes and joins words with _', () => {
    expect(normalizeName('  riddim rat ')).toBe('RIDDIM_RAT');
  });
});

describe('nameProblem', () => {
  it('accepts 3 to 12 letters, numbers and _', () => {
    expect(nameProblem('SUB')).toBeNull();
    expect(nameProblem('K_HALFTIME_1')).toBeNull();
  });

  it('says what is wrong', () => {
    expect(nameProblem('AB')).toBe('At least 3 characters');
    expect(nameProblem('WOBBLEKINGDOM')).toBe('At most 12 characters');
    expect(nameProblem('BASS!')).toBe('Letters, numbers and _ only');
    expect(nameProblem('BÄSS')).toBe('Letters, numbers and _ only');
  });

  it('refuses offensive names without saying why in detail', () => {
    expect(nameProblem('SH1T_HEAD')).toBe('Pick another name');
    expect(nameProblem('WOBBLEKING')).toBeNull();
  });
});

describe('passwordProblem', () => {
  it('wants at least 8 characters', () => {
    expect(passwordProblem('short')).toBe('At least 8 characters');
    expect(passwordProblem('long enough')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { codeProblem, formatCode, normalizeCode } from '.';

describe('recovery codes', () => {
  it('reads a code back however it was copied down', () => {
    expect(normalizeCode('k7qm-2xrp 9vda-h4tn')).toBe('K7QM2XRP9VDAH4TN');
    expect(normalizeCode('O0Il')).toBe('0011');
  });

  it('shows a code in groups of four', () => {
    expect(formatCode('K7QM2XRP9VDAH4TN')).toBe('K7QM-2XRP-9VDA-H4TN');
  });

  it('says what is wrong with a typed code', () => {
    expect(codeProblem('K7QM-2XRP-9VDA-H4TN')).toBeNull();
    expect(codeProblem('')).toBe('Enter your recovery code');
    expect(codeProblem('K7QM-2XRP')).toMatch(/16 letters and digits/);
    expect(codeProblem('K7QM-2XRP-9VDA-H4T!')).toBe(
      "That isn't a recovery code",
    );
  });
});

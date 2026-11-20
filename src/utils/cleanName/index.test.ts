import { describe, expect, it } from 'vitest';
import { isOffensiveName } from '.';

describe('isOffensiveName', () => {
  it('catches profanity however it is spelled', () => {
    ['FUCK', 'F_U_C_K', 'SH1T', 'B1TCH', 'N1GG3R', 'FUCKYOU'].forEach(name =>
      expect(isOffensiveName(name), name).toBe(true),
    );
  });

  it('catches hate names and Dutch insults', () => {
    ['HITLER', 'NAZI_1', 'KKK', 'KANKER', 'K4NKER', 'TERING_LIJER'].forEach(
      name => expect(isOffensiveName(name), name).toBe(true),
    );
  });

  it('lets ordinary names through', () => {
    [
      'WOBBLEKING',
      'RIDDIMRAT',
      'BASSFACE',
      'BASS_FACE',
      'ASSASSIN',
      'CLASSIC',
      'SCUNTHORPE',
      'COCKPIT',
      'DICKENS',
      'K_HALFTIME',
    ].forEach(name => expect(isOffensiveName(name), name).toBe(false));
  });
});

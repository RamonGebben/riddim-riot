/**
 * Recovery codes: 16 characters of Crockford's base 32 (80 random bits),
 * shown in groups of four. Reading one back forgives what people get
 * wrong copying it down: case, dashes and spaces, O for 0, I or L for 1.
 */
export const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const CODE_LENGTH = 16;
const GROUP = 4;

/** A code as it's compared: its 16 characters, nothing else. */
export const normalizeCode = (code: string): string =>
  code
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');

/** A code as it's shown: XXXX-XXXX-XXXX-XXXX. */
export const formatCode = (code: string): string =>
  (normalizeCode(code).match(new RegExp(`.{1,${GROUP}}`, 'g')) ?? []).join('-');

/** What's wrong with a typed code, or null when it could be one. */
export const codeProblem = (code: string): string | null => {
  const normalized = normalizeCode(code);
  if (normalized.length === 0) return 'Enter your recovery code';
  if (normalized.length !== CODE_LENGTH)
    return `A recovery code is ${CODE_LENGTH} letters and digits`;
  return [...normalized].every(char => CODE_ALPHABET.includes(char))
    ? null
    : "That isn't a recovery code";
};

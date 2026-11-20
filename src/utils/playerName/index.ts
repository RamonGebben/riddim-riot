import { isOffensiveName } from '~/utils/cleanName';

export const NAME_MIN = 3;
export const NAME_MAX = 12;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

const NAME = new RegExp(`^[A-Z0-9_]{${NAME_MIN},${NAME_MAX}}$`);

/** A typed name as the board shows it: trimmed, capitals, `_` for spaces. */
export const normalizeName = (typed: string): string =>
  typed.trim().toUpperCase().replaceAll(/\s+/g, '_');

/** Why a normalized name can't be used, or null when it can. */
export const nameProblem = (name: string): string | null => {
  if (name.length < NAME_MIN) return `At least ${NAME_MIN} characters`;
  if (name.length > NAME_MAX) return `At most ${NAME_MAX} characters`;
  if (!NAME.test(name)) return 'Letters, numbers and _ only';
  // Every visitor sees the board: no need to repeat the word back.
  if (isOffensiveName(name)) return 'Pick another name';
  return null;
};

export const passwordProblem = (password: string): string | null => {
  if (password.length < PASSWORD_MIN)
    return `At least ${PASSWORD_MIN} characters`;
  if (password.length > PASSWORD_MAX)
    return `At most ${PASSWORD_MAX} characters`;
  return null;
};

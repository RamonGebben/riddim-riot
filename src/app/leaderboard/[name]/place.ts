import { cache } from 'react';
import { publicCaller } from '~/server/caller';

/** A shared place, looked up once per request for page, title and card. */
export const findPlace = cache(async (name: string) => {
  // A stray `%` (`/leaderboard/100%`) is no one's name, not a crash.
  const decoded = (() => {
    try {
      return decodeURIComponent(name);
    } catch {
      return null;
    }
  })();
  return decoded === null
    ? null
    : publicCaller().board.player({ name: decoded });
});

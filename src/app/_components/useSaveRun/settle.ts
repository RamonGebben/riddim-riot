import { isRefusal } from '../boardErrors';

/**
 * What a save's answer means for the run kept on this device: dropped
 * once it's saved or refused for good (kept to retry when the board was
 * out of reach), and the board refetched only when it changed.
 */
export const settle = (error: unknown) => ({
  drop: !error || isRefusal(error),
  refresh: !error,
});

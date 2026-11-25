import { RUN_OUTCOMES, type RunOutcome } from '~/game/sim';

const KEY = 'bass-weapons:pending-run';

/** A finished run waiting to be saved to the board. */
export interface PendingRun {
  ticket: string;
  score: number;
  level: number;
  kills: number;
  seed: number;
  outcome: RunOutcome;
}

/** Browser storage as far as this needs it; may be missing or throw. */
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const local = (): Store | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const isPendingRun = (value: unknown): value is PendingRun => {
  if (typeof value !== 'object' || value === null) return false;
  const run = value as Record<string, unknown>;
  return (
    typeof run.ticket === 'string' &&
    ['score', 'level', 'kills', 'seed'].every(
      field => typeof run[field] === 'number',
    ) &&
    RUN_OUTCOMES.some(outcome => outcome === run.outcome)
  );
};

/** The run kept on this device, if there is one. */
export const readPendingRun = (
  store: Store | null = local(),
): PendingRun | null => {
  try {
    const saved: unknown = JSON.parse(store?.getItem(KEY) ?? 'null');
    return isPendingRun(saved) ? saved : null;
  } catch {
    return null;
  }
};

/** Keep a run until it's saved or skipped; a newer run replaces it. */
export const keepPendingRun = (
  run: PendingRun,
  store: Store | null = local(),
) => {
  try {
    store?.setItem(KEY, JSON.stringify(run));
  } catch {
    // Storage blocked: the run is only held while the page is open.
  }
};

export const dropPendingRun = (
  ticket: string,
  store: Store | null = local(),
) => {
  try {
    if (readPendingRun(store)?.ticket === ticket) store?.removeItem(KEY);
  } catch {
    // Nothing kept to drop.
  }
};

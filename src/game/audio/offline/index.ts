let queue: Promise<unknown> = Promise.resolve();

/**
 * Runs `work` once every offline render queued before it has finished.
 * `Offline` swaps Tone's global context while it builds the graph, so two
 * at once would build into each other's.
 */
export const offlineTurn = <T>(work: () => Promise<T>): Promise<T> => {
  const turn = queue.then(work);
  queue = turn.catch(() => undefined);
  return turn;
};

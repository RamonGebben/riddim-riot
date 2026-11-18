type Handler<T> = (payload: T) => void;

export interface Bus<Events extends object> {
  /** Subscribe; returns the unsubscribe function. */
  on: <K extends keyof Events>(
    type: K,
    handler: Handler<Events[K]>,
  ) => () => void;
  emit: <K extends keyof Events>(type: K, payload: Events[K]) => void;
}

/**
 * A typed, synchronous event bus. Game, audio and visuals all subscribe to
 * the clock through it instead of keeping their own time.
 */
export const createBus = <Events extends object>(): Bus<Events> => {
  const handlers = new Map<keyof Events, Set<Handler<never>>>();

  const listeners = <K extends keyof Events>(type: K) =>
    (handlers.get(type) ?? new Set()) as Set<Handler<Events[K]>>;

  return {
    on: (type, handler) => {
      handlers.set(type, new Set([...listeners(type), handler]));
      return () => {
        const remaining = [...listeners(type)].filter(h => h !== handler);
        handlers.set(type, new Set(remaining));
      };
    },
    emit: (type, payload) => {
      listeners(type).forEach(handler => handler(payload));
    },
  };
};

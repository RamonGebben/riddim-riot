import { appRouter } from '../routers';

/**
 * The routers called from a server component, as no one in particular:
 * for the public board and shared places, never for a player's own data.
 */
export const publicCaller = () =>
  appRouter.createCaller({
    headers: new Headers(),
    resHeaders: new Headers(),
    token: null,
    playerId: () => Promise.resolve(null),
  });

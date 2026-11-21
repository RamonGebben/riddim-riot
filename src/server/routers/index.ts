import { router } from '../trpc';
import { accountRouter } from './account';
import { boardRouter } from './board';
import { loadoutRouter } from './loadout';
import { runsRouter } from './runs';

export const appRouter = router({
  account: accountRouter,
  board: boardRouter,
  loadout: loadoutRouter,
  runs: runsRouter,
});

export type AppRouter = typeof appRouter;

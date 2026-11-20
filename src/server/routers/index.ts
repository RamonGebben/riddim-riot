import { router } from '../trpc';
import { accountRouter } from './account';
import { boardRouter } from './board';
import { runsRouter } from './runs';

export const appRouter = router({
  account: accountRouter,
  board: boardRouter,
  runs: runsRouter,
});

export type AppRouter = typeof appRouter;

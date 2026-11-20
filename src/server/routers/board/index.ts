import { z } from 'zod';
import { normalizeName } from '~/utils/playerName';
import { asPlayer } from '../../db';
import { playerStanding, rankedCount, topRows } from '../../standing';
import { publicProcedure, router } from '../../trpc';

export const BOARD_SIZE = 50;

export const boardRouter = router({
  /** The top of the lifetime-points board, and how many are on it. */
  top: publicProcedure.query(() =>
    asPlayer(null, async tx => ({
      rows: await topRows(tx, BOARD_SIZE),
      ranked: await rankedCount(tx),
    })),
  ),

  /** One player's place, for a shared link; null for an unknown name. */
  player: publicProcedure
    .input(z.object({ name: z.string().max(40).transform(normalizeName) }))
    .query(({ input }) => asPlayer(null, tx => playerStanding(tx, input.name))),
});

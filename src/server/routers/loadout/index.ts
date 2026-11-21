import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { loadoutSchema, type KeptLoadout } from '~/utils/keptLoadout';
import { asPlayer, loadouts } from '../../db';
import { playerProcedure, publicProcedure, router } from '../../trpc';

export const loadoutRouter = router({
  /**
   * The loadout the player keeps between runs, with when it was saved;
   * null for none or no one signed in.
   */
  mine: publicProcedure.query(async ({ ctx }): Promise<KeptLoadout | null> => {
    const playerId = await ctx.playerId();
    if (!playerId) return null;
    const [row] = await asPlayer(playerId, tx =>
      tx.select().from(loadouts).where(eq(loadouts.playerId, playerId)),
    );
    if (!row) return null;
    // Checked on the way out too: a row from an older build may not fit.
    const kept = loadoutSchema.safeParse(row.recipes);
    return kept.success
      ? { recipes: kept.data, savedAt: row.updatedAt.getTime() }
      : null;
  }),

  /** Keeps these weapons for the player's next run. */
  save: playerProcedure
    .input(z.object({ recipes: loadoutSchema }))
    .mutation(async ({ ctx, input }): Promise<KeptLoadout> => {
      const savedAt = new Date();
      await asPlayer(ctx.playerId, tx =>
        tx
          .insert(loadouts)
          .values({
            playerId: ctx.playerId,
            recipes: input.recipes,
            updatedAt: savedAt,
          })
          .onConflictDoUpdate({
            target: loadouts.playerId,
            set: { recipes: input.recipes, updatedAt: savedAt },
          }),
      );
      return { recipes: input.recipes, savedAt: savedAt.getTime() };
    }),
});

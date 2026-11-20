import { TRPCError } from '@trpc/server';
import { and, eq, gt, sql } from 'drizzle-orm';
import { z } from 'zod';
import { RUN_LEVELS } from '~/game/sim';
import { asPlayer, players, runs } from '../../db';
import { implausible } from '../../plausible';
import { playerStanding, rowsAround } from '../../standing';
import { playerProcedure, publicProcedure, router } from '../../trpc';

/** Runs a player may save in ten minutes. */
const MAX_RECENT_RUNS = 10;
const RECENT_MS = 10 * 60 * 1000;

const report = z.object({
  ticket: z.string().max(200),
  score: z.number().int().min(0),
  level: z.number().int().min(1).max(RUN_LEVELS),
  kills: z.number().int().min(0),
  seed: z
    .number()
    .int()
    .min(0)
    .max(2 ** 32),
  outcome: z.enum(['died', 'won']),
});

export const runsRouter = router({
  /** A ticket for a run starting now; anyone can play, signed in or not. */
  start: publicProcedure.mutation(() =>
    asPlayer(null, async tx => {
      const result = await tx.execute<{ ticket: string }>(
        sql`select api.issue_run_ticket() as ticket`,
      );
      return { ticket: result.rows[0].ticket };
    }),
  ),

  /**
   * Saves a finished run (a death or a win; quitting saves nothing) and
   * returns the player's place before and after. Saving the same ticket
   * twice saves it once.
   */
  submit: playerProcedure.input(report).mutation(({ ctx, input }) =>
    asPlayer(ctx.playerId, async tx => {
      const found = await tx.execute<{ run_id: string; started_at: string }>(
        sql`select * from api.read_run_ticket(${input.ticket})`,
      );
      const ticket = found.rows[0];
      if (!ticket)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: "This run's ticket isn't valid",
        });

      const [me] = await tx
        .select({ name: players.name })
        .from(players)
        .where(eq(players.id, ctx.playerId));
      const before = await playerStanding(tx, me.name);

      const [saved] = await tx
        .select({ id: runs.id })
        .from(runs)
        .where(eq(runs.id, ticket.run_id));
      if (!saved) {
        const elapsedMs = Date.now() - new Date(ticket.started_at).getTime();
        const problem = implausible(input, elapsedMs);
        if (problem)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `This run can't be saved: ${problem}`,
          });
        const recent = await tx
          .select({ id: runs.id })
          .from(runs)
          .where(
            and(
              eq(runs.playerId, ctx.playerId),
              gt(runs.createdAt, new Date(Date.now() - RECENT_MS)),
            ),
          );
        if (recent.length >= MAX_RECENT_RUNS)
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many runs at once. Try again in a few minutes.',
          });
        // Row level security checks the run is this player's own.
        await tx.insert(runs).values({
          id: ticket.run_id,
          playerId: ctx.playerId,
          score: input.score,
          level: input.level,
          kills: input.kills,
          seed: input.seed,
          durationMs: Math.max(1, Math.round(elapsedMs)),
          outcome: input.outcome,
        });
      }

      const after = await playerStanding(tx, me.name);
      return {
        name: me.name,
        score: input.score,
        before: { rank: before?.rank ?? null, total: before?.totalPoints ?? 0 },
        after: { rank: after?.rank ?? null, total: after?.totalPoints ?? 0 },
        rows: await rowsAround(tx, me.name),
      };
    }),
  ),
});

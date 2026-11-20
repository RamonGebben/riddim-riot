import { TRPCError } from '@trpc/server';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  nameProblem,
  normalizeName,
  passwordProblem,
} from '~/utils/playerName';
import {
  clientAddress,
  hashPassword,
  hashToken,
  newSessionToken,
  SESSION_MS,
  sessionCookie,
  verifyPassword,
} from '../../auth';
import { asPlayer, type Tx } from '../../db';
import { bestRuns, playerStanding } from '../../standing';
import { publicProcedure, router, type Context } from '../../trpc';

/** Wrong passwords allowed per name and address in 15 minutes. */
const MAX_FAILURES = 5;
const UNIQUE_VIOLATION = '23505';

const credentials = z.object({
  name: z
    .string()
    .transform(normalizeName)
    .superRefine((name, check) => {
      const problem = nameProblem(name);
      if (problem) check.addIssue({ code: 'custom', message: problem });
    }),
  password: z.string().superRefine((password, check) => {
    const problem = passwordProblem(password);
    if (problem) check.addIssue({ code: 'custom', message: problem });
  }),
});

const startSession = async (tx: Tx, ctx: Context, playerId: string) => {
  const token = newSessionToken();
  const expires = new Date(Date.now() + SESSION_MS).toISOString();
  await tx.execute(
    sql`select api.create_session(${playerId}, ${hashToken(token)}, ${expires}::timestamptz)`,
  );
  ctx.resHeaders.append('set-cookie', sessionCookie(token));
};

const isUniqueViolation = (error: unknown) =>
  (error as { cause?: { code?: string } }).cause?.code === UNIQUE_VIOLATION;

export const accountRouter = router({
  /** Who's signed in, with their place and best runs; null when no one. */
  me: publicProcedure.query(async ({ ctx }) => {
    const playerId = await ctx.playerId();
    if (!playerId) return null;
    return asPlayer(playerId, async tx => {
      const result = await tx.execute<{ name: string }>(
        sql`select name from public.players where id = ${playerId}`,
      );
      const name = result.rows[0]?.name;
      if (!name) return null;
      const standing = await playerStanding(tx, name);
      return standing && { ...standing, bestRuns: await bestRuns(tx) };
    });
  }),

  /**
   * Signs in, or claims the name when no one has it yet: one form for
   * both, so saving a first run takes no extra step.
   */
  enter: publicProcedure.input(credentials).mutation(async ({ ctx, input }) => {
    const key = `${input.name}|${clientAddress(ctx.headers)}`;
    const entered = await asPlayer(null, async tx => {
      const failures = await tx.execute<{ count: number }>(
        sql`select api.login_failures(${key}) as count`,
      );
      if ((failures.rows[0]?.count ?? 0) >= MAX_FAILURES)
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many tries. Wait 15 minutes and try again.',
        });

      const found = await tx.execute<{
        player_id: string;
        password_hash: string;
      }>(sql`select * from api.password_hash(${input.name})`);
      const existing = found.rows[0];
      if (existing) {
        if (!(await verifyPassword(existing.password_hash, input.password)))
          return null;
        await startSession(tx, ctx, existing.player_id);
        return { name: input.name, created: false };
      }

      const passwordHash = await hashPassword(input.password);
      const created = await tx
        .execute<{ id: string }>(
          sql`select api.sign_up(${input.name}, ${passwordHash}) as id`,
        )
        .catch((error: unknown) => {
          // Someone claimed it between the lookup and now.
          if (isUniqueViolation(error))
            throw new TRPCError({
              code: 'CONFLICT',
              message: `${input.name} was just taken`,
            });
          throw error;
        });
      await startSession(tx, ctx, created.rows[0].id);
      return { name: input.name, created: true };
    });
    if (entered) return entered;
    // Outside the sign-in's transaction, which a throw would roll back.
    await asPlayer(null, tx =>
      tx.execute(sql`select api.note_login_failure(${key})`),
    );
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: `That's not the password for ${input.name}`,
    });
  }),

  signOut: publicProcedure.mutation(async ({ ctx }) => {
    const { token } = ctx;
    if (token)
      await asPlayer(null, tx =>
        tx.execute(sql`select api.end_session(${hashToken(token)})`),
      );
    ctx.resHeaders.append('set-cookie', sessionCookie(null));
    return null;
  }),
});

import { initTRPC, TRPCError } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { sql } from 'drizzle-orm';
import { hashToken, readCookie, SESSION_COOKIE } from '../auth';
import { asPlayer } from '../db';

export const createContext = async ({
  req,
  resHeaders,
}: FetchCreateContextFnOptions) => {
  const token = readCookie(req.headers.get('cookie'), SESSION_COOKIE);
  const playerId = token
    ? await asPlayer(null, async tx => {
        const result = await tx.execute<{ id: string | null }>(
          sql`select api.session_player(${hashToken(token)}) as id`,
        );
        return result.rows[0]?.id ?? null;
      })
    : null;
  return { headers: req.headers, resHeaders, token, playerId };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/** Signed in: `playerId` is the player row level security answers to. */
export const playerProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.playerId)
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sign in first' });
  return next({ ctx: { ...ctx, playerId: ctx.playerId } });
});

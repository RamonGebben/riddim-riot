import { initTRPC, TRPCError } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { sql } from 'drizzle-orm';
import { hashToken, readCookie, SESSION_COOKIE } from '../auth';
import { asPlayer } from '../db';

/** The player a session token belongs to, if it's still live. */
const sessionPlayer = (token: string) =>
  asPlayer(null, async tx => {
    const result = await tx.execute<{ id: string | null }>(
      sql`select api.session_player(${hashToken(token)}) as id`,
    );
    return result.rows[0]?.id ?? null;
  });

export const createContext = ({
  req,
  resHeaders,
}: FetchCreateContextFnOptions) => {
  const token = readCookie(req.headers.get('cookie'), SESSION_COOKIE);
  // Looked up on first ask, so requests that don't need it skip the
  // round trip.
  let player: Promise<string | null> | null = null;
  const playerId = () => {
    player ??= token ? sessionPlayer(token) : Promise.resolve(null);
    return player;
  };
  return { headers: req.headers, resHeaders, token, playerId };
};

export type Context = ReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/** Signed in: `playerId` is the player row level security answers to. */
export const playerProcedure = t.procedure.use(async ({ ctx, next }) => {
  const playerId = await ctx.playerId();
  if (!playerId)
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sign in first' });
  return next({ ctx: { ...ctx, playerId } });
});

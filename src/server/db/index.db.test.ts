import { randomUUID } from 'node:crypto';
import { Pool } from '@neondatabase/serverless';
import { eq, inArray, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asPlayer, loadouts, players, runs } from '.';

// Runs against the real database (`pnpm test:db`): the policies are only
// as good as what Postgres actually enforces.

const tag = randomUUID().slice(0, 6).toUpperCase().replaceAll('-', '');
const names = { a: `T_${tag}A`, b: `T_${tag}B` };
const ids = { a: '', b: '' };

const signUp = (name: string) =>
  asPlayer(null, async tx => {
    const result = await tx.execute<{ id: string }>(
      sql`select api.sign_up(${name}, 'not-a-real-hash') as id`,
    );
    return result.rows[0].id;
  });

const run = (playerId: string, score = 300) => ({
  id: randomUUID(),
  playerId,
  score,
  level: 1,
  kills: 3,
  seed: 42,
  durationMs: 60_000,
  outcome: 'died' as const,
});

/** The Postgres error under drizzle's wrapper. */
const failure = async (work: Promise<unknown>) => {
  try {
    await work;
  } catch (error) {
    const cause = (error as { cause?: { message?: string } }).cause;
    return cause?.message ?? String(error);
  }
  return null;
};

beforeAll(async () => {
  ids.a = await signUp(names.a);
  ids.b = await signUp(names.b);
});

afterAll(async () => {
  const owner = new Pool({ connectionString: process.env.DATABASE_URL });
  await owner.query('delete from public.players where id = any($1)', [
    [ids.a, ids.b],
  ]);
  await owner.end();
});

describe('row level security', () => {
  it('lets a player add their own run, and the best run follows', async () => {
    await asPlayer(ids.a, tx => tx.insert(runs).values(run(ids.a, 500)));
    const [a] = await asPlayer(null, tx =>
      tx.select().from(players).where(eq(players.id, ids.a)),
    );
    expect(a).toMatchObject({ runsCount: 1, bestScore: 500 });
  });

  it("keeps the best run: a lower one doesn't add to it or lower it", async () => {
    const best = async () => {
      const [a] = await asPlayer(null, tx =>
        tx.select().from(players).where(eq(players.id, ids.a)),
      );
      return a;
    };
    await asPlayer(ids.a, tx => tx.insert(runs).values(run(ids.a, 500)));
    const before = await best();
    await asPlayer(ids.a, tx => tx.insert(runs).values(run(ids.a, 200)));
    const after = await best();
    expect(after.bestScore).toBe(before.bestScore);
    expect(after.scoredAt).toEqual(before.scoredAt);
    expect(after.runsCount).toBe(before.runsCount + 1);
  });

  it("refuses a run in someone else's name", async () => {
    const error = await failure(
      asPlayer(ids.a, tx => tx.insert(runs).values(run(ids.b))),
    );
    expect(error).toMatch(/row-level security/);
  });

  it('refuses a run from no one', async () => {
    const error = await failure(
      asPlayer(null, tx => tx.insert(runs).values(run(ids.a))),
    );
    expect(error).toMatch(/row-level security/);
  });

  it("hides other players' runs", async () => {
    const seen = await asPlayer(ids.b, tx => tx.select().from(runs));
    expect(seen.filter(row => row.playerId === ids.a)).toEqual([]);
  });

  it('shows everyone on the board', async () => {
    const board = await asPlayer(null, tx =>
      tx
        .select({ name: players.name })
        .from(players)
        .where(inArray(players.id, [ids.a, ids.b])),
    );
    expect(board.map(row => row.name).toSorted()).toEqual(
      [names.a, names.b].toSorted(),
    );
  });

  it("can't write a best score directly", async () => {
    const error = await failure(
      asPlayer(ids.a, tx =>
        tx
          .update(players)
          .set({ bestScore: 9_999_999 })
          .where(eq(players.id, ids.a)),
      ),
    );
    expect(error).toMatch(/permission denied/);
  });

  it("keeps a player's loadout theirs alone", async () => {
    const recipes = [{ seed: 1 }, { seed: 2 }, { seed: 3 }];
    await asPlayer(ids.a, tx =>
      tx.insert(loadouts).values({ playerId: ids.a, recipes }),
    );
    const own = await asPlayer(ids.a, tx => tx.select().from(loadouts));
    expect(own.map(row => row.recipes)).toEqual([recipes]);
    const seen = await asPlayer(ids.b, tx => tx.select().from(loadouts));
    expect(seen.filter(row => row.playerId === ids.a)).toEqual([]);
    const forged = await failure(
      asPlayer(ids.b, tx =>
        tx.insert(loadouts).values({ playerId: ids.a, recipes }),
      ),
    );
    expect(forged).toMatch(/row-level security|duplicate key/);
    const overwritten = await asPlayer(ids.b, tx =>
      tx
        .update(loadouts)
        .set({ recipes: [{ seed: 9 }, { seed: 9 }, { seed: 9 }] })
        .where(eq(loadouts.playerId, ids.a))
        .returning(),
    );
    expect(overwritten).toEqual([]);
  });

  it('keeps a loadout to three slots', async () => {
    const error = await failure(
      asPlayer(ids.b, tx =>
        tx.insert(loadouts).values({ playerId: ids.b, recipes: [{ seed: 1 }] }),
      ),
    );
    expect(error).toMatch(/check constraint/);
  });

  it('keeps password hashes and sessions out of reach', async () => {
    const credentials = await failure(
      asPlayer(ids.a, tx => tx.execute(sql`select * from private.credentials`)),
    );
    const sessions = await failure(
      asPlayer(ids.a, tx => tx.execute(sql`select * from private.sessions`)),
    );
    expect(credentials).toMatch(/permission denied/);
    expect(sessions).toMatch(/permission denied/);
  });
});

import { randomUUID } from 'node:crypto';
import { Pool } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { playerStanding, rowsAround, topRows } from '.';
import { asPlayer, runs } from '../db';

// The ranks counted from a player's place against the real database
// (`pnpm test:db`), checked against numbering the whole board.

const tag = randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
/** Two tied on points (the first to score goes first), one behind, one at 0. */
const scores = { A: 500, B: 500, C: 300, D: 0 };
const names = Object.keys(scores).map(key => `T_${tag}${key}`);
const ids: Array<string> = [];

/** The board numbered by a window over everyone, as it was first done. */
const numbered = () =>
  asPlayer(null, async tx => {
    const result = await tx.execute<{ name: string; rank: number }>(sql`
      select name, row_number() over (
        order by best_score desc, scored_at asc, created_at asc
      )::integer as rank
      from public.players where best_score > 0
      order by rank
    `);
    return new Map(result.rows.map(row => [row.name, row.rank]));
  });

/**
 * `check` against the board numbered before and after it; other test
 * files save runs meanwhile, so it retries until the board held still.
 */
const againstBoard = async (
  check: (ranks: Map<string, number>) => Promise<void>,
) => {
  for (let tries = 0; ; tries++) {
    const before = await numbered();
    try {
      await check(before);
      return;
    } catch (error) {
      const after = await numbered();
      const still = [...before].every(
        ([name, rank]) => after.get(name) === rank,
      );
      if (still || tries === 4) throw error;
    }
  }
};

beforeAll(async () => {
  for (const [index, score] of Object.values(scores).entries()) {
    const id = await asPlayer(null, async tx => {
      const result = await tx.execute<{ id: string }>(
        sql`select api.sign_up(${names[index]}, 'not-a-real-hash') as id`,
      );
      return result.rows[0].id;
    });
    ids.push(id);
    if (score > 0)
      await asPlayer(id, tx =>
        tx.insert(runs).values({
          id: randomUUID(),
          playerId: id,
          score,
          level: 1,
          kills: score / 100,
          seed: 1,
          durationMs: 60_000,
          outcome: 'died',
        }),
      );
  }
});

afterAll(async () => {
  const owner = new Pool({ connectionString: process.env.DATABASE_URL });
  await owner.query('delete from public.players where id = any($1)', [ids]);
  await owner.end();
});

describe('standing', () => {
  it('ranks each player where the board numbers them', () =>
    againstBoard(async ranks => {
      const standings = await asPlayer(null, tx =>
        Promise.all(names.map(name => playerStanding(tx, name))),
      );
      expect(standings.map(standing => standing?.rank ?? null)).toEqual(
        names.map(name => ranks.get(name) ?? null),
      );
    }));

  it('puts the first to score ahead on a tie', async () => {
    const [a, b] = await asPlayer(null, tx =>
      Promise.all(names.slice(0, 2).map(name => playerStanding(tx, name))),
    );
    expect(a?.rank).toBeLessThan(b?.rank ?? 0);
  });

  it('numbers the top of the board', () =>
    againstBoard(async ranks => {
      const rows = await asPlayer(null, tx => topRows(tx, 50));
      expect(rows.map(row => [row.name, row.rank])).toEqual(
        [...ranks].filter(([, rank]) => rank <= 50),
      );
    }));

  it('shows the top three and the rows either side', () =>
    againstBoard(async ranks => {
      for (const name of names.slice(0, 3)) {
        const mine = ranks.get(name) ?? 0;
        const rows = await asPlayer(null, tx => rowsAround(tx, name));
        expect(rows.map(row => [row.name, row.rank])).toEqual(
          [...ranks].filter(
            ([, rank]) => rank <= 3 || Math.abs(rank - mine) <= 1,
          ),
        );
      }
    }));

  it('shows only the top three around a player with no points', async () => {
    const rows = await asPlayer(null, tx => rowsAround(tx, names[3]));
    expect(rows.map(row => row.rank)).toEqual([1, 2, 3].slice(0, rows.length));
  });
});

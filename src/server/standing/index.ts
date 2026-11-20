import { desc, eq, sql } from 'drizzle-orm';
import { players, runs, type Tx } from '../db';

/** A row on the board. */
export interface BoardRow {
  rank: number;
  name: string;
  totalPoints: number;
  runsCount: number;
}

/** Board order over `alias`: most points first, ties to who got there first. */
const boardOrder = (alias: string) =>
  sql.raw(
    `${alias}.total_points desc, ${alias}.scored_at asc, ${alias}.created_at asc`,
  );

/**
 * `a` comes before `b` in board order. Ranking a player by counting who
 * comes before them reads `players_board_idx`, where numbering everyone
 * with a window sorts the whole table.
 */
const precedes = (a: string, b: string) =>
  sql.raw(`(${a}.total_points > ${b}.total_points
    or (${a}.total_points = ${b}.total_points
      and (${a}.scored_at, ${a}.created_at) < (${b}.scored_at, ${b}.created_at)))`);

interface RankedRow extends Record<string, unknown> {
  rank: number;
  name: string;
  total_points: string;
  runs_count: number;
}

const toRow = (row: RankedRow): BoardRow => ({
  rank: row.rank,
  name: row.name,
  totalPoints: Number(row.total_points),
  runsCount: row.runs_count,
});

/** The first `limit` players with points, numbered. */
const top = (limit: number) => sql`
  select t.*, row_number() over (order by ${boardOrder('t')})::integer as rank
  from (
    select * from public.players p where p.total_points > 0
    order by ${boardOrder('p')} limit ${limit}
  ) t
`;

export const topRows = async (tx: Tx, limit: number) => {
  const result = await tx.execute<RankedRow>(
    sql`select * from (${top(limit)}) ranked order by rank`,
  );
  return result.rows.map(toRow);
};

export const rankedCount = async (tx: Tx) => {
  const result = await tx.execute<{ count: number }>(
    sql`select count(*)::integer as count from public.players where total_points > 0`,
  );
  return result.rows[0]?.count ?? 0;
};

/** The top three and the rows either side of `name`, for a short board. */
export const rowsAround = async (tx: Tx, name: string) => {
  const result = await tx.execute<RankedRow>(sql`
    with me as (
      select * from public.players where name = ${name} and total_points > 0
    ),
    my_rank as (
      select count(*)::integer + 1 as rank from public.players p, me
      where p.total_points > 0 and ${precedes('p', 'me')}
    ),
    above as (
      select p.*, (select rank from my_rank) - 1 as rank
      from public.players p, me
      where p.total_points > 0 and ${precedes('p', 'me')}
      order by p.total_points asc, p.scored_at desc, p.created_at desc limit 1
    ),
    below as (
      select p.*, (select rank from my_rank) + 1 as rank
      from public.players p, me
      where p.total_points > 0 and ${precedes('me', 'p')}
      order by ${boardOrder('p')} limit 1
    ),
    mine as (select me.*, (select rank from my_rank) as rank from me)
    select distinct on (rank) * from (
      select * from (${top(3)}) t
      union all select * from above
      union all select * from mine
      union all select * from below
    ) rows
    order by rank
  `);
  return result.rows.map(toRow);
};

/** A player's place: their totals and rank (null with no points yet). */
export const playerStanding = async (tx: Tx, name: string) => {
  const [player] = await tx
    .select()
    .from(players)
    .where(eq(players.name, name));
  if (!player) return null;
  const ranked = player.totalPoints > 0;
  const result = ranked
    ? await tx.execute<{ rank: number }>(sql`
        select count(*)::integer + 1 as rank
        from public.players p, public.players me
        where me.name = ${name} and p.total_points > 0
          and ${precedes('p', 'me')}
      `)
    : null;
  return {
    name: player.name,
    totalPoints: player.totalPoints,
    runsCount: player.runsCount,
    bestScore: player.bestScore,
    rank: result?.rows[0]?.rank ?? null,
  };
};

/** The signed-in player's best runs (row level security keeps them theirs). */
export const bestRuns = (tx: Tx, limit = 5) =>
  tx
    .select({
      score: runs.score,
      level: runs.level,
      outcome: runs.outcome,
      createdAt: runs.createdAt,
    })
    .from(runs)
    .orderBy(desc(runs.score), desc(runs.createdAt))
    .limit(limit);

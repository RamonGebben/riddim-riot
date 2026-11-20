import { desc, eq, sql } from 'drizzle-orm';
import { players, runs, type Tx } from '../db';

/** A row on the board. */
export interface BoardRow {
  rank: number;
  name: string;
  totalPoints: number;
  runsCount: number;
}

/** Players with points, in board order: ties go to who got there first. */
const RANKED = sql`
  select name, total_points, runs_count,
    row_number() over (
      order by total_points desc, scored_at asc, created_at asc
    )::integer as rank
  from public.players
  where total_points > 0
`;

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

export const topRows = async (tx: Tx, limit: number) => {
  const result = await tx.execute<RankedRow>(
    sql`select * from (${RANKED}) ranked order by rank limit ${limit}`,
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
    with ranked as (${RANKED}),
      me as (select rank from ranked where name = ${name})
    select ranked.* from ranked
    where rank <= 3
      or rank between (select rank from me) - 1 and (select rank from me) + 1
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
  const result = await tx.execute<{ rank: number }>(
    sql`select rank from (${RANKED}) ranked where name = ${name}`,
  );
  return {
    name: player.name,
    totalPoints: player.totalPoints,
    runsCount: player.runsCount,
    bestScore: player.bestScore,
    rank: result.rows[0]?.rank ?? null,
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

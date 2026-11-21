import { Pool } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

export { loadouts, players, runs } from './schema';

const createDb = () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return drizzle({ client: new Pool({ connectionString: url }), schema });
};

// Built on first use, not at import: `next build` runs without the env.
let db: ReturnType<typeof createDb> | null = null;
const getDb = () => {
  db ??= createDb();
  return db;
};

type Db = ReturnType<typeof createDb>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * Runs `work` in a transaction as the limited `bass_app` role, with
 * `playerId` (or no one) as the player row level security answers to.
 * The only way into the database: nothing queries as the owner.
 */
export const asPlayer = <T>(
  playerId: string | null,
  work: (tx: Tx) => Promise<T>,
): Promise<T> =>
  getDb().transaction(async tx => {
    await tx.execute(sql`set local role bass_app`);
    await tx.execute(
      sql`select set_config('app.player_id', ${playerId ?? ''}, true)`,
    );
    return work(tx);
  });

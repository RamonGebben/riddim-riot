// Applies db/migrations/*.sql in name order, each once, as the database
// owner. Run with `pnpm db:migrate` (reads .env.local).
import { readdir, readFile } from 'node:fs/promises';
import { Pool } from '@neondatabase/serverless';

const DIR = new URL('../db/migrations/', import.meta.url);

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const pool = new Pool({ connectionString: url });
const client = await pool.connect();
try {
  await client.query(`create schema if not exists private`);
  await client.query(
    `create table if not exists private.migrations (
       name text primary key,
       applied_at timestamptz not null default now()
     )`,
  );
  const { rows } = await client.query<{ name: string }>(
    `select name from private.migrations`,
  );
  const applied = new Set(rows.map(row => row.name));
  const files = (await readdir(DIR)).filter(file => file.endsWith('.sql'));
  const pending = files.toSorted().filter(file => !applied.has(file));
  for (const file of pending) {
    const text = await readFile(new URL(file, DIR), 'utf8');
    await client.query('begin');
    try {
      await client.query(text);
      await client.query(`insert into private.migrations (name) values ($1)`, [
        file,
      ]);
      await client.query('commit');
      console.log(`applied ${file}`);
    } catch (error) {
      await client.query('rollback');
      throw error;
    }
  }
  if (pending.length === 0) console.log('up to date');
} finally {
  client.release();
  await pool.end();
}

import {
  bigint,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { RUN_OUTCOMES } from '~/game/sim';
import type { WeaponRecipe } from '~/game/weapons';

// Mirrors db/migrations, which own the tables, policies and functions.

export const players = pgTable('players', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  totalPoints: bigint('total_points', { mode: 'number' }).notNull(),
  runsCount: integer('runs_count').notNull(),
  bestScore: integer('best_score').notNull(),
  scoredAt: timestamp('scored_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const runs = pgTable('runs', {
  id: uuid('id').primaryKey(),
  playerId: uuid('player_id').notNull(),
  score: integer('score').notNull(),
  level: smallint('level').notNull(),
  kills: integer('kills').notNull(),
  seed: bigint('seed', { mode: 'number' }).notNull(),
  durationMs: integer('duration_ms').notNull(),
  outcome: text('outcome', { enum: RUN_OUTCOMES }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const loadouts = pgTable('loadouts', {
  playerId: uuid('player_id').primaryKey(),
  recipes: jsonb('recipes').$type<Array<WeaponRecipe>>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

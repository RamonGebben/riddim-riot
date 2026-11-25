-- A run the player quit still goes on the board, with what it scored up
-- to the quit. Its constraint was named by Postgres in 0001.

alter table public.runs drop constraint runs_outcome_check;
alter table public.runs
  add constraint runs_outcome_check check (outcome in ('died', 'quit', 'won'));

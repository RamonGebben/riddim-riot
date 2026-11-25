-- The board ranks each player by their best single run, not by points
-- added up over every run. A run that doesn't beat the best changes only
-- the run count. Ties go to whoever set that score first.
--
-- total_points is still kept up for the app deployed before this, which
-- ranks by it; a later migration drops it once nothing reads it.

create or replace function private.add_run_to_totals() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.players
  set total_points = total_points + new.score,
      runs_count = runs_count + 1,
      scored_at = case when new.score > best_score then now() else scored_at end,
      best_score = greatest(best_score, new.score)
  where id = new.player_id;
  return null;
end
$$;

-- scored_at meant "when the total last grew": make it when the best run
-- was first reached.
update public.players p
set scored_at = (
  select min(r.created_at) from public.runs r
  where r.player_id = p.id and r.score = p.best_score
)
where p.best_score > 0;
update public.players set scored_at = null where best_score = 0;

create index players_best_idx
  on public.players (best_score desc, scored_at asc nulls last);

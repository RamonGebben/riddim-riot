-- The board ranks by best_score (0005), and nothing reads the summed
-- total_points any more: stop keeping it up, and drop it with its index.

create or replace function private.add_run_to_totals() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.players
  set runs_count = runs_count + 1,
      scored_at = case when new.score > best_score then now() else scored_at end,
      best_score = greatest(best_score, new.score)
  where id = new.player_id;
  return null;
end
$$;

drop index public.players_board_idx;
alter table public.players drop column total_points;

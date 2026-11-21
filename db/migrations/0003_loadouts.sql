-- Kept loadouts: the three weapons a signed-in player starts every run
-- with, as weapon recipes (a seed and optional pins). One row a player,
-- read and written only by its owner. The app checks each recipe's shape
-- (src/server/routers/loadout); the table only bounds its size.

create table public.loadouts (
  player_id uuid primary key references public.players (id) on delete cascade,
  recipes jsonb not null check (
    jsonb_typeof(recipes) = 'array'
    and jsonb_array_length(recipes) = 3
    and pg_column_size(recipes) < 1024
  ),
  updated_at timestamptz not null default now()
);

alter table public.loadouts enable row level security;

create policy loadouts_read_own on public.loadouts
  for select to bass_app
  using (player_id = (select api.current_player()));
create policy loadouts_insert_own on public.loadouts
  for insert to bass_app
  with check (player_id = (select api.current_player()));
create policy loadouts_update_own on public.loadouts
  for update to bass_app
  using (player_id = (select api.current_player()))
  with check (player_id = (select api.current_player()));

grant select, insert, update on public.loadouts to bass_app;

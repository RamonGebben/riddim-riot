-- The leaderboard: players and their runs, readable through row level
-- security by one limited role. The app never queries as the owner: every
-- request runs in a transaction that switches to `bass_app` and names the
-- signed-in player in `app.player_id` (see src/server/db).

create schema if not exists private;
create schema if not exists api;
revoke all on schema private from public;
revoke all on schema api from public;

-- Reached only by `set local role`, never by logging in.
do $$
begin
  if not exists (select from pg_roles where rolname = 'bass_app') then
    create role bass_app nologin;
  end if;
end
$$;
grant bass_app to current_user;

create table public.players (
  id uuid primary key default gen_random_uuid(),
  -- Shown in capitals on the board, so stored that way: one spelling each.
  name text not null unique check (name ~ '^[A-Z0-9_]{3,12}$'),
  total_points bigint not null default 0 check (total_points >= 0),
  runs_count integer not null default 0 check (runs_count >= 0),
  best_score integer not null default 0 check (best_score >= 0),
  -- When the total last grew: ties go to whoever reached it first.
  scored_at timestamptz,
  created_at timestamptz not null default now()
);
create index players_board_idx
  on public.players (total_points desc, scored_at asc nulls last);

create table public.runs (
  -- The id from the run's ticket, so a run is saved once however often
  -- the client retries.
  id uuid primary key,
  player_id uuid not null references public.players (id) on delete cascade,
  score integer not null check (score >= 0 and score % 100 = 0),
  level smallint not null check (level between 1 and 5),
  kills integer not null check (kills >= 0),
  seed bigint not null check (seed >= 0),
  duration_ms integer not null check (duration_ms > 0),
  outcome text not null check (outcome in ('died', 'won')),
  created_at timestamptz not null default now()
);
create index runs_player_best_idx on public.runs (player_id, score desc);
create index runs_player_recent_idx on public.runs (player_id, created_at desc);

create table private.credentials (
  player_id uuid primary key references public.players (id) on delete cascade,
  password_hash text not null
);

create table private.sessions (
  -- A SHA-256 of the cookie's token: a leaked table signs no one in.
  token_hash text primary key,
  player_id uuid not null references public.players (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index sessions_player_idx on private.sessions (player_id);

create table private.login_failures (
  key text not null,
  at timestamptz not null default now()
);
create index login_failures_key_at_idx on private.login_failures (key, at);

-- The signed-in player for this transaction, or null.
create function api.current_player() returns uuid
language sql stable
set search_path = ''
as $$ select nullif(current_setting('app.player_id', true), '')::uuid $$;

-- Row level security. The owner (migrations and the functions below)
-- bypasses it; bass_app sees only what the policies allow.
alter table public.players enable row level security;
alter table public.runs enable row level security;
alter table private.credentials enable row level security;
alter table private.sessions enable row level security;
alter table private.login_failures enable row level security;

-- The board is public: every player's name and totals.
create policy players_read on public.players
  for select to bass_app using (true);

-- Runs are yours alone, to read and to add.
create policy runs_read_own on public.runs
  for select to bass_app
  using (player_id = (select api.current_player()));
create policy runs_insert_own on public.runs
  for insert to bass_app
  with check (player_id = (select api.current_player()));

-- private.* has no policies for bass_app, and no grants: deny twice.

grant usage on schema public, api to bass_app;
grant select on public.players to bass_app;
grant select, insert on public.runs to bass_app;
grant execute on function api.current_player() to bass_app;

-- Totals follow runs, so no one can write a total of their own.
create function private.add_run_to_totals() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.players
  set total_points = total_points + new.score,
      runs_count = runs_count + 1,
      best_score = greatest(best_score, new.score),
      scored_at = case when new.score > 0 then now() else scored_at end
  where id = new.player_id;
  return null;
end
$$;
create trigger runs_add_to_totals
  after insert on public.runs
  for each row execute function private.add_run_to_totals();

-- Accounts. These run as the owner, so each does one narrow thing.
create function api.sign_up(p_name text, p_password_hash text) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  insert into public.players (name) values (p_name) returning id into new_id;
  insert into private.credentials (player_id, password_hash)
  values (new_id, p_password_hash);
  return new_id;
end
$$;

create function api.password_hash(p_name text)
returns table (player_id uuid, password_hash text)
language sql stable security definer
set search_path = ''
as $$
  select c.player_id, c.password_hash
  from public.players p
  join private.credentials c on c.player_id = p.id
  where p.name = p_name
$$;

-- Failed sign-ins in the last 15 minutes, counted per name and address.
create function api.login_failures(p_key text) returns integer
language sql stable security definer
set search_path = ''
as $$
  select count(*)::integer from private.login_failures
  where key = p_key and at > now() - interval '15 minutes'
$$;

create function api.note_login_failure(p_key text) returns void
language sql security definer
set search_path = ''
as $$
  delete from private.login_failures where at < now() - interval '1 day';
  insert into private.login_failures (key) values (p_key);
$$;

create function api.create_session(
  p_player_id uuid,
  p_token_hash text,
  p_expires_at timestamptz
) returns void
language sql security definer
set search_path = ''
as $$
  delete from private.sessions where expires_at < now();
  insert into private.sessions (token_hash, player_id, expires_at)
  values (p_token_hash, p_player_id, p_expires_at);
$$;

create function api.session_player(p_token_hash text) returns uuid
language sql stable security definer
set search_path = ''
as $$
  select player_id from private.sessions
  where token_hash = p_token_hash and expires_at > now()
$$;

create function api.end_session(p_token_hash text) returns void
language sql security definer
set search_path = ''
as $$ delete from private.sessions where token_hash = p_token_hash $$;

revoke all on all functions in schema api from public;
revoke all on all functions in schema private from public;
grant execute on function
  api.current_player(),
  api.sign_up(text, text),
  api.password_hash(text),
  api.login_failures(text),
  api.note_login_failure(text),
  api.create_session(uuid, text, timestamptz),
  api.session_player(text),
  api.end_session(text)
to bass_app;

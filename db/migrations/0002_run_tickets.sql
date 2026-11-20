-- Run tickets: a run id and the server's start time, signed so a client
-- can't move its start earlier. The key is made here and never leaves the
-- database, so there's no secret to manage anywhere else.

create extension if not exists pgcrypto;

create table private.ticket_key (
  only_row boolean primary key default true check (only_row),
  key bytea not null default gen_random_bytes(32)
);
insert into private.ticket_key default values;
alter table private.ticket_key enable row level security;

create function private.ticket_signature(p_payload text) returns text
language sql stable security definer
set search_path = ''
as $$
  select encode(
    public.hmac(convert_to(p_payload, 'utf8'), k.key, 'sha256'),
    'hex'
  )
  from private.ticket_key k
$$;

-- `<run id>.<start, epoch ms>.<signature>`
create function api.issue_run_ticket() returns text
language sql volatile security definer
set search_path = ''
as $$
  select t.payload || '.' || private.ticket_signature(t.payload)
  from (
    select gen_random_uuid()::text || '.' ||
      floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text
      as payload
  ) t
$$;

-- The ticket's run and start, or no row when we didn't sign it.
create function api.read_run_ticket(p_ticket text)
returns table (run_id uuid, started_at timestamptz)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  parts text[] := string_to_array(p_ticket, '.');
begin
  if array_length(parts, 1) <> 3
    or parts[1] !~ '^[0-9a-f-]{36}$'
    or parts[2] !~ '^[0-9]{1,15}$'
    or private.ticket_signature(parts[1] || '.' || parts[2]) <> parts[3]
  then
    return;
  end if;
  return query select parts[1]::uuid, to_timestamp(parts[2]::bigint / 1000.0);
end
$$;

revoke all on function private.ticket_signature(text) from public;
revoke all on function api.issue_run_ticket() from public;
revoke all on function api.read_run_ticket(text) from public;
grant execute on function api.issue_run_ticket(), api.read_run_ticket(text)
  to bass_app;

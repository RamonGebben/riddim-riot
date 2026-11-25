-- Recovery codes: the way back into an account whose password is lost.
-- Accounts hold no email or other contact, so a player keeps a code
-- instead. Only its SHA-256 is stored, like a session token's: a code is
-- 80 random bits, so it needs no slow hash. A code works once.

alter table private.credentials add column recovery_hash text;

-- Whether the signed-in player has a code to fall back on.
create function api.has_recovery() returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(
    (select recovery_hash is not null from private.credentials
     where player_id = api.current_player()),
    false
  )
$$;

-- A new code for the signed-in player; the old one stops working.
create function api.set_recovery(p_code_hash text) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if api.current_player() is null then
    raise exception 'no player signed in';
  end if;
  update private.credentials set recovery_hash = p_code_hash
  where player_id = api.current_player();
end
$$;

-- A lost password replaced, given the name and its code: the code is
-- spent and every session signed out, so whoever had the account is out.
-- Returns the player, or null when the name and code don't match.
create function api.recover(
  p_name text,
  p_code_hash text,
  p_password_hash text
) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  found uuid;
begin
  update private.credentials c
  set password_hash = p_password_hash, recovery_hash = null
  from public.players p
  where p.id = c.player_id and p.name = p_name
    and c.recovery_hash is not null and c.recovery_hash = p_code_hash
  returning c.player_id into found;
  if found is not null then
    delete from private.sessions where player_id = found;
  end if;
  return found;
end
$$;

revoke all on function api.has_recovery() from public;
revoke all on function api.set_recovery(text) from public;
revoke all on function api.recover(text, text, text) from public;
grant execute on function
  api.has_recovery(),
  api.set_recovery(text),
  api.recover(text, text, text)
to bass_app;

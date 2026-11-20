-- Apple Health sync.
--
-- An iOS Shortcut posts steps, active energy and workouts to the app's /api/health-sync endpoint
-- with a personal key. The key is looked up here, in the database, so the app does not need a
-- Supabase admin key: only a hash of each key is stored, and the functions below are the only
-- way in.

-- Workouts that come from Health carry an id, so syncing twice never logs one twice.
alter table public.exercise_logs add column external_id text;
create unique index exercise_logs_external_idx
  on public.exercise_logs (user_id, external_id)
  where external_id is not null;

-- ---------------------------------------------------------------------------
-- Keys: made and revoked by the signed-in person.
-- ---------------------------------------------------------------------------

-- Makes a new key and returns it. This is the only time it can be seen; the database keeps a hash.
-- Making a new key stops the old one working.
create function public.create_health_sync_token()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
begin
  if (select auth.uid()) is null or not public.is_allowed() then
    raise exception 'not allowed';
  end if;

  update public.health_sync_tokens
     set revoked_at = now()
   where user_id = (select auth.uid()) and revoked_at is null;

  v_token := 'snp_' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.health_sync_tokens (user_id, token_hash, label)
  values ((select auth.uid()), encode(sha256(convert_to(v_token, 'utf8')), 'hex'), 'Apple Health');

  return v_token;
end;
$$;

create function public.revoke_health_sync_tokens()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.is_allowed() then
    raise exception 'not allowed';
  end if;

  update public.health_sync_tokens
     set revoked_at = now()
   where user_id = (select auth.uid()) and revoked_at is null;
end;
$$;

revoke all on function public.create_health_sync_token() from public, anon;
revoke all on function public.revoke_health_sync_tokens() from public, anon;
grant execute on function public.create_health_sync_token() to authenticated;
grant execute on function public.revoke_health_sync_tokens() to authenticated;

-- ---------------------------------------------------------------------------
-- Ingest: called by the app's endpoint with a key (no login on the Shortcut side).
-- ---------------------------------------------------------------------------

create function public.ingest_health_sync(
  p_token       text,
  p_date        date,
  p_steps       integer,
  p_active_kcal integer,
  p_workouts    jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token_id uuid;
  v_uid      uuid;
  v_workout  jsonb;
  v_started  timestamptz;
  v_minutes  integer;
  v_saved    integer := 0;
begin
  if p_token is null or length(p_token) < 20 then
    return jsonb_build_object('ok', false, 'error', 'invalid_token');
  end if;

  select t.id, t.user_id
    into v_token_id, v_uid
    from public.health_sync_tokens t
   where t.token_hash = encode(sha256(convert_to(p_token, 'utf8')), 'hex')
     and t.revoked_at is null;

  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_token');
  end if;

  -- Removing someone from the allowlist stops their Shortcut too.
  if not exists (
    select 1
      from auth.users u
      join public.allowed_emails a on a.email = lower(coalesce(u.email, ''))
     where u.id = v_uid
  ) then
    return jsonb_build_object('ok', false, 'error', 'not_allowed');
  end if;

  if p_date is null or p_date > public.myt_date() or p_date < public.myt_date() - 7 then
    return jsonb_build_object('ok', false, 'error', 'invalid_date');
  end if;
  if (p_steps is not null and (p_steps < 0 or p_steps > 200000))
     or (p_active_kcal is not null and (p_active_kcal < 0 or p_active_kcal > 20000)) then
    return jsonb_build_object('ok', false, 'error', 'invalid_value');
  end if;

  update public.health_sync_tokens set last_used_at = now() where id = v_token_id;

  -- The day's totals replace what was there; a field left out keeps its old value.
  if p_steps is not null or p_active_kcal is not null then
    insert into public.daily_activity (user_id, log_date, steps, active_kcal)
    values (v_uid, p_date, coalesce(p_steps, 0), coalesce(p_active_kcal, 0))
    on conflict (user_id, log_date) do update
      set steps       = coalesce(p_steps, public.daily_activity.steps),
          active_kcal = coalesce(p_active_kcal, public.daily_activity.active_kcal),
          updated_at  = now();
  end if;

  if jsonb_typeof(coalesce(p_workouts, '[]'::jsonb)) = 'array' then
    for v_workout in
      select value from jsonb_array_elements(coalesce(p_workouts, '[]'::jsonb)) limit 50
    loop
      begin
        v_started := (v_workout ->> 'startedAt')::timestamptz;
        if v_started >= now() - interval '9 days' and v_started <= now() + interval '1 day' then
          v_minutes := case
            when (v_workout ->> 'durationMin') is null then null
            else least(1440, greatest(1, (v_workout ->> 'durationMin')::integer))
          end;

          insert into public.exercise_logs (user_id, logged_at, name, duration_min, calories, source, external_id)
          values (
            v_uid,
            v_started,
            left(coalesce(nullif(v_workout ->> 'name', ''), 'Workout'), 200),
            v_minutes,
            least(20000, greatest(0, coalesce((v_workout ->> 'calories')::integer, 0))),
            'shortcut',
            v_workout ->> 'externalId'
          )
          on conflict (user_id, external_id) where external_id is not null do update
            set name         = excluded.name,
                duration_min = excluded.duration_min,
                calories     = excluded.calories;

          v_saved := v_saved + 1;
        end if;
      exception when others then
        -- One unreadable workout should not lose the rest of the sync.
        null;
      end;
    end loop;
  end if;

  return jsonb_build_object('ok', true, 'date', p_date, 'workouts', v_saved);
end;
$$;

-- The key is the credential, so this is callable without a login.
revoke all on function public.ingest_health_sync(text, date, integer, integer, jsonb) from public;
grant execute on function public.ingest_health_sync(text, date, integer, integer, jsonb) to anon, authenticated;

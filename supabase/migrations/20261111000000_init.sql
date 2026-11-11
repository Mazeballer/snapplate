-- Snapplate: initial schema.
--   1. Allowlist (only listed emails may sign up or use the app)
--   2. Tables, all scoped to the signed-in user
--   3. Row-level security on every table
--   4. Private storage bucket for meal photos
--
-- All dates are Malaysia time (Asia/Kuala_Lumpur). log_date columns are computed by
-- triggers from the timestamp, never trusted from the client.

---------------------------------------------------------------------------
-- 1. Allowlist
---------------------------------------------------------------------------

create table public.allowed_emails (
  email      text primary key check (email = lower(email)),
  note       text,
  created_at timestamptz not null default now()
);

-- Nobody reads or writes this from the app. The owner edits it in the Supabase dashboard.
alter table public.allowed_emails enable row level security;
revoke all on public.allowed_emails from anon, authenticated;

-- People are added to the allowlist by the owner in the Supabase dashboard (Table Editor >
-- allowed_emails), never in this file, so no email addresses live in the repository.

-- True when the signed-in user's email is (still) on the allowlist. Used by every policy,
-- so removing an email cuts off an existing user immediately.
create function public.is_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.allowed_emails
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_allowed() from public, anon;
grant execute on function public.is_allowed() to authenticated;

-- Supabase "Before User Created" auth hook: rejects sign-ups from emails not on the list.
-- Enable it in Dashboard > Authentication > Hooks > Before User Created, pointing at this function.
create function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate text := lower(coalesce(event -> 'user' ->> 'email', ''));
begin
  if candidate <> '' and exists (select 1 from public.allowed_emails where email = candidate) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object(
    'error',
    jsonb_build_object(
      'message', 'Snapplate is a private app and this email has not been given access.',
      'http_code', 403
    )
  );
end;
$$;

revoke all on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;

---------------------------------------------------------------------------
-- 2. Helpers
---------------------------------------------------------------------------

-- The Malaysia calendar date of "now" and of any timestamp.
create function public.myt_date(ts timestamptz default now())
returns date
language sql
stable
set search_path = ''
as $$
  select (ts at time zone 'Asia/Kuala_Lumpur')::date;
$$;

create function public.set_log_date_from_logged_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.log_date := public.myt_date(new.logged_at);
  return new;
end;
$$;

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

---------------------------------------------------------------------------
-- 3. Tables
---------------------------------------------------------------------------

create table public.profiles (
  user_id             uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name        text,
  sex                 text check (sex in ('male', 'female', 'other')),
  date_of_birth       date,
  height_cm           numeric(5, 1) check (height_cm between 50 and 260),
  weight_kg           numeric(5, 1) check (weight_kg between 20 and 500),
  units               text not null default 'metric' check (units in ('metric', 'imperial')),
  activity_level      text check (activity_level in ('light', 'moderate', 'active')),
  goal                text check (goal in ('lose', 'maintain', 'gain')),
  goal_weight_kg      numeric(5, 1) check (goal_weight_kg between 20 and 500),
  pace_kg_per_week    numeric(3, 2) check (pace_kg_per_week between 0 and 2),
  diet_plan           text not null default 'balanced'
                        check (diet_plan in ('balanced', 'high_carb', 'high_protein', 'keto', 'low_carb')),
  dietary_preference  text,
  restrictions        text[] not null default '{}',
  calorie_target      integer check (calorie_target between 500 and 10000),
  protein_g           integer check (protein_g >= 0),
  carbs_g             integer check (carbs_g >= 0),
  fat_g               integer check (fat_g >= 0),
  fiber_g             integer check (fiber_g >= 0),
  sugar_g             integer check (sugar_g >= 0),
  sodium_mg           integer check (sodium_mg >= 0),
  step_goal           integer not null default 10000 check (step_goal > 0),
  rollover_calories   boolean not null default false,
  add_burned_calories boolean not null default false,
  calorie_override    boolean not null default false,
  onboarded_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create table public.meals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  logged_at     timestamptz not null default now(),
  log_date      date not null,
  meal_type     text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  name          text not null check (length(name) between 1 and 200),
  image_path    text,
  calories      numeric(7, 1) not null default 0 check (calories >= 0),
  protein_g     numeric(6, 1) not null default 0 check (protein_g >= 0),
  carbs_g       numeric(6, 1) not null default 0 check (carbs_g >= 0),
  fat_g         numeric(6, 1) not null default 0 check (fat_g >= 0),
  fiber_g       numeric(6, 1) check (fiber_g >= 0),
  sugar_g       numeric(6, 1) check (sugar_g >= 0),
  sodium_mg     numeric(7, 1) check (sodium_mg >= 0),
  servings      numeric(5, 2) not null default 1 check (servings > 0),
  health_score  numeric(3, 1) check (health_score between 0 and 10),
  health_label  text,
  source        text not null default 'manual' check (source in ('photo', 'text', 'manual', 'saved')),
  ai_trace_id   text,
  created_at    timestamptz not null default now()
);
create trigger meals_set_log_date
  before insert or update of logged_at on public.meals
  for each row execute function public.set_log_date_from_logged_at();
create index meals_user_log_date_idx on public.meals (user_id, log_date);

create table public.meal_items (
  id         uuid primary key default gen_random_uuid(),
  meal_id    uuid not null references public.meals (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  position   integer not null default 0,
  name       text not null check (length(name) between 1 and 200),
  quantity   numeric(8, 2) not null default 1 check (quantity > 0),
  unit       text,
  calories   numeric(7, 1) not null default 0 check (calories >= 0),
  protein_g  numeric(6, 1) not null default 0 check (protein_g >= 0),
  carbs_g    numeric(6, 1) not null default 0 check (carbs_g >= 0),
  fat_g      numeric(6, 1) not null default 0 check (fat_g >= 0),
  fiber_g    numeric(6, 1) check (fiber_g >= 0),
  sugar_g    numeric(6, 1) check (sugar_g >= 0),
  sodium_mg  numeric(7, 1) check (sodium_mg >= 0)
);
create index meal_items_meal_idx on public.meal_items (meal_id);

create table public.saved_meals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (length(name) between 1 and 200),
  -- The meal fields and its items, copied when logged again.
  payload    jsonb not null,
  created_at timestamptz not null default now()
);
create index saved_meals_user_idx on public.saved_meals (user_id);

create table public.weight_logs (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date  date not null default public.myt_date(),
  weight_kg numeric(5, 1) not null check (weight_kg between 20 and 500),
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table public.water_logs (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  logged_at timestamptz not null default now(),
  log_date  date not null,
  amount_ml integer not null check (amount_ml between 1 and 5000)
);
create trigger water_logs_set_log_date
  before insert or update of logged_at on public.water_logs
  for each row execute function public.set_log_date_from_logged_at();
create index water_logs_user_log_date_idx on public.water_logs (user_id, log_date);

create table public.exercise_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  logged_at    timestamptz not null default now(),
  log_date     date not null,
  name         text not null check (length(name) between 1 and 200),
  duration_min integer check (duration_min between 1 and 1440),
  intensity    text check (intensity in ('low', 'medium', 'high')),
  calories     integer not null check (calories >= 0),
  source       text not null default 'manual' check (source in ('manual', 'text', 'shortcut'))
);
create trigger exercise_logs_set_log_date
  before insert or update of logged_at on public.exercise_logs
  for each row execute function public.set_log_date_from_logged_at();
create index exercise_logs_user_log_date_idx on public.exercise_logs (user_id, log_date);

-- Steps and active calories pushed from Apple Health through the iOS Shortcut.
create table public.daily_activity (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date    date not null,
  steps       integer not null default 0 check (steps >= 0),
  active_kcal integer not null default 0 check (active_kcal >= 0),
  updated_at  timestamptz not null default now(),
  primary key (user_id, log_date)
);

-- Personal tokens the Shortcut uses to post activity. Only a hash is stored.
create table public.health_sync_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  token_hash   text not null unique,
  label        text,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);
create index health_sync_tokens_user_idx on public.health_sync_tokens (user_id);

-- Daily AI scan counter used to cap cost per user.
create table public.ai_usage (
  user_id    uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default public.myt_date(),
  scans      integer not null default 0,
  primary key (user_id, usage_date)
);

-- Counts one scan for the signed-in user and says whether they are still under the cap.
-- Called by the server with the user's own session.
create function public.consume_ai_scan(max_per_day integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_scans integer;
begin
  if auth.uid() is null or not public.is_allowed() then
    return false;
  end if;

  insert into public.ai_usage as u (user_id, usage_date, scans)
  values (auth.uid(), public.myt_date(), 1)
  on conflict (user_id, usage_date) do update set scans = u.scans + 1
  returning u.scans into current_scans;

  return current_scans <= max_per_day;
end;
$$;

revoke all on function public.consume_ai_scan(integer) from public, anon;
grant execute on function public.consume_ai_scan(integer) to authenticated;

---------------------------------------------------------------------------
-- 4. Row-level security
---------------------------------------------------------------------------

-- Full access to your own rows, and only while your email is still on the allowlist.
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'meals', 'meal_items', 'saved_meals', 'weight_logs',
    'water_logs', 'exercise_logs', 'daily_activity'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated
         using ((select auth.uid()) = user_id and public.is_allowed())
         with check ((select auth.uid()) = user_id and public.is_allowed())',
      t
    );
  end loop;
end
$$;

-- Read-only from the app; the server writes these.
alter table public.health_sync_tokens enable row level security;
create policy "read own tokens" on public.health_sync_tokens
  for select to authenticated
  using ((select auth.uid()) = user_id and public.is_allowed());

alter table public.ai_usage enable row level security;
create policy "read own usage" on public.ai_usage
  for select to authenticated
  using ((select auth.uid()) = user_id and public.is_allowed());

-- Sync tokens and usage counters are written by the server only.
revoke insert, update, delete on public.health_sync_tokens from authenticated;
revoke insert, update, delete on public.ai_usage from authenticated;

---------------------------------------------------------------------------
-- 5. Storage: private bucket for meal photos
---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-photos', 'meal-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Files live under a folder named after the user's id: <user id>/<file name>.
create policy "meal photos: read own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_allowed()
  );

create policy "meal photos: upload own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_allowed()
  );

create policy "meal photos: update own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_allowed()
  );

create policy "meal photos: delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_allowed()
  );

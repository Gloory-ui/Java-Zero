-- Java-Zero v1.0: профили, прогресс по этапам и ачивки.
-- Каждый пользователь видит и меняет только свои строки (RLS). Ключ service_role приложению не нужен.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  avatar_url text check (char_length(avatar_url) <= 500),
  persona text not null default 'chill' check (persona in ('chill', 'dushny', 'bigtech')),
  streak integer not null default 0 check (streak >= 0),
  sound boolean not null default true,
  last_stage text check (char_length(last_stage) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stage_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  quest_id text not null check (quest_id ~ '^[a-z0-9_-]{1,40}$'),
  stage_id text not null check (stage_id ~ '^[a-z0-9_-]{1,60}$'),
  code text check (char_length(code) <= 20000),
  attempts text[] not null default '{}' check (cardinality(attempts) <= 20),
  fails integer not null default 0 check (fails >= 0),
  started_at timestamptz,
  passed_at timestamptz,
  hint_used boolean not null default false,
  cheat_used boolean not null default false,
  solution_viewed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, quest_id, stage_id)
);

create table public.achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id text not null check (achievement_id ~ '^[a-z0-9_]{1,40}$'),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- updated_at ставит база, а не клиент
create function public.touch_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger stage_progress_touch before update on public.stage_progress
  for each row execute function public.touch_updated_at();

-- Профиль создаётся при регистрации: имя и аватар из GitHub/Google, для входа по почте — часть адреса до @
create function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'user_name',
      split_part(new.email, '@', 1)
    ), 80),
    left(new.raw_user_meta_data ->> 'avatar_url', 500)
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.stage_progress enable row level security;
alter table public.achievements enable row level security;

-- (select auth.uid()) вычисляется один раз на запрос, а не для каждой строки
create policy "profiles: свой профиль" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "stage_progress: свои этапы" on public.stage_progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "achievements: свои ачивки" on public.achievements
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Гостям таблицы не нужны; вошедшим — только через политики выше
revoke all on public.profiles, public.stage_progress, public.achievements from anon;
grant select, insert, update, delete on public.profiles, public.stage_progress, public.achievements to authenticated;

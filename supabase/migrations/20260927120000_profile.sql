-- Java-Zero: профиль с оформлением, публичная страница /u/ник, таблица лидеров, картинки профиля.
-- Выполнять после 20260926120000_gamification.sql. Только добавляет: прежние версии сайта с ней работают.

-- ——— Поля профиля ———

alter table public.profiles
  -- Ник для ссылки /u/ник: латиница в нижнем регистре, цифры, подчёркивание
  add column if not exists handle text check (handle ~ '^[a-z0-9_]{3,20}$'),
  add column if not exists bio text not null default '' check (char_length(bio) <= 160),
  -- Оформление: id из каталога сайта (lib/profile/cosmetics.ts)
  add column if not exists accent text check (accent ~ '^[a-z0-9_-]{1,24}$'),
  add column if not exists frame text check (frame ~ '^[a-z0-9_-]{1,24}$'),
  add column if not exists banner text check (banner ~ '^[a-z0-9_-]{1,24}$'),
  -- Только https без кавычек, скобок и пробелов: ссылку подставляют в CSS и в <img>
  add column if not exists banner_url text check (char_length(banner_url) <= 500 and banner_url ~ '^https://[^"''()\s<>]+$'),
  add column if not exists title text check (char_length(title) <= 60),
  add column if not exists showcase text[] not null default '{}' check (cardinality(showcase) <= 4),
  -- Публичность выбирает сам студент; по умолчанию профиль закрыт
  add column if not exists is_public boolean not null default false,
  -- Сводка для публичной страницы: сайт пересчитывает её при каждой синхронизации
  add column if not exists xp_total integer not null default 0 check (xp_total >= 0),
  add column if not exists level integer not null default 1 check (level >= 1),
  add column if not exists stages_passed integer not null default 0 check (stages_passed >= 0),
  add column if not exists streak_days integer not null default 0 check (streak_days >= 0),
  add column if not exists best_streak integer not null default 0 check (best_streak >= 0);

create unique index if not exists profiles_handle_key on public.profiles (handle);

-- ——— Публичные данные: только через функции, таблицы остаются закрыты RLS ———

-- Свободен ли ник. Свой ник считается свободным, чтобы можно было сохранить профиль без изменений
create or replace function public.handle_available(p_handle text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_handle ~ '^[a-z0-9_]{3,20}$'
    and not exists (
      select 1 from public.profiles
      where handle = p_handle and id is distinct from (select auth.uid())
    );
$$;

-- Публичный профиль по нику: только поля для показа и открытые достижения. Закрытый профиль не найдётся
create or replace function public.get_public_profile(p_handle text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'handle', p.handle,
    'display_name', p.display_name,
    'avatar_url', p.avatar_url,
    'bio', p.bio,
    'accent', p.accent,
    'frame', p.frame,
    'banner', p.banner,
    'banner_url', p.banner_url,
    'title', p.title,
    'showcase', p.showcase,
    'xp_total', p.xp_total,
    'level', p.level,
    'stages_passed', p.stages_passed,
    'streak_days', p.streak_days,
    'best_streak', p.best_streak,
    'created_at', p.created_at,
    'achievements', coalesce(
      (select jsonb_agg(jsonb_build_object('id', a.achievement_id, 'at', a.unlocked_at) order by a.unlocked_at desc)
       from public.achievements a where a.user_id = p.id),
      '[]'::jsonb
    )
  )
  from public.profiles p
  where p.handle = p_handle and p.is_public;
$$;

-- Таблица лидеров: опыт считается по строкам этапов, достижений и квестов дня (у каждой строки есть потолок),
-- а не по xp_total, который присылает браузер. В таблицу попадают только публичные профили с ником
create or replace function public.leaderboard(p_period text default 'all')
returns table (
  handle text,
  display_name text,
  avatar_url text,
  accent text,
  frame text,
  title text,
  level integer,
  xp bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with gains as (
    select user_id, xp, passed_at as at from public.stage_progress where passed_at is not null
    union all
    select user_id, xp, unlocked_at from public.achievements
    union all
    select user_id, xp, completed_at from public.daily_quests
  )
  select p.handle, p.display_name, p.avatar_url, p.accent, p.frame, p.title, p.level, sum(g.xp)::bigint as xp
  from gains g
  join public.profiles p on p.id = g.user_id
  where p.is_public
    and p.handle is not null
    and (p_period <> 'week' or g.at >= now() - interval '7 days')
  group by p.id
  having sum(g.xp) > 0
  order by xp desc, max(g.at) asc
  limit 50;
$$;

revoke all on function public.handle_available(text) from public;
revoke all on function public.get_public_profile(text) from public;
revoke all on function public.leaderboard(text) from public;
grant execute on function public.handle_available(text) to authenticated;
grant execute on function public.get_public_profile(text) to anon, authenticated;
grant execute on function public.leaderboard(text) to anon, authenticated;

-- ——— Картинки профиля: аватар и баннер ———
-- Бакет публичный на чтение (картинки видны на публичной странице), писать можно только в свою папку «uid/»

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-media', 'profile-media', true, 2097152, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile-media: свои файлы — чтение" on storage.objects;
drop policy if exists "profile-media: свои файлы — загрузка" on storage.objects;
drop policy if exists "profile-media: свои файлы — замена" on storage.objects;
drop policy if exists "profile-media: свои файлы — удаление" on storage.objects;

create policy "profile-media: свои файлы — чтение" on storage.objects
  for select to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "profile-media: свои файлы — загрузка" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "profile-media: свои файлы — замена" on storage.objects
  for update to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "profile-media: свои файлы — удаление" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

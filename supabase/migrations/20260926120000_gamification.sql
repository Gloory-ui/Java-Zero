-- Java-Zero: опыт, квесты дня и редкость достижений.
-- Миграция только добавляет колонки, таблицу и функцию: сайт до обновления с ней работает как раньше.

-- Опыт, зафиксированный при первой сдаче этапа. 0 — строка из времени до системы опыта: сайт досчитает его сам.
-- Верхняя граница не даёт накрутить таблицу лидеров одной строкой
alter table public.stage_progress
  add column if not exists xp integer not null default 0 check (xp between 0 and 200);

-- Опыт достижения по его редкости (25, 75, 150, 300)
alter table public.achievements
  add column if not exists xp integer not null default 0 check (xp between 0 and 300);

-- Счётчики для достижений с уровнями: защиты на 5, верные квизы, запуски, вопросы ментору.
-- Колонка streak остаётся и хранит серию этапов подряд без проваленных проверок
alter table public.profiles
  add column if not exists stats jsonb not null default '{}'::jsonb
    check (jsonb_typeof(stats) = 'object' and pg_column_size(stats) <= 2048);

-- Выполненные квесты дня. quest_id = 'chest' — сундук за все три квеста дня
create table if not exists public.daily_quests (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  quest_id text not null check (quest_id ~ '^[a-z0-9_]{1,40}$'),
  xp integer not null check (xp between 0 and 100),
  completed_at timestamptz not null default now(),
  primary key (user_id, day, quest_id)
);

alter table public.daily_quests enable row level security;

drop policy if exists "daily_quests: свои квесты" on public.daily_quests;
create policy "daily_quests: свои квесты" on public.daily_quests
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.daily_quests from anon;
grant select, insert, update, delete on public.daily_quests to authenticated;

-- Редкость достижений: только агрегаты «у скольких студентов есть / всего студентов», без чужих строк.
-- security definer — чтобы посчитать все строки, хотя RLS показывает каждому только свои
create or replace function public.achievement_rarity()
returns table (achievement_id text, holders bigint, total bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select a.achievement_id, count(*)::bigint, (select count(*) from public.profiles)::bigint
  from public.achievements a
  group by a.achievement_id;
$$;

revoke all on function public.achievement_rarity() from public;
grant execute on function public.achievement_rarity() to anon, authenticated;

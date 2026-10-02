-- Java-Zero: основа админки и честная таблица лидеров.
-- Выполнить в Supabase → SQL Editor после 20260929120000_public_profiles.sql. Повторный запуск безопасен.
-- Следом идут миграции админки других частей: 20261001130000_group_access.sql, 20261001140000_admin_stats.sql

-- ——— 1. Админы ———
-- Список админов меняется только в SQL Editor (docs/admin.md): ни одной политики, сайт видит его через is_admin()
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- Текущий пользователь — админ? Все админские функции и политики начинаются с этой проверки
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ——— 2. Каталог честного опыта ———
-- Студент сам пишет в базу свои этапы, достижения и квесты дня: RLS разрешает ему свои строки. Значит, он
-- может записать выдуманные id или опыт сверх возможного и подняться в лидерборде. Каталог перечисляет все
-- настоящие факты курса с честным максимумом опыта (lib/game/xp-catalog.ts), а user_xp считает только их.
-- Сервер на Render обновляет каталог при каждом запуске (instrumentation.ts); начальное наполнение — в конце файла
create table if not exists public.xp_catalog (
  kind text not null check (kind in ('stage', 'achievement', 'daily')),
  id text not null check (char_length(id) between 1 and 120),
  xp integer not null check (xp between 0 and 1000),
  synced_at timestamptz not null default now(),
  primary key (kind, id)
);
alter table public.xp_catalog enable row level security;
revoke all on public.xp_catalog from anon, authenticated;

-- ——— 3. Квесты дня задним числом ———
-- День квеста пишет браузер, поэтому можно было бы «выполнить» квесты за сотни прошедших дней.
-- received_at ставит сервер в момент первой записи, и в рейтинг идут только квесты, присланные в свой день
-- (с запасом на часовые пояса). Квест, выполненный без сети и присланный позже, остаётся в опыте на сайте,
-- но не в рейтинге
alter table public.daily_quests add column if not exists received_at timestamptz;
update public.daily_quests set received_at = completed_at where received_at is null;
alter table public.daily_quests alter column received_at set default now();
alter table public.daily_quests alter column received_at set not null;

create or replace function public.daily_quests_received_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.received_at := now();
  else
    new.received_at := old.received_at;
  end if;
  return new;
end;
$$;

drop trigger if exists daily_quests_received_at on public.daily_quests;
create trigger daily_quests_received_at
  before insert or update on public.daily_quests
  for each row execute function public.daily_quests_received_at();

-- ——— 4. Опыт студента: только факты из каталога и не дороже честного максимума ———
-- Прежние потолки по числу строк (400 этапов, 250 достижений) больше не нужны: каталог ограничивает сам
create or replace function public.user_xp(p_user uuid, p_since timestamptz default '-infinity')
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((
      select sum(least(sp.xp, c.xp))
      from public.stage_progress sp
      join public.xp_catalog c on c.kind = 'stage' and c.id = sp.quest_id || '/' || sp.stage_id
      where sp.user_id = p_user and sp.passed_at is not null and sp.passed_at >= p_since
    ), 0)
    + coalesce((
      -- Опыт достижения задаёт каталог: в строке он мог остаться нулём со времён до системы опыта
      select sum(c.xp)
      from public.achievements a
      join public.xp_catalog c on c.kind = 'achievement' and c.id = a.achievement_id
      where a.user_id = p_user and a.unlocked_at >= p_since
    ), 0)
    + coalesce((
      select sum(least(d.xp, c.xp))
      from (
        select dq.quest_id, dq.xp, row_number() over (partition by dq.day order by dq.completed_at) as n
        from public.daily_quests dq
        where dq.user_id = p_user
          and dq.completed_at >= p_since
          and dq.day between (dq.received_at at time zone 'utc')::date - 2 and (dq.received_at at time zone 'utc')::date + 1
      ) d
      join public.xp_catalog c on c.kind = 'daily' and c.id = d.quest_id
      where d.n <= 4
    ), 0);
$$;
revoke all on function public.user_xp(uuid, timestamptz) from public;
revoke all on function public.user_xp(uuid, timestamptz) from anon, authenticated;

-- ——— 5. Модерация лидерборда ———
-- Отдельная таблица, а не колонка в profiles: свой профиль студент правит сам и снял бы отметку
create table if not exists public.leaderboard_bans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 200),
  banned_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.leaderboard_bans enable row level security;
revoke all on public.leaderboard_bans from anon, authenticated;

-- Таблица лидеров: как в 20260929120000_public_profiles.sql, но без снятых админом
drop function if exists public.leaderboard(text);
create function public.leaderboard(p_period text default 'all')
returns table (
  handle text,
  display_name text,
  avatar_url text,
  accent text,
  frame text,
  title text,
  is_public boolean,
  xp_total bigint,
  xp bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from (
    select
      p.handle, p.display_name, p.avatar_url, p.accent, p.frame,
      case when p.is_public then p.title end as title,
      p.is_public,
      public.user_xp(p.id) as xp_total,
      public.user_xp(p.id, case when p_period = 'week' then now() - interval '7 days' else '-infinity'::timestamptz end) as xp
    from public.profiles p
    where p.handle is not null
      and not exists (select 1 from public.leaderboard_bans b where b.user_id = p.id)
  ) t
  where t.xp > 0
  order by t.xp desc, t.handle
  limit 50;
$$;
revoke all on function public.leaderboard(text) from public;
grant execute on function public.leaderboard(text) to anon, authenticated;

-- Лидерборд глазами админа: все студенты, включая снятых, и признаки накрутки.
-- raw_xp — опыт по строкам как есть; разница с xp — то, что каталог не засчитал.
-- unknown_rows — строки с id, которых нет в курсе; burst — этапов, сданных за самый «быстрый» час
create or replace function public.admin_leaderboard(p_search text default null, p_limit integer default 100)
returns table (
  user_id uuid,
  handle text,
  display_name text,
  avatar_url text,
  created_at timestamptz,
  xp bigint,
  raw_xp bigint,
  stages_passed bigint,
  unknown_rows bigint,
  burst bigint,
  last_active timestamptz,
  banned boolean,
  ban_reason text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
  select
    p.id,
    p.handle,
    p.display_name,
    p.avatar_url,
    p.created_at,
    public.user_xp(p.id),
    coalesce((select sum(sp.xp) from public.stage_progress sp where sp.user_id = p.id and sp.passed_at is not null), 0)
      + coalesce((select sum(a.xp) from public.achievements a where a.user_id = p.id), 0)
      + coalesce((select sum(dq.xp) from public.daily_quests dq where dq.user_id = p.id), 0),
    (select count(*) from public.stage_progress sp where sp.user_id = p.id and sp.passed_at is not null),
    (select count(*) from public.stage_progress sp where sp.user_id = p.id
       and not exists (select 1 from public.xp_catalog c where c.kind = 'stage' and c.id = sp.quest_id || '/' || sp.stage_id))
      + (select count(*) from public.achievements a where a.user_id = p.id
       and not exists (select 1 from public.xp_catalog c where c.kind = 'achievement' and c.id = a.achievement_id)),
    coalesce((
      select max(cnt) from (
        select count(*) as cnt from public.stage_progress sp
        where sp.user_id = p.id and sp.passed_at is not null
        group by date_trunc('hour', sp.passed_at)
      ) h
    ), 0),
    greatest(
      (select max(sp.updated_at) from public.stage_progress sp where sp.user_id = p.id),
      (select max(dq.completed_at) from public.daily_quests dq where dq.user_id = p.id)
    ),
    b.user_id is not null,
    coalesce(b.reason, '')
  from public.profiles p
  left join public.leaderboard_bans b on b.user_id = p.id
  where p_search is null or p_search = ''
     or p.handle ilike '%' || p_search || '%'
     or p.display_name ilike '%' || p_search || '%'
  order by 6 desc, p.handle
  limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;
revoke all on function public.admin_leaderboard(text, integer) from public;
grant execute on function public.admin_leaderboard(text, integer) to authenticated;

-- Снять студента с лидерборда или вернуть. Его прогресс не трогается: он учится дальше, просто не в рейтинге
create or replace function public.admin_set_leaderboard_ban(p_user uuid, p_banned boolean, p_reason text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_banned then
    insert into public.leaderboard_bans (user_id, reason, banned_by)
    values (p_user, left(coalesce(p_reason, ''), 200), (select auth.uid()))
    on conflict (user_id) do update set reason = excluded.reason, banned_by = excluded.banned_by, created_at = now();
  else
    delete from public.leaderboard_bans where user_id = p_user;
  end if;
end;
$$;
revoke all on function public.admin_set_leaderboard_ban(uuid, boolean, text) from public;
grant execute on function public.admin_set_leaderboard_ban(uuid, boolean, text) to authenticated;

-- ——— 6. Правки текстов курса из админки ———
-- Курс лежит файлами в git; админ правит тексты поверх них, сайт подхватывает правки примерно за минуту.
-- stage_id = '' — правка самого квеста. Читает таблицу только сервер сайта (секретным ключом) и админ:
-- среди правок могут быть задания «Группы», открытое чтение выдало бы их всем
create table if not exists public.content_overrides (
  quest_id text not null check (quest_id ~ '^[a-z0-9_-]{1,40}$'),
  stage_id text not null default '' check (stage_id = '' or stage_id ~ '^[a-z0-9_-]{1,60}$'),
  field text not null check (field ~ '^[a-z][a-z0-9_.]{0,40}$'),
  value text not null check (char_length(value) <= 50000),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (quest_id, stage_id, field)
);
alter table public.content_overrides enable row level security;
revoke all on public.content_overrides from anon;
grant select, insert, update, delete on public.content_overrides to authenticated;

drop policy if exists "content_overrides: админ" on public.content_overrides;
create policy "content_overrides: админ" on public.content_overrides
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ——— 7. Начальный каталог: курс на момент миграции (npx tsx scripts/xp-catalog.ts) ———
insert into public.xp_catalog (kind, id, xp) values
  ('stage', 'basics/program-structure', 70),
  ('stage', 'basics/memory-boxes', 70),
  ('stage', 'basics/arithmetic', 70),
  ('stage', 'basics/remainder', 70),
  ('stage', 'basics/strings', 70),
  ('stage', 'basics/input', 70),
  ('stage', 'basics/conditions', 70),
  ('stage', 'basics/logic', 70),
  ('stage', 'loops_prep/for-anatomy', 70),
  ('stage', 'loops_prep/break-continue', 70),
  ('stage', 'loops_prep/accumulators', 70),
  ('stage', 'loops_prep/nested-loops', 70),
  ('stage', 'loops_prep/while-attempts', 70),
  ('stage', 'loops_prep/prime-flag', 70),
  ('stage', 'kt1/multiplication-table', 110),
  ('stage', 'kt1/skip-multiples', 110),
  ('stage', 'kt1/even-and-triple', 110),
  ('stage', 'kt1/even-odd-sums', 110),
  ('stage', 'kt1/guess-number', 110),
  ('stage', 'kt1/primes-to-n', 110),
  ('stage', 'calc/splash', 70),
  ('stage', 'calc/switch-zero', 70),
  ('stage', 'calc/methods', 70),
  ('stage', 'calc/history-array', 70),
  ('stage', 'calc/array-sum', 70),
  ('stage', 'calc/factorial', 70),
  ('stage', 'arrays_prep/array-basics', 70),
  ('stage', 'arrays_prep/max-positions', 70),
  ('stage', 'arrays_prep/swap', 70),
  ('stage', 'arrays_prep/random', 70),
  ('stage', 'arrays_prep/table', 70),
  ('stage', 'arrays_prep/cells', 70),
  ('stage', 'arrays_prep/row-sums', 70),
  ('stage', 'arrays_prep/diagonals', 70),
  ('stage', 'kt2/odd-array', 110),
  ('stage', 'kt2/min-all', 110),
  ('stage', 'kt2/swap-min-max', 110),
  ('stage', 'kt2/random-row', 110),
  ('stage', 'kt2/negative-cells', 110),
  ('stage', 'kt2/visitors', 110),
  ('stage', 'kt2/diagonal-sums', 110),
  ('stage', 'oop_prep/class-object', 70),
  ('stage', 'oop_prep/methods', 70),
  ('stage', 'oop_prep/constructor', 70),
  ('stage', 'oop_prep/overloading', 70),
  ('stage', 'oop_prep/references', 70),
  ('stage', 'oop_prep/object-array', 70),
  ('stage', 'oop_prep/links', 70),
  ('stage', 'oop_prep/static-counter', 70),
  ('stage', 'oop_prep/encapsulation', 70),
  ('stage', 'oop_prep/compare-factory', 70),
  ('stage', 'kt3/animal-class', 110),
  ('stage', 'kt3/many-animals', 110),
  ('stage', 'kt3/owner', 110),
  ('stage', 'kt3/birthday', 110),
  ('stage', 'kt3/cards', 110),
  ('stage', 'kt3/counter', 110),
  ('stage', 'kt3/getters-setters', 110),
  ('stage', 'kt3/compare', 110),
  ('stage', 'kt3/factory', 110),
  ('stage', 'inheritance/extends', 70),
  ('stage', 'inheritance/constructor-order', 70),
  ('stage', 'inheritance/super', 70),
  ('stage', 'inheritance/init-order', 70),
  ('stage', 'inheritance/override', 70),
  ('stage', 'inheritance/polymorphism', 70),
  ('stage', 'inheritance/abstract', 70),
  ('stage', 'inheritance/object-methods', 70),
  ('stage', 'interfaces/interface-basics', 70),
  ('stage', 'interfaces/default-methods', 70),
  ('stage', 'interfaces/multiple-interfaces', 70),
  ('stage', 'interfaces/enum-basics', 70),
  ('stage', 'interfaces/enum-fields', 70),
  ('stage', 'interfaces/records', 70),
  ('stage', 'strings/string-methods', 70),
  ('stage', 'strings/chars', 70),
  ('stage', 'strings/string-builder', 70),
  ('stage', 'strings/format', 70),
  ('stage', 'strings/split-join', 70),
  ('stage', 'strings/text-commands', 70),
  ('stage', 'strings/regex', 70),
  ('stage', 'exceptions/try-catch', 70),
  ('stage', 'exceptions/parse-errors', 70),
  ('stage', 'exceptions/multi-catch-finally', 70),
  ('stage', 'exceptions/throw', 70),
  ('stage', 'exceptions/custom-exception', 70),
  ('stage', 'exceptions/try-with-resources', 70),
  ('stage', 'exceptions/input-validation', 70),
  ('stage', 'collections/arraylist', 70),
  ('stage', 'collections/list-remove', 70),
  ('stage', 'collections/deque', 70),
  ('stage', 'collections/hashmap', 70),
  ('stage', 'collections/sets', 70),
  ('stage', 'collections/comparable', 70),
  ('stage', 'collections/comparator', 70),
  ('stage', 'collections/collections-utils', 70),
  ('stage', 'collections/choose-collection', 70),
  ('stage', 'generics/generic-class', 70),
  ('stage', 'generics/generic-methods', 70),
  ('stage', 'generics/bounded-types', 70),
  ('stage', 'generics/wildcards', 70),
  ('stage', 'generics/generic-stack', 70),
  ('stage', 'streams/lambdas', 70),
  ('stage', 'streams/functional-interfaces', 70),
  ('stage', 'streams/method-refs', 70),
  ('stage', 'streams/filter-map', 70),
  ('stage', 'streams/reduce', 70),
  ('stage', 'streams/collectors', 70),
  ('stage', 'streams/optional', 70),
  ('stage', 'streams/pipeline', 70),
  ('stage', 'files/paths', 70),
  ('stage', 'files/write-read', 70),
  ('stage', 'files/append', 70),
  ('stage', 'files/buffered', 70),
  ('stage', 'files/csv', 70),
  ('stage', 'files/io-errors', 70),
  ('stage', 'algorithms/bubble-sort', 70),
  ('stage', 'algorithms/selection-sort', 70),
  ('stage', 'algorithms/insertion-sort', 70),
  ('stage', 'algorithms/binary-search', 70),
  ('stage', 'algorithms/complexity', 70),
  ('stage', 'algorithms/merge-sort', 70),
  ('stage', 'algorithms/quick-sort', 70),
  ('stage', 'algorithms/stack-brackets', 70),
  ('stage', 'threads/thread-basics', 70),
  ('stage', 'threads/synchronized', 70),
  ('stage', 'threads/atomic', 70),
  ('stage', 'threads/executor', 70),
  ('stage', 'threads/concurrent-collections', 70),
  ('stage', 'threads/completable-future', 70),
  ('stage', 'threads/producer-consumer', 70),
  ('stage', 'project/catalog', 70),
  ('stage', 'project/search', 70),
  ('stage', 'project/borrow', 70),
  ('stage', 'project/commands', 70),
  ('stage', 'project/sort-stats', 70),
  ('stage', 'project/save-load', 70),
  ('stage', 'project/validation', 70),
  ('stage', 'project/report', 70),
  ('achievement', 'quest_basics', 75),
  ('achievement', 'quest_loops_prep', 75),
  ('achievement', 'quest_kt1', 150),
  ('achievement', 'quest_calc', 75),
  ('achievement', 'quest_arrays_prep', 75),
  ('achievement', 'quest_kt2', 150),
  ('achievement', 'quest_oop_prep', 75),
  ('achievement', 'quest_kt3', 150),
  ('achievement', 'quest_inheritance', 75),
  ('achievement', 'quest_interfaces', 75),
  ('achievement', 'quest_strings', 75),
  ('achievement', 'quest_exceptions', 75),
  ('achievement', 'quest_collections', 75),
  ('achievement', 'quest_generics', 75),
  ('achievement', 'quest_streams', 75),
  ('achievement', 'quest_files', 75),
  ('achievement', 'quest_algorithms', 75),
  ('achievement', 'quest_threads', 75),
  ('achievement', 'quest_project', 75),
  ('achievement', 'graduate', 300),
  ('achievement', 'clean_basics', 150),
  ('achievement', 'nohint_basics', 75),
  ('achievement', 'clean_loops_prep', 150),
  ('achievement', 'nohint_loops_prep', 75),
  ('achievement', 'clean_calc', 150),
  ('achievement', 'nohint_calc', 75),
  ('achievement', 'clean_arrays_prep', 150),
  ('achievement', 'nohint_arrays_prep', 75),
  ('achievement', 'clean_oop_prep', 150),
  ('achievement', 'nohint_oop_prep', 75),
  ('achievement', 'clean_inheritance', 150),
  ('achievement', 'nohint_inheritance', 75),
  ('achievement', 'clean_interfaces', 150),
  ('achievement', 'nohint_interfaces', 75),
  ('achievement', 'clean_strings', 150),
  ('achievement', 'nohint_strings', 75),
  ('achievement', 'clean_exceptions', 150),
  ('achievement', 'nohint_exceptions', 75),
  ('achievement', 'clean_collections', 150),
  ('achievement', 'nohint_collections', 75),
  ('achievement', 'clean_generics', 150),
  ('achievement', 'nohint_generics', 75),
  ('achievement', 'clean_streams', 150),
  ('achievement', 'nohint_streams', 75),
  ('achievement', 'clean_files', 150),
  ('achievement', 'nohint_files', 75),
  ('achievement', 'clean_algorithms', 150),
  ('achievement', 'nohint_algorithms', 75),
  ('achievement', 'clean_threads', 150),
  ('achievement', 'nohint_threads', 75),
  ('achievement', 'clean_project', 150),
  ('achievement', 'nohint_project', 75),
  ('achievement', 'first_var', 25),
  ('achievement', 'builder_5', 25),
  ('achievement', 'builder_10', 25),
  ('achievement', 'builder_20', 75),
  ('achievement', 'builder_35', 150),
  ('achievement', 'builder_50', 300),
  ('achievement', 'precision_3', 25),
  ('achievement', 'precision_10', 75),
  ('achievement', 'precision_25', 150),
  ('achievement', 'precision_50', 300),
  ('achievement', 'solo_5', 25),
  ('achievement', 'solo_15', 75),
  ('achievement', 'solo_30', 150),
  ('achievement', 'solo_60', 300),
  ('achievement', 'division_safe', 25),
  ('achievement', 'input_master', 25),
  ('achievement', 'zero_shield', 75),
  ('achievement', 'stack_safe', 75),
  ('achievement', 'comeback', 75),
  ('achievement', 'flawless_quest', 300),
  ('achievement', 'exam_challenger', 75),
  ('achievement', 'honors_3', 25),
  ('achievement', 'honors_10', 75),
  ('achievement', 'honors_25', 150),
  ('achievement', 'honors_50', 300),
  ('achievement', 'streak_master', 25),
  ('achievement', 'sniper_5', 75),
  ('achievement', 'sniper_10', 150),
  ('achievement', 'sniper_20', 300),
  ('achievement', 'days_3', 25),
  ('achievement', 'days_7', 75),
  ('achievement', 'days_14', 75),
  ('achievement', 'days_30', 150),
  ('achievement', 'days_60', 300),
  ('achievement', 'daily_1', 25),
  ('achievement', 'daily_10', 75),
  ('achievement', 'daily_30', 150),
  ('achievement', 'daily_100', 300),
  ('achievement', 'chest_first', 25),
  ('achievement', 'erudite_5', 25),
  ('achievement', 'erudite_20', 75),
  ('achievement', 'erudite_50', 150),
  ('achievement', 'erudite_100', 300),
  ('achievement', 'tester_25', 25),
  ('achievement', 'tester_100', 75),
  ('achievement', 'tester_300', 150),
  ('achievement', 'tester_1000', 300),
  ('achievement', 'mentor_first', 25),
  ('achievement', 'path_75', 75),
  ('achievement', 'path_100', 150),
  ('achievement', 'path_150', 150),
  ('achievement', 'path_200', 300),
  ('achievement', 'ascent_10', 25),
  ('achievement', 'ascent_50', 75),
  ('achievement', 'ascent_100', 150),
  ('achievement', 'ascent_250', 150),
  ('achievement', 'ascent_500', 300),
  ('achievement', 'summit', 300),
  ('achievement', 'fighter_5', 25),
  ('achievement', 'fighter_20', 75),
  ('achievement', 'fighter_50', 150),
  ('achievement', 'curious_10', 75),
  ('achievement', 'curious_50', 150),
  ('achievement', 'weekend_coder', 75),
  ('achievement', 'egg_phonk', 75),
  ('achievement', 'egg_cafebabe', 150),
  ('achievement', 'hello_world', 25),
  ('achievement', 'night_owl', 75),
  ('achievement', 'early_bird', 75),
  ('achievement', 'lightning', 150),
  ('achievement', 'answer_42', 75),
  ('achievement', 'friday_13', 150),
  ('achievement', 'new_year', 75),
  ('achievement', 'grp_clean_kt1', 150),
  ('achievement', 'grp_nohint_kt1', 75),
  ('achievement', 'grp_sprint_kt1', 25),
  ('achievement', 'grp_clean_kt2', 150),
  ('achievement', 'grp_nohint_kt2', 75),
  ('achievement', 'grp_sprint_kt2', 25),
  ('achievement', 'grp_clean_kt3', 150),
  ('achievement', 'grp_nohint_kt3', 75),
  ('achievement', 'grp_sprint_kt3', 25),
  ('achievement', 'grp_first', 25),
  ('achievement', 'grp_tasks_5', 25),
  ('achievement', 'grp_tasks_15', 75),
  ('achievement', 'grp_tasks_30', 150),
  ('achievement', 'grp_tasks_50', 300),
  ('achievement', 'grp_all', 300),
  ('daily', 'pass_one', 30),
  ('daily', 'quiz_two', 20),
  ('daily', 'run_three', 20),
  ('daily', 'check_three', 20),
  ('daily', 'mentor_one', 20),
  ('daily', 'first_try', 40),
  ('daily', 'no_hint', 40),
  ('daily', 'duel_good', 40),
  ('daily', 'run_input', 30),
  ('daily', 'pass_three', 60),
  ('daily', 'duel_five', 60),
  ('daily', 'kt_task', 60),
  ('daily', 'chest', 30)
on conflict (kind, id) do update set xp = excluded.xp, synced_at = now();

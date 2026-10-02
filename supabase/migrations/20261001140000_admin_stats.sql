-- Java-Zero: статистика для вкладки «Обзор» в админке.
-- Выполнить в Supabase → SQL Editor после 20261001120000_admin_core.sql: функции проверяют права через
-- public.is_admin() и считают этапы по каталогу public.xp_catalog оттуда. От 20261001130000_group_access.sql не зависит.
-- Повторный запуск безопасен. Таблицы не меняются, только функции чтения.

-- ——— Служебное: следы активности и часовой пояс ———
-- Истории посещений в базе нет, поэтому «активен в день» — любой след в этот день: начал или сдал этап,
-- сохранил код (updated_at), получил достижение, закрыл квест дня. Время пишет браузер студента,
-- поэтому следы из будущего не считаются
create or replace function public.admin_stats_events()
returns table (user_id uuid, at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select e.user_id, e.at
  from (
    select sp.user_id, sp.started_at as at from public.stage_progress sp
    union all
    select sp.user_id, sp.passed_at from public.stage_progress sp
    union all
    select sp.user_id, sp.updated_at from public.stage_progress sp
    union all
    select a.user_id, a.unlocked_at from public.achievements a
    union all
    select dq.user_id, dq.completed_at from public.daily_quests dq
  ) e
  where e.at is not null and e.at <= now() + interval '1 hour';
$$;

-- Этапы, которые есть в курсе: строки с выдуманными id в статистику не попадают (каталог — admin_core.sql)
create or replace function public.admin_stats_stages()
returns setof public.stage_progress
language sql
stable
security definer
set search_path = ''
as $$
  select sp.*
  from public.stage_progress sp
  where exists (
    select 1 from public.xp_catalog c where c.kind = 'stage' and c.id = sp.quest_id || '/' || sp.stage_id
  );
$$;

-- Часовой пояс приходит из браузера админа; незнакомое имя — UTC
create or replace function public.admin_stats_tz(p_tz text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select n.name from pg_catalog.pg_timezone_names n where n.name = p_tz limit 1), 'UTC');
$$;

-- Служебные функции вызываются только изнутри админских: напрямую они отдали бы всю активность без проверки прав
revoke all on function public.admin_stats_events() from public, anon, authenticated;
revoke all on function public.admin_stats_stages() from public, anon, authenticated;
revoke all on function public.admin_stats_tz(text) from public, anon, authenticated;

-- ——— Сводка: плитки над графиками ———
-- Окна скользящие: последние p_days дней и столько же до них, чтобы показать изменение
create or replace function public.admin_overview(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_days integer := greatest(1, least(coalesce(p_days, 30), 366));
  v_now timestamptz := now();
  v_from timestamptz := now() - make_interval(days => v_days);
  v_prev timestamptz := now() - make_interval(days => 2 * v_days);
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return (
    with ev as (select * from public.admin_stats_events()),
    st as (select * from public.admin_stats_stages())
    select jsonb_build_object(
      'days', v_days,
      'students', (select count(*) from public.profiles),
      'signups', (select count(*) from public.profiles p where p.created_at >= v_from),
      'signups_prev', (select count(*) from public.profiles p where p.created_at >= v_prev and p.created_at < v_from),
      'active', (select count(distinct ev.user_id) from ev where ev.at >= v_from),
      'active_prev', (select count(distinct ev.user_id) from ev where ev.at >= v_prev and ev.at < v_from),
      'active_day', (select count(distinct ev.user_id) from ev where ev.at >= v_now - interval '1 day'),
      'learners', (select count(distinct st.user_id) from st where st.passed_at is not null),
      'stages_passed', (select count(*) from st where st.passed_at is not null),
      'stages_passed_period', (select count(*) from st where st.passed_at >= v_from),
      'stages_passed_prev', (select count(*) from st where st.passed_at >= v_prev and st.passed_at < v_from),
      'generated_at', v_now
    )
  );
end;
$$;

-- ——— Активность по дням или неделям ———
-- Строка на каждый день (или неделю с понедельника) периода, включая пустые: на графике нет дыр.
-- Дни считаются в часовом поясе админа
create or replace function public.admin_activity(
  p_days integer default 30,
  p_bucket text default 'day',
  p_tz text default 'UTC'
)
returns table (bucket date, signups bigint, active bigint, passed bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_days integer := greatest(1, least(coalesce(p_days, 30), 366));
  v_week boolean := p_bucket = 'week';
  v_tz text := public.admin_stats_tz(p_tz);
  v_today date := (now() at time zone public.admin_stats_tz(p_tz))::date;
  v_first date;
  v_from timestamptz;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  v_first := v_today - (v_days - 1);
  if v_week then
    v_first := date_trunc('week', v_first)::date;
  end if;
  -- Полночь первого дня по часам админа
  v_from := v_first::timestamp at time zone v_tz;

  return query
  with
    ev as (
      select e.user_id, (e.at at time zone v_tz)::date as d
      from public.admin_stats_events() e
      where e.at >= v_from
    ),
    act as (
      select case when v_week then date_trunc('week', ev.d::timestamp)::date else ev.d end as bk, count(distinct ev.user_id) as n
      from ev
      group by 1
    ),
    reg as (
      select (p.created_at at time zone v_tz)::date as d
      from public.profiles p
      where p.created_at >= v_from
    ),
    reg_n as (
      select case when v_week then date_trunc('week', reg.d::timestamp)::date else reg.d end as bk, count(*) as n
      from reg
      group by 1
    ),
    done as (
      select (st.passed_at at time zone v_tz)::date as d
      from public.admin_stats_stages() st
      where st.passed_at >= v_from and st.passed_at <= now() + interval '1 hour'
    ),
    done_n as (
      select case when v_week then date_trunc('week', done.d::timestamp)::date else done.d end as bk, count(*) as n
      from done
      group by 1
    ),
    b as (
      select gs::date as bk
      from generate_series(v_first::timestamp, v_today::timestamp, case when v_week then interval '1 week' else interval '1 day' end) gs
    )
  select b.bk, coalesce(reg_n.n, 0)::bigint, coalesce(act.n, 0)::bigint, coalesce(done_n.n, 0)::bigint
  from b
  left join reg_n on reg_n.bk = b.bk
  left join act on act.bk = b.bk
  left join done_n on done_n.bk = b.bk
  order by b.bk;
end;
$$;

-- ——— Воронка по этапам ———
-- reached — открыли этап (есть строка прогресса), passed — сдали.
-- Последний этап, который студент трогал, показывает, где он сейчас: here_now — был активен за p_idle_days дней;
-- stuck — давно не заходил и этап не сдал (застрял здесь); left_after — сдал этот этап и больше не появлялся.
-- Порядок этапов знает сайт (содержимое курса в git), функция отдаёт строки без порядка
create or replace function public.admin_funnel(p_idle_days integer default 14)
returns table (
  quest_id text,
  stage_id text,
  reached bigint,
  passed bigint,
  here_now bigint,
  stuck bigint,
  left_after bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_idle timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_idle_days, 14), 365)));
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with
    st as (select * from public.admin_stats_stages()),
    last_stage as (
      select distinct on (st.user_id) st.user_id, st.quest_id as q, st.stage_id as s
      from st
      order by st.user_id, greatest(st.updated_at, coalesce(st.passed_at, st.updated_at)) desc
    ),
    last_seen as (
      select e.user_id, max(e.at) as at from public.admin_stats_events() e group by e.user_id
    )
  select
    st.quest_id,
    st.stage_id,
    count(*)::bigint,
    count(*) filter (where st.passed_at is not null)::bigint,
    count(*) filter (where ls.user_id is not null and seen.at >= v_idle)::bigint,
    count(*) filter (where ls.user_id is not null and seen.at < v_idle and st.passed_at is null)::bigint,
    count(*) filter (where ls.user_id is not null and seen.at < v_idle and st.passed_at is not null)::bigint
  from st
  left join last_stage ls on ls.user_id = st.user_id and ls.q = st.quest_id and ls.s = st.stage_id
  left join last_seen seen on seen.user_id = st.user_id
  group by st.quest_id, st.stage_id;
end;
$$;

-- ——— Самые трудные этапы ———
-- По среднему числу неудачных проверок среди открывших этап; при равенстве выше тот, где меньше сдали.
-- fails пишет браузер, поэтому одна строка весит не больше 100 неудач. attempts — разные варианты кода (до 20).
-- Этапы, которые открыли меньше p_min_students учеников, не показываются: два человека — ещё не статистика
create or replace function public.admin_hard_stages(p_limit integer default 10, p_min_students integer default 3)
returns table (
  quest_id text,
  stage_id text,
  students bigint,
  passed bigint,
  fails_total bigint,
  fails_avg numeric,
  attempts_avg numeric,
  hint_used bigint,
  solution_viewed bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    st.quest_id,
    st.stage_id,
    count(*)::bigint,
    count(*) filter (where st.passed_at is not null)::bigint,
    sum(least(st.fails, 100))::bigint,
    round(avg(least(st.fails, 100)), 1),
    round(avg(cardinality(st.attempts)), 1),
    count(*) filter (where st.hint_used)::bigint,
    count(*) filter (where st.solution_viewed)::bigint
  from public.admin_stats_stages() st
  group by st.quest_id, st.stage_id
  having count(*) >= greatest(1, coalesce(p_min_students, 3))
  order by
    avg(least(st.fails, 100)) desc,
    count(*) filter (where st.passed_at is not null)::numeric / count(*) asc,
    st.quest_id,
    st.stage_id
  limit greatest(1, least(coalesce(p_limit, 10), 50));
end;
$$;

-- Вызывать может только вошедший; права админа функции проверяют сами
revoke all on function public.admin_overview(integer) from public, anon;
revoke all on function public.admin_activity(integer, text, text) from public, anon;
revoke all on function public.admin_funnel(integer) from public, anon;
revoke all on function public.admin_hard_stages(integer, integer) from public, anon;
grant execute on function public.admin_overview(integer) to authenticated;
grant execute on function public.admin_activity(integer, text, text) to authenticated;
grant execute on function public.admin_funnel(integer) to authenticated;
grant execute on function public.admin_hard_stages(integer, integer) to authenticated;

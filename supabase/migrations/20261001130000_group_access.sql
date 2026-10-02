-- Java-Zero: раздел «Группа» закрыт по-настоящему.
-- Выполнить в Supabase → SQL Editor после 20261001120000_admin_core.sql: нужна public.is_admin(). Повторный запуск безопасен.
--
-- Что меняется:
-- 1. group_members — кто в группе: вошёл по ссылке-приглашению (invite), добавлен админом (admin)
--    или был участником до этой миграции (legacy).
-- 2. group_settings — код ссылки-приглашения. Он хранится только в базе: ни в git, ни в коде сайта его нет.
--    При первом запуске код случайный, прежний код из content/group.yaml больше не действует.
--    Новую ссылку админ берёт во вкладке «Группа» админки (или: select invite_code from public.group_settings).
-- 3. join_group(code) — вход по ссылке; is_group_member() — сайт узнаёт, участник ли студент.
--    Задания КТ сервер сайта отдаёт только участникам и админам (app/api/group/*).
-- 4. admin_group_* — участники, выдача и отзыв доступа, смена кода, прогресс группы по КТ.
-- 5. Перенос: кто уже вошёл по старой ссылке (profiles.stats.group) или сдавал задания КТ, остаётся в группе.

-- ——— 1. Участники ———
-- Ни одной политики: таблицу читают функции ниже и сервер сайта секретным ключом
create table if not exists public.group_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  source text not null check (source in ('invite', 'admin', 'legacy')),
  added_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.group_members enable row level security;
revoke all on public.group_members from anon, authenticated;

-- ——— 2. Код приглашения ———
-- Одна строка (id = true). Код: латиница в нижнем регистре и цифры, от 6 до 32 символов
create table if not exists public.group_settings (
  id boolean primary key default true check (id),
  invite_code text not null check (invite_code ~ '^[a-z0-9]{6,32}$'),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.group_settings enable row level security;
revoke all on public.group_settings from anon, authenticated;

-- Случайный код из 10 символов: gen_random_uuid берёт криптостойкий генератор
create or replace function public.group_random_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select left(replace(pg_catalog.gen_random_uuid()::text, '-', ''), 10);
$$;
revoke all on function public.group_random_code() from public, anon, authenticated;

insert into public.group_settings (id, invite_code)
values (true, public.group_random_code())
on conflict (id) do nothing;

-- ——— 3. Вход по ссылке и проверка участника ———
-- Участник ли студент. Чужой статус видит только админ: остальным ответ false, а не правда о другом человеке
create or replace function public.is_group_member(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user is not null
    and (p_user = (select auth.uid()) or public.is_admin())
    and exists (select 1 from public.group_members m where m.user_id = p_user);
$$;
revoke all on function public.is_group_member(uuid) from public, anon;
grant execute on function public.is_group_member(uuid) to authenticated;

-- Вход по ссылке-приглашению. true — студент в группе (или уже был в ней), false — код не подошёл
create or replace function public.join_group(p_code text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if not exists (
    select 1 from public.group_settings s where s.invite_code = lower(trim(coalesce(p_code, '')))
  ) then
    return false;
  end if;
  insert into public.group_members (user_id, source) values (me, 'invite') on conflict (user_id) do nothing;
  return true;
end;
$$;
revoke all on function public.join_group(text) from public, anon;
grant execute on function public.join_group(text) to authenticated;

-- ——— 4. Админка: вкладка «Группа» ———
-- Участники с профилем и тем, кто их добавил
create or replace function public.admin_group_members()
returns table (
  user_id uuid,
  handle text,
  display_name text,
  avatar_url text,
  source text,
  added_by_handle text,
  joined_at timestamptz
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
  select m.user_id, p.handle, p.display_name, p.avatar_url, m.source, a.handle, m.created_at
  from public.group_members m
  left join public.profiles p on p.id = m.user_id
  left join public.profiles a on a.id = m.added_by
  order by p.handle nulls last, m.created_at;
end;
$$;
revoke all on function public.admin_group_members() from public, anon;
grant execute on function public.admin_group_members() to authenticated;

-- Выдать доступ по нику (можно с @). Возвращает id студента; ника нет — ошибка P0002
create or replace function public.admin_group_grant(p_handle text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select p.id into target from public.profiles p where p.handle = lower(ltrim(trim(coalesce(p_handle, '')), '@'));
  if target is null then
    raise exception 'user not found' using errcode = 'P0002';
  end if;
  insert into public.group_members (user_id, source, added_by)
  values (target, 'admin', (select auth.uid()))
  on conflict (user_id) do nothing;
  return target;
end;
$$;
revoke all on function public.admin_group_grant(text) from public, anon;
grant execute on function public.admin_group_grant(text) to authenticated;

-- Забрать доступ. Прогресс студента остаётся: вернёшь доступ — сданное на месте
create or replace function public.admin_group_revoke(p_user uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  delete from public.group_members where user_id = p_user;
end;
$$;
revoke all on function public.admin_group_revoke(uuid) from public, anon;
grant execute on function public.admin_group_revoke(uuid) to authenticated;

-- Текущий код ссылки-приглашения
create or replace function public.admin_group_invite()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return (select s.invite_code from public.group_settings s where s.id);
end;
$$;
revoke all on function public.admin_group_invite() from public, anon;
grant execute on function public.admin_group_invite() to authenticated;

-- Сменить код: свой (латиница и цифры, 6–32 символа) или, без аргумента, случайный.
-- Старая ссылка перестаёт пускать новых людей, кто уже в группе — остаётся
create or replace function public.admin_group_set_invite(p_code text default null)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  code text := lower(trim(coalesce(p_code, '')));
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if code = '' then
    code := public.group_random_code();
  elsif code !~ '^[a-z0-9]{6,32}$' then
    raise exception 'invalid invite code' using errcode = '22023';
  end if;
  insert into public.group_settings (id, invite_code, updated_by, updated_at)
  values (true, code, (select auth.uid()), now())
  on conflict (id) do update
    set invite_code = excluded.invite_code, updated_by = excluded.updated_by, updated_at = excluded.updated_at;
  return code;
end;
$$;
revoke all on function public.admin_group_set_invite(text) from public, anon;
grant execute on function public.admin_group_set_invite(text) to authenticated;

-- Прогресс участников по квестам КТ (id квестов передаёт админка из курса): кто что сдал, сколько было
-- разных попыток кода и проваленных проверок, когда начал и когда сдал
create or replace function public.admin_group_progress(p_quests text[])
returns table (
  user_id uuid,
  quest_id text,
  stage_id text,
  started_at timestamptz,
  passed_at timestamptz,
  attempts integer,
  fails integer,
  hint_used boolean,
  solution_viewed boolean,
  updated_at timestamptz
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
  if cardinality(p_quests) > 20 then
    raise exception 'too many quests' using errcode = '22023';
  end if;
  return query
  select sp.user_id, sp.quest_id, sp.stage_id, sp.started_at, sp.passed_at, cardinality(sp.attempts), sp.fails,
    sp.hint_used, sp.solution_viewed, sp.updated_at
  from public.stage_progress sp
  join public.group_members m on m.user_id = sp.user_id
  where sp.quest_id = any (p_quests)
  order by sp.user_id, sp.quest_id, sp.stage_id;
end;
$$;
revoke all on function public.admin_group_progress(text[]) from public, anon;
grant execute on function public.admin_group_progress(text[]) to authenticated;

-- ——— 5. Перенос участников ———
-- До этой миграции участником считался тот, у кого в профиле отметка stats.group (вошёл по старой ссылке)
-- или кто сдавал задания КТ. Они остаются в группе и снова приглашение не ищут.
-- Дальше в группу попадают только по ссылке или через админа: сданный этап КТ доступ больше не даёт
insert into public.group_members (user_id, source)
select p.id, 'legacy'
from public.profiles p
where case when jsonb_typeof(p.stats -> 'group') = 'number' then (p.stats ->> 'group')::numeric > 0 else false end
union
select distinct sp.user_id, 'legacy'
from public.stage_progress sp
where sp.quest_id ~ '^kt[0-9]+$' and sp.passed_at is not null
on conflict (user_id) do nothing;

-- Java-Zero: профили открыты по умолчанию, у каждого сразу есть ник, в таблице лидеров — все.
-- Выполнить в Supabase → SQL Editor после 20260928120000_user_xp_limit.sql. Повторный запуск безопасен.
--
-- Что меняется:
-- 1. is_public по умолчанию true, текущие профили становятся открытыми. Скрыть профиль можно в настройках.
-- 2. Ник выдаётся при регистрации: из формы регистрации (raw_user_meta_data.handle), иначе из логина GitHub,
--    имени Google или Яндекса. Кириллица переводится в латиницу, занятый ник получает суффикс из цифр.
--    Почта для ника и имени не используется: профиль открыт, и часть адреса до @ оказалась бы на виду.
-- 3. Всем, у кого ника ещё нет, он выдаётся сразу.
-- 4. Таблица лидеров показывает всех. Скрытый профиль прячет статистику, витрину, титул и достижения,
--    но страница /u/ник у него есть: имя, аватар и уровень.

-- ——— 1. Открытые профили по умолчанию ———
alter table public.profiles alter column is_public set default true;
update public.profiles set is_public = true where not is_public;

-- ——— 2. Ник из имени ———
-- Латиница, цифры и «_», от 3 до 20 символов, свободный. Основа — до 15 символов, чтобы влез суффикс «_1234»
create or replace function public.make_handle(p_base text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  slug text := lower(coalesce(p_base, ''));
  candidate text;
  tries int := 0;
begin
  slug := replace(slug, 'щ', 'shch');
  slug := replace(slug, 'ж', 'zh');
  slug := replace(slug, 'ч', 'ch');
  slug := replace(slug, 'ш', 'sh');
  slug := replace(slug, 'ю', 'yu');
  slug := replace(slug, 'я', 'ya');
  slug := replace(slug, 'ё', 'yo');
  slug := replace(slug, 'х', 'kh');
  slug := replace(slug, 'ц', 'ts');
  slug := translate(slug, 'абвгдезийклмнопрстуфыэъь', 'abvgdeziyklmnoprstufye');
  slug := regexp_replace(slug, '[^a-z0-9]+', '_', 'g');
  slug := trim(both '_' from left(trim(both '_' from slug), 15));
  if length(slug) < 3 then
    slug := 'student';
  end if;

  candidate := slug;
  while exists (select 1 from public.profiles where handle = candidate) loop
    tries := tries + 1;
    candidate := case
      when tries <= 20 then slug || '_' || (1000 + floor(random() * 9000))::int
      else 'student_' || substr(md5(random()::text), 1, 8)
    end;
  end loop;
  return candidate;
end;
$$;

-- Вызывают только триггер и бэкфилл ниже. Supabase по умолчанию выдаёт право вызова anon и authenticated
revoke all on function public.make_handle(text) from public;
revoke all on function public.make_handle(text) from anon, authenticated;

-- ——— Профиль при регистрации: ник и имя сразу ———
create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wanted text := lower(trim(meta ->> 'handle'));
  shown text := left(coalesce(meta ->> 'full_name', meta ->> 'name', meta ->> 'user_name'), 80);
  base text := coalesce(wanted, meta ->> 'user_name', meta ->> 'full_name', meta ->> 'name');
  nick text;
  tries int := 0;
begin
  if wanted ~ '^[a-z0-9_]{3,20}$' and not exists (select 1 from public.profiles where handle = wanted) then
    nick := wanted;
  else
    nick := public.make_handle(base);
  end if;

  -- Два студента могут одновременно занять один ник: тогда повторяем с суффиксом, а регистрация не падает
  loop
    begin
      insert into public.profiles (id, display_name, avatar_url, handle, is_public)
      values (new.id, coalesce(shown, nick), left(meta ->> 'avatar_url', 500), nick, true)
      on conflict (id) do nothing;
      return new;
    exception when unique_violation then
      tries := tries + 1;
      if tries > 5 then
        raise;
      end if;
      nick := public.make_handle(base);
    end;
  end loop;
end;
$$;

-- ——— 3. Ники тем, у кого их нет ———
-- Прежний триггер ставил в имя часть почты до @, если имени не было. Такое имя в открытом профиле
-- выдало бы адрес, поэтому оно заменяется ником и основой ника не служит
do $$
declare
  r record;
  nick text;
begin
  for r in
    select
      p.id,
      p.display_name = split_part(coalesce(u.email, ''), '@', 1) as name_from_email,
      coalesce(u.raw_user_meta_data ->> 'user_name', p.display_name) as base
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.handle is null
    order by p.created_at
  loop
    nick := public.make_handle(case when r.name_from_email then null else r.base end);
    update public.profiles
    set handle = nick,
        display_name = case when r.name_from_email then nick else display_name end
    where id = r.id;
  end loop;
end;
$$;

-- ——— 4. Публичный профиль: у скрытого только имя, аватар, оформление и уровень ———
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
    'is_public', p.is_public,
    -- Титул выдаётся за квесты и достижения, поэтому у скрытого профиля его тоже не видно
    'title', case when p.is_public then p.title end,
    'showcase', case when p.is_public then p.showcase else '{}'::text[] end,
    'xp_total', public.user_xp(p.id),
    'stages_passed', case when p.is_public then (
      select count(*) from public.stage_progress sp where sp.user_id = p.id and sp.passed_at is not null
    ) end,
    'streak_days', case when p.is_public then p.streak_days end,
    'best_streak', case when p.is_public then p.best_streak end,
    'created_at', p.created_at,
    'achievements', case when p.is_public then coalesce(
      (select jsonb_agg(jsonb_build_object('id', a.achievement_id, 'at', a.unlocked_at) order by a.unlocked_at desc)
       from public.achievements a where a.user_id = p.id),
      '[]'::jsonb
    ) else '[]'::jsonb end
  )
  from public.profiles p
  where p.handle = p_handle;
$$;

-- Таблица лидеров: все студенты с опытом за период. is_public подсказывает сайту, что профиль скрыт
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
  ) t
  where t.xp > 0
  order by t.xp desc, t.handle
  limit 50;
$$;

revoke all on function public.get_public_profile(text) from public;
revoke all on function public.leaderboard(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;
grant execute on function public.leaderboard(text) to anon, authenticated;

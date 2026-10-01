-- Java-Zero: лимит достижений в опыте таблицы лидеров и закрытый прямой вызов user_xp.
-- Выполнить в Supabase → SQL Editor после 20260927120000_profile.sql. Повторный запуск безопасен.

-- В каталоге уже больше 100 достижений (110 у участника раздела «Группа»), и он растёт вместе с курсом:
-- знаки по каждому квесту и каждой КТ. Потолок 100 срезал бы честный опыт, поднимаем до 250.
-- Остальные потолки прежние: 400 этапов, 4 записи квестов дня за день
create or replace function public.user_xp(p_user uuid, p_since timestamptz default '-infinity')
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((
      select sum(xp) from (
        select xp from public.stage_progress
        where user_id = p_user and passed_at is not null and passed_at >= p_since
        order by passed_at limit 400
      ) s
    ), 0)
    + coalesce((
      select sum(xp) from (
        select xp from public.achievements
        where user_id = p_user and unlocked_at >= p_since
        order by unlocked_at limit 250
      ) a
    ), 0)
    + coalesce((
      select sum(xp) from (
        select xp, row_number() over (partition by day order by completed_at) as n
        from public.daily_quests
        where user_id = p_user and completed_at >= p_since
      ) d
      where d.n <= 4
    ), 0);
$$;

-- user_xp нужна только get_public_profile и leaderboard: они security definer и вызывают её от имени владельца.
-- Supabase по умолчанию выдаёт право вызова ролям anon и authenticated, а revoke from public его не снимает:
-- без этих строк опыт любого студента, даже со скрытым профилем, можно было узнать по его id
revoke all on function public.user_xp(uuid, timestamptz) from public;
revoke all on function public.user_xp(uuid, timestamptz) from anon, authenticated;

# Аккаунты: настройка Supabase

Без Supabase сайт работает полностью, прогресс хранится в браузере. Аккаунты включаются, когда заданы две переменные окружения.

Проект: `https://klnxcvkswjcidsivxlek.supabase.co`

## 1. Таблицы (один раз)

1. Supabase → **SQL Editor** → **New query**.
2. Вставь целиком файл `supabase/migrations/20260924120000_progress.sql` и нажми **Run**.
3. Проверка: **Table Editor** показывает `profiles`, `stage_progress`, `achievements`, у каждой значок RLS включён.

Что делает миграция: три таблицы, профиль создаётся сам при регистрации, каждый пользователь видит и меняет только свои строки.

### Обновление: опыт, квесты дня, редкость достижений

Выполни **до** выкатки версии с уровнями, иначе синхронизация прогресса будет падать с ошибкой «column xp does not exist».

1. Supabase → **SQL Editor** → **New query**.
2. Вставь целиком `supabase/migrations/20260926120000_gamification.sql` и нажми **Run**. Скрипт можно запускать повторно: он ничего не сломает.
3. Проверка:
   - **Table Editor** показывает новую таблицу `daily_quests` со значком RLS;
   - у `stage_progress` и `achievements` появилась колонка `xp`, у `profiles` — `stats`;
   - в **Database → Functions** есть `achievement_rarity`.

Что меняется: опыт этапов и достижений хранится в строках, выполненные квесты дня синхронизируются между устройствами. Функция `achievement_rarity` отдаёт только числа «у скольких студентов есть достижение», чужие строки она не показывает.

### Обновление: профиль, публичная страница, таблица лидеров

Выполни **после** предыдущего скрипта и **до** выкатки версии с профилем.

1. Supabase → **SQL Editor** → **New query**.
2. Вставь целиком `supabase/migrations/20260927120000_profile.sql` и нажми **Run**. Запускать повторно можно.
3. Проверка:
   - у `profiles` появились колонки `handle`, `bio`, `accent`, `frame`, `banner`, `is_public`, `xp_total`;
   - в **Storage** есть бакет `profile-media` с пометкой Public;
   - в **Database → Functions** есть `handle_available`, `get_public_profile`, `leaderboard`.

Что меняется:
- Студент задаёт ник и сам решает, открыть ли профиль. По умолчанию профиль закрыт.
- Чужой профиль читается только через `get_public_profile`: функция отдаёт поля для показа и только открытые профили. Таблицы по-прежнему закрыты RLS.
- Таблица лидеров считает опыт по строкам этапов, достижений и квестов дня: у каждой строки есть потолок, поэтому накрутить одной записью нельзя.
- Картинки лежат в бакете `profile-media`. Писать можно только в свою папку `uid/`, размер до 2 МБ, форматы WebP, PNG и JPEG. Сайт сам сжимает картинку перед загрузкой.

## 2. Адреса возврата

**Authentication → URL Configuration**:

- **Site URL**: `https://java-zero.onrender.com`
- **Redirect URLs** (каждый адрес отдельной строкой):
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3200/auth/callback`
  - `https://java-zero.onrender.com/auth/callback`
  - адрес превью на Render + `/auth/callback`, например `https://java-zero-next.onrender.com/auth/callback`

Без этого Supabase после входа вернёт на Site URL, а не на тот сайт, где начинали вход.

## 3. Вход по почте

Уже включён. Встроенная почта Supabase годится только для проверки: она отправляет письма лишь участникам команды проекта и не больше нескольких в час. Для студентов подключи свой SMTP: **Authentication → Emails → SMTP Settings** (например, Resend или Brevo, у обоих есть бесплатный тариф).

Ссылку из письма нужно открыть в том же браузере, где запрашивали вход: так работает защита PKCE.

## 4. GitHub (по желанию)

1. GitHub → Settings → Developer settings → **OAuth Apps** → New OAuth App.
   - Homepage URL: `https://java-zero.onrender.com`
   - Authorization callback URL: `https://klnxcvkswjcidsivxlek.supabase.co/auth/v1/callback`
2. Скопируй Client ID, создай Client secret.
3. Supabase → **Authentication → Sign In / Providers → GitHub**: включи, вставь оба значения, сохрани.

Кнопка «Войти через GitHub» появится на странице входа сама.

## 5. Google (по желанию)

1. Google Cloud Console → APIs & Services → **OAuth consent screen**: тип External, название Java-Zero.
2. **Credentials → Create credentials → OAuth client ID**, тип Web application.
   - Authorized redirect URIs: `https://klnxcvkswjcidsivxlek.supabase.co/auth/v1/callback`
3. Supabase → **Authentication → Sign In / Providers → Google**: включи, вставь Client ID и Client secret.

## 6. Переменные окружения

Локально — файл `.env.local` (см. `.env.example`). На Render — **Environment** сервиса:

```
NEXT_PUBLIC_SUPABASE_URL=https://klnxcvkswjcidsivxlek.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<публичный anon-ключ из Project Settings → API>
```

Переменные `NEXT_PUBLIC_*` попадают в код при сборке: после их изменения нужен новый деплой. Ключ `service_role` в приложение не кладём.

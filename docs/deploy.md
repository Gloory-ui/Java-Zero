# Превью v1.0 на Render

Превью собирается из ветки `next` отдельным сервисом. Боевой сайт `java-zero.onrender.com` (ветка `main`) не меняется до релиза.

## Создать сервис

Render → **New → Web Service** → репозиторий `Gloory-ui/Java-Zero`.

| Поле | Значение |
|---|---|
| Name | `java-zero-next` (адрес будет `https://java-zero-next.onrender.com`) |
| Branch | `next` |
| Runtime | Node |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Instance Type | Free |
| Health Check Path | `/` |
| Auto-Deploy | On Commit |

## Переменные окружения

**Environment** сервиса. `NEXT_PUBLIC_*` попадают в код при сборке: после изменения нужен **Manual Deploy → Clear build cache & deploy**.

| Переменная | Значение |
|---|---|
| `NODE_VERSION` | `22` |
| `NEXT_PUBLIC_SITE_URL` | `https://java-zero-next.onrender.com` |
| `SITE_INDEX` | `false` (превью закрыто от поиска) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://klnxcvkswjcidsivxlek.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | публичный anon-ключ из Supabase → Project Settings → API |
| `GEMINI_API_KEY` | ключ Gemini (тот же, что у старого сервера) |

Без Supabase-переменных сайт работает, но без аккаунтов. Без `GEMINI_API_KEY` ментор отвечает «пока не подключён».

## Supabase для превью

1. Если ещё не сделано — выполнить миграцию из [docs/supabase.md](supabase.md), шаг 1.
2. **Authentication → URL Configuration → Redirect URLs**: добавить `https://java-zero-next.onrender.com/auth/callback`.

## Что проверить на превью

- Главная, карта курса, справочник, профиль, 404 (`/lab.html` ведёт на `/course`).
- Этап: Java загружается около полуминуты (бесплатный сервер ещё и просыпается до минуты), затем «Проверить» отвечает за доли секунды.
- Ошибка компиляции подсвечивается в редакторе, бесконечный цикл останавливается за 3 секунды.
- Защита, звук, ачивки, AI-ментор.
- Вход по почте на свой адрес (встроенная почта Supabase шлёт только участникам проекта).
- Телефон: всё без горизонтальной прокрутки.

## Релиз (этап 9, после проверки превью)

Переключить боевой сервис на новую сборку (те же команды и переменные, `SITE_INDEX=true`, `NEXT_PUBLIC_SITE_URL=https://java-zero.onrender.com`), слить `next` в `main`, поставить тег `v1.0.0`, удалить старые `client/` и `server/`.

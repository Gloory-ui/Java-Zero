# Деплой на Render

Боевой сайт `https://java-zero.onrender.com` — сервис `Java-Zero` на Render. Он собирается из ветки, указанной в настройках сервиса, и выкатывается автоматически после каждого пуша в неё.

До версии 1.0 сервис собирался из `next`. С версии 1.0 ветка сайта — `main`, а `next` — рабочая ветка, куда вливаются задачи.

## Настройки сервиса

| Поле | Значение |
|---|---|
| Branch | `main` |
| Runtime | Node |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Instance Type | Free |
| Health Check Path | `/` |
| Auto-Deploy | On Commit |

## Переменные окружения

**Environment** сервиса. Переменные `NEXT_PUBLIC_*` попадают в код при сборке. После их изменения нужен **Manual Deploy → Clear build cache & deploy**.

| Переменная | Значение |
|---|---|
| `NODE_VERSION` | `22` |
| `NEXT_PUBLIC_SITE_URL` | `https://java-zero.onrender.com` |
| `SITE_INDEX` | `true` — сайт виден поисковикам, `false` — закрыт |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://klnxcvkswjcidsivxlek.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | публичный anon-ключ из Supabase → Project Settings → API |
| `GEMINI_API_KEY` | ключ Gemini |
| `SUPABASE_SERVICE_ROLE_KEY` | секретный ключ Supabase: вход по нику, проверка ника |
| `NEXT_PUBLIC_YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET` | приложение Яндекса для входа через Яндекс |

Без переменных Supabase сайт работает, но без аккаунтов. Без `GEMINI_API_KEY` ментор отвечает «пока не подключён». Настройка входа — почта, коды в письмах, Яндекс — в [docs/auth.md](auth.md).

## Supabase

1. Миграции из `supabase/migrations` выполняются в SQL Editor по порядку, подробно — в [docs/supabase.md](supabase.md).
2. **Authentication → URL Configuration**: Site URL — `https://java-zero.onrender.com`, в Redirect URLs — `https://java-zero.onrender.com/auth/callback`.

## Выпуск версии

1. Все проверки зелёные: `npm run check`, `npm run content:check`, `npm run build`, `CI=1 npm run test:e2e`.
2. `next` вливается в `main` через merge, на слиянии ставится тег `vX.Y.Z`, в `CHANGELOG.md` появляется раздел версии.
3. Пуш `main` и тега: Render сам соберёт и выкатит сайт.

## Что проверить после выкатки

- Главная, карта курса, справочник, профиль, 404 (`/lab.html` ведёт на `/course`).
- Этап: Java загружается около полуминуты (бесплатный сервер ещё и просыпается до минуты), затем «Проверить» отвечает за доли секунды.
- Раздел «Группа» по ссылке-приглашению из `content/group.yaml`.
- Вход, синхронизация прогресса, AI-ментор.
- Телефон: всё без горизонтальной прокрутки.

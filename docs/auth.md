# Вход и регистрация

Способы входа:
- **ник или почта + пароль** — регистрация с 6-значным кодом из письма;
- **GitHub** и **Google** — встроенные провайдеры Supabase;
- **Яндекс** — через наш сервер, в Supabase такого провайдера нет.

Пароли хранит Supabase Auth в виде хэша bcrypt, сайт их не видит и не хранит.

## 1. Supabase → Authentication

**Sign In / Providers → Email**
- Enable Email provider — включено.
- Confirm email — включено: без кода из письма аккаунт не активен.
- Minimum password length — `8`.
- Email OTP Length — `6`.

**Emails → SMTP Settings** — свой SMTP. Встроенная почта Supabase шлёт письма только участникам проекта. Для Gmail:
- Host: `smtp.gmail.com`, порт `465`;
- Username: полный адрес почты;
- Password: пароль приложения Google, а не обычный пароль. Создаётся на https://myaccount.google.com/apppasswords, нужна двухэтапная аутентификация.

**Emails → Templates** — код вместо ссылки. В шаблонах **Confirm signup** и **Reset Password** заменить `{{ .ConfirmationURL }}` на код:

```html
<h2>Java-Zero</h2>
<p>Твой код: <strong style="font-size:24px;letter-spacing:4px">{{ .Token }}</strong></p>
<p>Код действует час. Если это был не ты, просто удали письмо.</p>
```

**URL Configuration**
- Site URL — `https://java-zero.onrender.com`.
- Redirect URLs — `https://java-zero.onrender.com/auth/callback`.

**Rate Limits** — «Rate limit for sending emails» поднять, например до 100 в час, чтобы вся группа могла зарегистрироваться в один день. Вход по нику идёт с сервера сайта, поэтому «sign-ups and sign-ins» тоже стоит поднять, например до 100 за 5 минут.

## 2. Ключи на Render

**Environment** сервиса. Переменные `NEXT_PUBLIC_*` попадают в сборку: после их изменения нужен **Manual Deploy → Clear build cache & deploy**.

| Переменная | Где взять | Зачем |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` (или Secret key) | вход по нику и проверка «ник свободен». Только сервер, без `NEXT_PUBLIC_`, никому не показывать |
| `NEXT_PUBLIC_YANDEX_CLIENT_ID` | ClientID приложения Яндекса | кнопка «Яндекс» и начало входа |
| `YANDEX_CLIENT_SECRET` | Client secret приложения Яндекса | обмен кода Яндекса на вход. Только сервер |

Без `SUPABASE_SERVICE_ROLE_KEY` вход по почте работает, а по нику — нет: форма предложит войти по почте. Без ключей Яндекса кнопки «Яндекс» нет.

## 3. Приложение в Яндексе

1. Открыть https://oauth.yandex.ru/client/new и выбрать «Веб-сервисы».
2. Redirect URI: `https://java-zero.onrender.com/api/auth/yandex/callback`. Для разработки добавить ещё `http://localhost:3000/api/auth/yandex/callback`.
3. Доступы:
   - «Доступ к адресу электронной почты» — `login:email`;
   - «Доступ к логину, имени и фамилии, полу» — `login:info`;
   - «Доступ к портрету пользователя» — `login:avatar`.
4. ClientID и Client secret записать на Render, как в таблице выше.

## Как это устроено

- **Регистрация** — `supabase.auth.signUp`: ник, почта, пароль.
  - Ник уходит в данные аккаунта (`handle`, `user_name`), из них база ставит ник и имя профиля.
  - Письмо с кодом → `verifyOtp` → студент вошёл.
- **Проверка «ник свободен»** — `GET /api/auth/handle`, сервер смотрит профили секретным ключом.
- **Вход по почте** — браузер напрямую в Supabase.
- **Вход по нику** — `POST /api/auth/login`:
  - сервер находит почту по нику и входит паролем, браузер получает только сессию;
  - на «нет такого ника» и «неверный пароль» ответ одинаковый;
  - не больше 10 попыток за 15 минут с одного адреса и на один ник.
- **Забыл пароль** — код из письма (`type: recovery`), затем новый пароль.
- **Яндекс** — `/api/auth/yandex` → oauth.yandex.ru → `/api/auth/yandex/callback`:
  - state в httpOnly-куке защищает от подделанного возврата;
  - сервер получает у Яндекса подтверждённую почту, находит или создаёт аккаунт с этой почтой и отдаёт сессию во фрагменте адреса `/auth/yandex#…`;
  - страница сразу стирает фрагмент из адреса;
  - если аккаунт с этой почтой когда-то завели паролем и не подтвердили, его пароль сбрасывается: владелец почты — тот, кто вошёл через Яндекс.
- **Сессия** — access-токен на час и refresh-токен Supabase в localStorage браузера.

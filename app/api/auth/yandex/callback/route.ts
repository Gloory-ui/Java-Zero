import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { safeNext } from "@/lib/account/handle";
import {
  siteOrigin,
  YANDEX_INFO,
  YANDEX_STATE_COOKIE,
  YANDEX_TOKEN,
  type YandexInfo,
  yandexProfile,
} from "@/lib/account/yandex";
import { supabaseAdmin, supabaseAnon } from "@/lib/supabase/server";

// Возврат с Яндекса. Код обменивается на токен Яндекса, по нему сервер узнаёт подтверждённую почту, находит
// или создаёт аккаунт Supabase и сам же подтверждает одноразовую ссылку входа. В браузер уходит только сессия —
// во фрагменте адреса (#…), который не попадает на сервер и в журналы
export async function GET(request: NextRequest) {
  const origin = siteOrigin(request);
  const finish = (fragment: URLSearchParams) => {
    const response = NextResponse.redirect(`${origin}/auth/yandex#${fragment}`);
    response.cookies.set(YANDEX_STATE_COOKIE, "", { path: "/api/auth/yandex", maxAge: 0 });
    return response;
  };
  const fail = (message: string) => finish(new URLSearchParams({ error: message }));

  const params = request.nextUrl.searchParams;
  if (params.get("error")) {
    return fail(params.get("error") === "access_denied" ? "Вход через Яндекс отменён." : "Яндекс не разрешил вход.");
  }

  let saved: { state?: string; next?: string } = {};
  try {
    saved = JSON.parse(request.cookies.get(YANDEX_STATE_COOKIE)?.value ?? "{}");
  } catch {}
  const code = params.get("code");
  if (!code || !saved.state || params.get("state") !== saved.state) {
    return fail("Вход устарел или начат в другом браузере. Начни вход через Яндекс заново.");
  }

  const clientId = process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID;
  const secret = process.env.YANDEX_CLIENT_SECRET;
  const anon = supabaseAnon();
  if (!clientId || !secret || !supabaseAdmin || !anon) return fail("Вход через Яндекс пока не настроен.");

  // 1. Код → токен Яндекса
  const tokenResponse = await fetch(YANDEX_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, client_id: clientId, client_secret: secret }),
  });
  const token = (await tokenResponse.json().catch(() => ({}))) as { access_token?: string };
  if (!tokenResponse.ok || !token.access_token) return fail("Яндекс не подтвердил вход. Попробуй ещё раз.");

  // 2. Почта, имя и портрет
  const infoResponse = await fetch(YANDEX_INFO, { headers: { Authorization: `OAuth ${token.access_token}` } });
  const profile = infoResponse.ok ? yandexProfile((await infoResponse.json()) as YandexInfo) : null;
  if (!profile) return fail("В аккаунте Яндекса нет почты, а без неё войти нельзя.");

  // 3. Новый студент — аккаунт с уже подтверждённой почтой: её подтвердил Яндекс.
  // user_name — логин Яндекса: из него база делает ник, а не из почты
  const metadata = Object.fromEntries(
    Object.entries({
      full_name: profile.fullName,
      avatar_url: profile.avatarUrl,
      user_name: profile.login,
      provider: "yandex",
    }).filter(([, value]) => value),
  );
  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: profile.email,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (createError && !/already|exists|registered/i.test(createError.message)) {
    return fail("Не удалось создать аккаунт. Попробуй позже.");
  }

  // 4. Вход без письма: одноразовая ссылка, которую сервер тут же подтверждает
  const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: profile.email,
  });
  const tokenHash = link?.properties?.hashed_token;
  if (linkError || !tokenHash) return fail("Не удалось войти. Попробуй позже.");

  // Аккаунт с этой почтой кто-то завёл паролем, но не подтвердил почту. Хозяин почты — тот, кто вошёл через
  // Яндекс, поэтому чужой пароль сбрасываем: иначе автор заготовки получил бы доступ к аккаунту студента
  if (link.user && !link.user.email_confirmed_at) {
    await supabaseAdmin.auth.admin.updateUserById(link.user.id, {
      password: randomBytes(32).toString("base64url"),
      email_confirm: true,
    });
  }

  const { data, error } = await anon.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (error || !data.session) return fail("Не удалось войти. Попробуй позже.");

  return finish(
    new URLSearchParams({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      next: safeNext(saved.next),
    }),
  );
}

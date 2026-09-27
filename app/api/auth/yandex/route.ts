import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { safeNext } from "@/lib/account/handle";
import { siteOrigin, YANDEX_STATE_COOKIE, yandexAuthorizeUrl } from "@/lib/account/yandex";

// Начало входа через Яндекс: одноразовый state в httpOnly-куке и переход на oauth.yandex.ru
export function GET(request: NextRequest) {
  const origin = siteOrigin(request);
  const clientId = process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID;
  if (!clientId || !process.env.YANDEX_CLIENT_SECRET) {
    return NextResponse.redirect(
      `${origin}/auth/yandex#error=${encodeURIComponent("Вход через Яндекс пока не настроен.")}`,
    );
  }

  const state = randomBytes(24).toString("base64url");
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const response = NextResponse.redirect(yandexAuthorizeUrl(clientId, `${origin}/api/auth/yandex/callback`, state));
  response.cookies.set(YANDEX_STATE_COOKIE, JSON.stringify({ state, next }), {
    httpOnly: true,
    secure: origin.startsWith("https://"),
    sameSite: "lax",
    path: "/api/auth/yandex",
    maxAge: 600,
  });
  return response;
}

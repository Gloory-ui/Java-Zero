// Вход через Яндекс ID. В Supabase такого провайдера нет, поэтому OAuth идёт через наш сервер:
// /api/auth/yandex → oauth.yandex.ru → /api/auth/yandex/callback → сессия Supabase в браузере.
// Здесь чистые функции без сети, их проверяют юнит-тесты

export const YANDEX_AUTHORIZE = "https://oauth.yandex.ru/authorize";
export const YANDEX_TOKEN = "https://oauth.yandex.ru/token";
export const YANDEX_INFO = "https://login.yandex.ru/info?format=json";

/** Почта, имя, логин и портрет — ровно то, что нужно для аккаунта и профиля */
export const YANDEX_SCOPE = "login:email login:info login:avatar";

/** Кука с одноразовым state и адресом возврата: защищает callback от подделанного перехода */
export const YANDEX_STATE_COOKIE = "jz_yandex_state";

export function yandexAuthorizeUrl(clientId: string, redirectUri: string, state: string): string {
  const url = new URL(YANDEX_AUTHORIZE);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", YANDEX_SCOPE);
  url.searchParams.set("state", state);
  return url.toString();
}

/** Ответ login.yandex.ru/info: поля, которые мы используем */
export type YandexInfo = {
  id?: string;
  login?: string;
  default_email?: string;
  emails?: string[];
  real_name?: string;
  display_name?: string;
  default_avatar_id?: string;
  is_avatar_empty?: boolean;
};

export type YandexProfile = { email: string; fullName: string | null; login: string | null; avatarUrl: string | null };

/** Профиль для аккаунта Supabase. Без почты войти нельзя: по ней аккаунт Яндекса связывается с нашим */
export function yandexProfile(info: YandexInfo): YandexProfile | null {
  const email = (info.default_email ?? info.emails?.[0])?.trim().toLowerCase();
  if (!email) return null;
  const avatarUrl =
    info.default_avatar_id && !info.is_avatar_empty
      ? `https://avatars.yandex.net/get-yapic/${encodeURIComponent(info.default_avatar_id)}/islands-200`
      : null;
  return {
    email,
    fullName: info.real_name?.trim() || info.display_name?.trim() || null,
    login: info.login?.trim() || null,
    avatarUrl,
  };
}

/**
 * Адрес сайта для адреса возврата Яндекса. На боевом сайте — из NEXT_PUBLIC_SITE_URL: заголовкам запроса
 * доверять не стоит. Без настройки (локальная разработка) — как адрес видит браузер, с учётом прокси
 */
export function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return configured || publicOrigin(request);
}

/** Адрес сайта, как его видит студент: за прокси Render запрос приходит по http на внутренний адрес */
export function publicOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}`;
}

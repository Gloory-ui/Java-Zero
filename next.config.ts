import type { NextConfig } from "next";

// Заголовки безопасности для всех страниц. CSP пока только про встраивание, формы и плагины: правила для скриптов
// требуют отдельной проверки с движком Java (CheerpJ грузит код и wasm со своего CDN)
const SECURITY_HEADERS = [
  // Только HTTPS на год; браузер помнит это и для поддоменов сайта
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Сайт нельзя встроить в чужую страницу: защита от кликджекинга, например на форме входа
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

// Публичные настройки можно задать и без приставки NEXT_: на Render они заведены как PUBLIC_SUPABASE_URL и т. п.
// В браузер Next сам передаёт только NEXT_PUBLIC_*, поэтому короткое имя подставляется под полным при сборке.
// Если задано полное имя, главное оно
const PUBLIC_ENV = ["SITE_URL", "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEY", "YANDEX_CLIENT_ID"];

const publicEnv = Object.fromEntries(
  PUBLIC_ENV.map((name) => [
    `NEXT_PUBLIC_${name}`,
    process.env[`NEXT_PUBLIC_${name}`] || process.env[`PUBLIC_${name}`] || undefined,
  ]),
);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: publicEnv,

  // Jar Java-движка (4 МБ) CheerpJ читает кусками через Range. Без кэша каждый кусок при каждом заходе
  // заново сверяется с сервером; сутки храним, ещё неделю отдаём из кэша, обновляя в фоне.
  // Имена jar не меняются, поэтому при их обновлении клиенты получат новую версию не позже чем через сутки
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      {
        source: "/java/:jar(.*\\.jar)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },

  async redirects() {
    return [
      // Адреса сайта до v1.0: старые ссылки и закладки продолжают работать
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/lab.html", destination: "/course", permanent: true },
      { source: "/profile.html", destination: "/profile", permanent: true },
      { source: "/handbook.html", destination: "/handbook", permanent: true },
      // Админка открывается с обзора; временный редирект — первый раздел может смениться
      { source: "/admin", destination: "/admin/overview", permanent: false },
    ];
  },
};

export default nextConfig;

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

const nextConfig: NextConfig = {
  poweredByHeader: false,

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

  // Адреса сайта до v1.0: старые ссылки и закладки продолжают работать
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/lab.html", destination: "/course", permanent: true },
      { source: "/profile.html", destination: "/profile", permanent: true },
      { source: "/handbook.html", destination: "/handbook", permanent: true },
    ];
  },
};

export default nextConfig;

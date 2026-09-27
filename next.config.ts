import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // Jar Java-движка (4 МБ) CheerpJ читает кусками через Range. Без кэша каждый кусок при каждом заходе
  // заново сверяется с сервером; сутки храним, ещё неделю отдаём из кэша, обновляя в фоне.
  // Имена jar не меняются, поэтому при их обновлении клиенты получат новую версию не позже чем через сутки
  async headers() {
    return [
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

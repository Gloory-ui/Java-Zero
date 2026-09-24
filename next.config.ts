import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,

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

import type { MetadataRoute } from "next";
import { SITE_INDEXED, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!SITE_INDEXED) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/", "/profile", "/login"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

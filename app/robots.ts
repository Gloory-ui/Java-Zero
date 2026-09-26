import type { MetadataRoute } from "next";
import { getCourse } from "@/lib/content/load";
import { SITE_INDEXED, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!SITE_INDEXED) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Раздел «Группа» и задания КТ — только для одногруппников
      disallow: [
        "/api/",
        "/auth/",
        "/profile",
        "/login",
        "/group",
        ...getCourse()
          .filter((q) => q.track === "group")
          .map((q) => `/learn/${q.id}/`),
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

import type { MetadataRoute } from "next";
import { getCourse } from "@/lib/content/load";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/course`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/handbook`, changeFrequency: "monthly", priority: 0.7 },
  ];
  const stages: MetadataRoute.Sitemap = getCourse().flatMap((quest) =>
    quest.stages.map((stage) => ({
      url: `${SITE_URL}/learn/${quest.id}/${stage.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  );
  return [...pages, ...stages];
}

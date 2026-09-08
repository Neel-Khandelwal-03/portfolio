import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/env";
import { getProfile, getPublishedProjectSlugs } from "@/services/portfolio";

/**
 * Generated from the database, so publishing a project adds it to the sitemap
 * without a code change.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [projects, profile] = await Promise.all([getPublishedProjectSlugs(), getProfile()]);

  return [
    { url: base, lastModified: profile.updatedAt, changeFrequency: "monthly", priority: 1 },
    {
      url: `${base}/projects`,
      lastModified: profile.updatedAt,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...projects.map((project) => ({
      url: `${base}/projects/${project.slug}`,
      lastModified: project.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

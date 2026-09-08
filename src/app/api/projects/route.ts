import { NextResponse } from "next/server";

import { getPublishedProjects } from "@/services/portfolio";

export const runtime = "nodejs";

/**
 * Public, read-only project feed.
 *
 * Only published projects are ever returned, and the payload is deliberately
 * narrowed to presentational fields — internal ordering and timestamps are not
 * anyone else's business.
 */
export async function GET() {
  const projects = await getPublishedProjects();

  return NextResponse.json(
    {
      projects: projects.map((project) => ({
        title: project.title,
        slug: project.slug,
        summary: project.summary,
        category: project.category,
        technologies: project.technologies,
        githubUrl: project.githubUrl,
        liveUrl: project.liveUrl,
        coverImageUrl: project.coverImageUrl,
        featured: project.isFeatured,
        startDate: project.startDate,
        endDate: project.endDate,
      })),
    },
    { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}

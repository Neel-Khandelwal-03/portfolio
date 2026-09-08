import type { Metadata } from "next";
import Link from "next/link";

import { ProjectCard } from "@/components/public/sections";
import { Container, EmptyState } from "@/components/ui";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { getPublishedProjects } from "@/services/portfolio";

export const metadata: Metadata = {
  title: "Projects",
  description: "Software, full-stack and data projects built by Neel Khandelwal.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsIndexPage() {
  const projects = await getPublishedProjects();

  // Group by category so a long list stays scannable.
  const categories = [...new Set(projects.map((p) => p.category))].sort();

  return (
    <div className="py-14 sm:py-20">
      <Container>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-fg-muted hover:text-fg"
        >
          <ArrowLeftIcon width={14} height={14} />
          Back to portfolio
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">All projects</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-fg-muted">
          {projects.length === 0
            ? "Nothing published yet."
            : `${projects.length} published ${projects.length === 1 ? "project" : "projects"}, newest ordering first.`}
        </p>

        {projects.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No projects published"
              description="Publish a project from the admin dashboard to see it here."
            />
          </div>
        ) : (
          <div className="mt-12 space-y-14">
            {categories.map((category) => (
              <section key={category} aria-labelledby={`cat-${category}`}>
                <h2
                  id={`cat-${category}`}
                  className="font-mono text-[11px] font-semibold tracking-[0.16em] text-fg-subtle uppercase"
                >
                  {category}
                </h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {projects
                    .filter((project) => project.category === category)
                    .map((project) => (
                      <div key={project.id} className="relative">
                        <ProjectCard project={project} />
                      </div>
                    ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

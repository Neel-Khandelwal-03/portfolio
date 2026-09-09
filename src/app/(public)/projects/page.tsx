import type { Metadata } from "next";
import Link from "next/link";

import { ProjectCard } from "@/components/public/sections";
import { Container, EmptyState, Eyebrow } from "@/components/ui";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { getPublishedProjects } from "@/services/portfolio";

export const metadata: Metadata = {
  title: "Projects",
  description: "Software, full-stack and data projects built by Neel Khandelwal.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsIndexPage() {
  const projects = await getPublishedProjects();
  const categories = [...new Set(projects.map((p) => p.category))].sort();

  return (
    <div className="relative pt-28 pb-24 sm:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid mask-fade absolute inset-0 h-96" />
      </div>

      <Container>
        <Link
          href="/"
          className="text-fg-muted hover:text-fg group inline-flex items-center gap-2 text-[13px] font-medium transition-colors duration-200"
        >
          <ArrowLeftIcon
            width={14}
            height={14}
            className="transition-transform duration-200 group-hover:-translate-x-1"
          />
          Back to portfolio
        </Link>

        <div className="mt-8">
          <Eyebrow>Index</Eyebrow>
          <h1 className="text-title mt-5 font-semibold">All projects</h1>
          <p className="text-fg-muted text-lead mt-4 max-w-xl">
            {projects.length === 0
              ? "Nothing published yet."
              : `${projects.length} published across ${categories.length} ${
                  categories.length === 1 ? "area" : "areas"
                }. Each has a full write-up.`}
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="mt-14">
            <EmptyState
              title="No projects published"
              description="Publish a project from the admin dashboard to see it here."
            />
          </div>
        ) : (
          <div className="mt-14 space-y-16">
            {categories.map((category) => {
              const inCategory = projects.filter((project) => project.category === category);

              return (
                <section key={category} aria-labelledby={`cat-${category}`}>
                  <div className="border-border-hair flex items-baseline gap-4 border-b pb-3">
                    <h2 id={`cat-${category}`} className="label text-fg-subtle">
                      {category}
                    </h2>
                    <span className="text-fg-subtle/60 ml-auto font-mono text-[11px] tabular-nums">
                      {String(inCategory.length).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {inCategory.map((project, index) => (
                      <ProjectCard key={project.id} project={project} priority={index === 0} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}

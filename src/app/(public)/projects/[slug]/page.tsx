import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TrackedLink } from "@/components/public/tracked-link";
import { Container, Prose, TechChip } from "@/components/ui";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ExternalLinkIcon,
  GitHubIcon,
} from "@/components/ui/icons";
import { siteUrl } from "@/lib/env";
import { formatDateRange, safeUrl } from "@/lib/utils";
import { getProjectBySlug, getPublishedProjectSlugs } from "@/services/portfolio";

type Params = { params: Promise<{ slug: string }> };

/**
 * Pre-render every published project at build time.
 *
 * `dynamicParams` stays on so a project created later renders on its first
 * request and is cached from then on — no rebuild needed to publish new work.
 */
export async function generateStaticParams() {
  const rows = await getPublishedProjectSlugs();
  return rows.map((row) => ({ slug: row.slug }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return { title: "Project not found", robots: { index: false, follow: false } };
  }

  const description =
    project.summary || project.description.slice(0, 200) || `${project.title} by Neel Khandelwal`;
  const url = `${siteUrl()}/projects/${project.slug}`;

  return {
    title: project.title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "article",
      title: project.title,
      description,
      url,
      images: project.coverImageUrl ? [{ url: project.coverImageUrl }] : undefined,
      tags: project.technologies,
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description,
      images: project.coverImageUrl ? [project.coverImageUrl] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  const cover = safeUrl(project.coverImageUrl);
  const github = safeUrl(project.githubUrl);
  const live = safeUrl(project.liveUrl);
  const dates = formatDateRange(project.startDate, project.endDate, "Ongoing");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary || undefined,
    url: `${siteUrl()}/projects/${project.slug}`,
    image: project.coverImageUrl || undefined,
    keywords: project.technologies.join(", ") || undefined,
    author: { "@type": "Person", name: "Neel Khandelwal" },
    dateCreated: project.startDate || undefined,
  };

  return (
    <article className="py-14 sm:py-20">
      <Container className="max-w-3xl">
        <Link
          href="/#projects"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-fg-muted hover:text-fg"
        >
          <ArrowLeftIcon width={14} height={14} />
          Back to projects
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-fg-subtle">
            <span className="rounded border border-border-base px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase">
              {project.category}
            </span>
            {dates ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon width={13} height={13} />
                {dates}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {project.title}
          </h1>

          {project.summary ? (
            <p className="mt-4 text-base leading-relaxed text-fg-muted">{project.summary}</p>
          ) : null}

          {github || live ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {live ? (
                <TrackedLink
                  event="project_live"
                  detail={project.slug}
                  href={live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-colors duration-150 hover:bg-accent-hover"
                >
                  <ExternalLinkIcon width={15} height={15} />
                  Live demo
                </TrackedLink>
              ) : null}
              {github ? (
                <TrackedLink
                  event="project_github"
                  detail={project.slug}
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-border-base bg-bg-raised px-4 text-sm font-medium text-fg transition-colors duration-150 hover:border-border-strong hover:bg-bg-subtle"
                >
                  <GitHubIcon width={15} height={15} />
                  Source code
                </TrackedLink>
              ) : null}
            </div>
          ) : null}
        </header>

        {cover ? (
          <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-xl border border-border-base bg-bg-subtle">
            <Image
              src={cover}
              alt={`${project.title} screenshot`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        ) : null}

        {project.technologies.length > 0 ? (
          <section aria-labelledby="tech-heading" className="mt-10">
            <h2
              id="tech-heading"
              className="font-mono text-[11px] font-semibold tracking-[0.16em] text-fg-subtle uppercase"
            >
              Built with
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <li key={tech}>
                  <TechChip>{tech}</TechChip>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {project.description ? (
          <section aria-labelledby="overview-heading" className="mt-10">
            <h2 id="overview-heading" className="text-lg font-semibold">
              Overview
            </h2>
            <Prose text={project.description} className="mt-4 text-base" />
          </section>
        ) : null}

        {project.screenshots.length > 0 ? (
          <section aria-labelledby="screens-heading" className="mt-12">
            <h2 id="screens-heading" className="text-lg font-semibold">
              Screenshots
            </h2>
            <div className="mt-5 space-y-6">
              {project.screenshots.map((shot, index) => {
                const url = safeUrl(shot.url);
                if (!url) return null;

                return (
                  <figure key={index}>
                    <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border-base bg-bg-subtle">
                      <Image
                        src={url}
                        alt={shot.caption || `${project.title} screenshot ${index + 1}`}
                        fill
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, 768px"
                        className="object-cover"
                      />
                    </div>
                    {shot.caption ? (
                      <figcaption className="mt-2.5 text-[13px] text-fg-subtle">
                        {shot.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                );
              })}
            </div>
          </section>
        ) : null}

        <footer className="mt-14 border-t border-border-base pt-8">
          <Link
            href="/#projects"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
          >
            <ArrowLeftIcon width={14} height={14} />
            All projects
          </Link>
        </footer>
      </Container>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </article>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CaseStudyNav, type CaseStudySection } from "@/components/public/case-study-nav";
import { MetricBand } from "@/components/public/project-metrics";
import { ProjectVisual } from "@/components/public/project-visual";
import { TrackedLink } from "@/components/public/tracked-link";
import { TransitionLink } from "@/components/public/transition-link";
import { Container, Eyebrow, Prose, TechChip } from "@/components/ui";
import { ArrowLeftIcon, ArrowRightIcon, ExternalLinkIcon, GitHubIcon } from "@/components/ui/icons";
import { siteUrl } from "@/lib/env";
import { cn, formatDateRange, safeUrl } from "@/lib/utils";
import {
  getProjectBySlug,
  getPublishedProjects,
  getPublishedProjectSlugs,
} from "@/services/portfolio";

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

  const github = safeUrl(project.githubUrl);
  const live = safeUrl(project.liveUrl);
  const dates = formatDateRange(project.startDate, project.endDate, "Ongoing");

  // The case study is assembled from whichever sections have been written. An
  // older project with only a description still renders as a single Overview,
  // and the contents rail never lists a heading that is not on the page.
  const body = [
    { id: "overview", label: "Overview", text: project.description },
    { id: "problem", label: "Problem", text: project.problem },
    { id: "approach", label: "Approach", text: project.approach },
    { id: "architecture", label: "Architecture", text: project.architecture },
    { id: "results", label: "Results", text: project.results },
    { id: "learned", label: "What I learned", text: project.learned },
  ].filter((section) => section.text.trim().length > 0);

  const contents: CaseStudySection[] = body.map(({ id, label }) => ({ id, label }));
  if (project.screenshots.length > 0) contents.push({ id: "screens", label: "Screens" });

  // Sibling navigation, so a reader can move through the work without
  // returning to the index first.
  const all = await getPublishedProjects();
  const position = all.findIndex((p) => p.id === project.id);
  const next = position >= 0 ? (all[position + 1] ?? all[0]) : null;

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
    <article className="pt-28 pb-24 sm:pt-36">
      {/* ------------------------------------------------------------ header */}
      <header className="relative overflow-hidden pb-14">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="bg-grid mask-fade absolute inset-0" />
        </div>

        <Container>
          <Link
            href="/#projects"
            className="text-fg-muted hover:text-fg group inline-flex items-center gap-2 text-[13px] font-medium transition-colors duration-200"
          >
            <ArrowLeftIcon
              width={14}
              height={14}
              className="transition-transform duration-200 group-hover:-translate-x-1"
            />
            Back to projects
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
            <div>
              <Eyebrow>{project.category}</Eyebrow>

              <h1
                className="text-title mt-5 font-semibold"
                style={{ viewTransitionName: "project-title" }}
              >
                {project.title}
              </h1>

              {project.summary ? (
                <p className="text-fg-muted text-lead mt-5 max-w-2xl">{project.summary}</p>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {live ? (
                  <TrackedLink
                    event="project_live"
                    detail={project.slug}
                    href={live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-accent text-accent-fg hover:bg-accent-hover shadow-card inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-medium transition-colors duration-200"
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
                    className="border-border-base bg-bg-raised text-fg hover:border-border-strong hover:bg-bg-subtle inline-flex h-12 items-center gap-2 rounded-full border px-6 text-[15px] font-medium transition-colors duration-200"
                  >
                    <GitHubIcon width={15} height={15} />
                    Source code
                  </TrackedLink>
                ) : null}
              </div>
            </div>

            {/* Fact sheet — the details a reader scans for, in one place */}
            <dl className="border-border-base bg-bg-raised/60 rounded-card divide-border-hair divide-y border backdrop-blur-sm">
              <div className="flex items-baseline justify-between gap-4 p-4">
                <dt className="label text-fg-subtle">Category</dt>
                <dd className="text-right text-[13px] font-medium">{project.category}</dd>
              </div>
              {dates ? (
                <div className="flex items-baseline justify-between gap-4 p-4">
                  <dt className="label text-fg-subtle">Timeline</dt>
                  <dd className="text-right font-mono text-[12px]">{dates}</dd>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between gap-4 p-4">
                <dt className="label text-fg-subtle">Stack</dt>
                <dd className="text-right font-mono text-[12px] tabular-nums">
                  {project.technologies.length} technologies
                </dd>
              </div>
            </dl>
          </div>
        </Container>
      </header>

      {/* ------------------------------------------------------------- cover */}
      <Container>
        {/* Paired with the card that was clicked to get here. */}
        <ProjectVisual
          project={project}
          priority
          viewTransitionName="project-media"
          className="aspect-[16/9] sm:aspect-[2/1]"
          sizes="(max-width: 1152px) 100vw, 1088px"
        />

        <MetricBand metrics={project.metrics} className="mt-8" />
      </Container>

      {/* -------------------------------------------------------------- body */}
      <Container className="mt-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,190px)_minmax(0,1fr)] lg:gap-16">
          {/* Sticky rail: where you are, and what it was built with */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <CaseStudyNav sections={contents} />

            {project.technologies.length > 0 ? (
              <div className={contents.length > 1 ? "mt-10" : ""}>
                <p className="label text-fg-subtle">Built with</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {project.technologies.map((tech) => (
                    <li key={tech}>
                      <TechChip>{tech}</TechChip>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>

          <div className="min-w-0">
            {body.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-heading`}
                className={cn("scroll-mt-28", index > 0 && "mt-16")}
              >
                <h2 id={`${section.id}-heading`} className="text-subtitle font-semibold">
                  {section.label}
                </h2>
                {/* Stored plain text, rendered as text — never as HTML. */}
                <Prose text={section.text} className="mt-6 max-w-2xl" />
              </section>
            ))}

            {project.screenshots.length > 0 ? (
              <section
                id="screens"
                aria-labelledby="screens-heading"
                className={cn("scroll-mt-28", body.length > 0 && "mt-16")}
              >
                <h2 id="screens-heading" className="text-subtitle font-semibold">
                  Screens
                </h2>
                <div className="mt-6 space-y-8">
                  {project.screenshots.map((shot, index) => {
                    const url = safeUrl(shot.url);
                    if (!url) return null;

                    return (
                      <figure key={index}>
                        <div className="border-border-base bg-bg-subtle rounded-card relative aspect-[16/10] overflow-hidden border">
                          <Image
                            src={url}
                            alt={shot.caption || `${project.title} screenshot ${index + 1}`}
                            fill
                            loading="lazy"
                            sizes="(max-width: 1024px) 100vw, 760px"
                            className="object-cover"
                          />
                        </div>
                        {shot.caption ? (
                          <figcaption className="text-fg-subtle mt-3 font-mono text-[12px]">
                            {shot.caption}
                          </figcaption>
                        ) : null}
                      </figure>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </Container>

      {/* --------------------------------------------------------- next work */}
      {next && next.id !== project.id ? (
        <Container className="mt-24">
          <TransitionLink
            href={`/projects/${next.slug}`}
            className="group border-border-base bg-bg-raised rounded-panel hover:border-border-strong flex flex-wrap items-center gap-6 border p-6 transition-colors duration-300 sm:p-8"
          >
            <div className="min-w-0 flex-1">
              <p className="label text-fg-subtle">Next project</p>
              <p className="group-hover:text-accent mt-3 text-[20px] font-semibold transition-colors duration-200">
                {next.title}
              </p>
              {next.summary ? (
                <p className="text-fg-muted mt-2 line-clamp-1 text-sm">{next.summary}</p>
              ) : null}
            </div>
            <ArrowRightIcon
              width={22}
              height={22}
              className="text-fg-subtle group-hover:text-accent shrink-0 transition-all duration-200 group-hover:translate-x-1"
            />
          </TransitionLink>
        </Container>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </article>
  );
}

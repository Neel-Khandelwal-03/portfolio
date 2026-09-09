import Image from "next/image";
import Link from "next/link";

import { ProjectVisual } from "@/components/public/project-visual";
import { TrackedLink } from "@/components/public/tracked-link";
import { Container, EmptyState, Eyebrow, Prose, Section, TechChip } from "@/components/ui";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CertificateIcon,
  CodeIcon,
  DocumentIcon,
  ExternalLinkIcon,
  GitHubIcon,
  SparkIcon,
  TrophyIcon,
} from "@/components/ui/icons";
import { cn, formatDateRange, formatFullDate, formatMonthYear, safeUrl } from "@/lib/utils";
import type {
  Achievement,
  Certification,
  Education,
  Experience,
  Profile,
  Project,
} from "@/db/schema";
import type { SkillGroup } from "@/services/portfolio";

/* ========================================================================== */
/* About                                                                       */
/* ========================================================================== */

/**
 * Editorial layout: the summary runs at a comfortable reading measure on the
 * left, with the three interest cards stacked beside it as a narrow sidebar —
 * the shape of a magazine spread rather than another equal-weight card grid.
 */
export function AboutSection({ profile, index }: { profile: Profile; index: string }) {
  const cards = [
    { title: "Career interests", body: profile.careerInterests, Icon: BriefcaseIcon },
    { title: "Technical interests", body: profile.technicalInterests, Icon: CodeIcon },
    { title: "Current focus", body: profile.currentFocus, Icon: SparkIcon },
  ].filter((card) => card.body.trim().length > 0);

  return (
    <Section
      id="about"
      index={index}
      eyebrow="About"
      title="Engineering across the whole stack"
      description="From the relational schema through the API to the interface someone actually uses."
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16">
        {profile.summary ? (
          <div className="reveal">
            <Prose text={profile.summary} />
          </div>
        ) : (
          <EmptyState title="No summary yet" description="Add one from the admin dashboard." />
        )}

        {cards.length > 0 ? (
          <ul className="reveal divide-border-hair border-border-base rounded-card divide-y border">
            {cards.map(({ title, body, Icon }) => (
              <li key={title} className="hover:bg-bg-subtle p-5 transition-colors duration-200">
                <p className="label text-fg-subtle flex items-center gap-2">
                  <Icon width={13} height={13} className="text-accent" />
                  {title}
                </p>
                <p className="text-fg-muted mt-3 text-sm leading-relaxed">{body}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Section>
  );
}

/* ========================================================================== */
/* Skills                                                                      */
/* ========================================================================== */

/**
 * A specification table rather than a card grid: each category is one row, its
 * name in the left column and its technologies flowing across the right. Dense,
 * scannable, and it makes the list read as a technical reference.
 */
export function SkillsSection({ groups, index }: { groups: SkillGroup[]; index: string }) {
  const populated = groups.filter((group) => group.skills.length > 0);
  const total = populated.reduce((sum, group) => sum + group.skills.length, 0);

  return (
    <Section
      id="skills"
      index={index}
      eyebrow="Skills"
      title="Tools I reach for"
      description={`${total} technologies across ${populated.length} areas — the ones I actually use, not everything I have touched.`}
    >
      {populated.length === 0 ? (
        <EmptyState
          title="No skills added yet"
          description="Add categories and skills from the admin dashboard."
        />
      ) : (
        <ul className="reveal border-border-hair divide-border-hair divide-y border-y">
          {populated.map((group) => (
            <li
              key={group.id}
              className="hover:bg-bg-subtle/60 group grid gap-4 py-6 transition-colors duration-200 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)] sm:gap-8 sm:px-2"
            >
              <div className="flex items-baseline gap-3">
                <h3 className="label text-fg-subtle group-hover:text-accent transition-colors duration-200">
                  {group.name}
                </h3>
                <span className="text-fg-subtle/60 font-mono text-[11px] tabular-nums sm:ml-auto">
                  {String(group.skills.length).padStart(2, "0")}
                </span>
              </div>

              <ul className="flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <li key={skill.id}>
                    <span className="border-border-base bg-bg-raised text-fg-muted hover:border-accent-line hover:text-fg inline-block rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors duration-200">
                      {skill.name}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/* ========================================================================== */
/* Experience                                                                  */
/* ========================================================================== */

/**
 * A labelled bullet list.
 *
 * Responsibilities and highlights share one component so their text edges line
 * up exactly, and the label does the grouping work that spacing alone could not.
 */
function BulletGroup({
  label,
  items,
  accent = false,
}: {
  label: string;
  items: string[];
  accent?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-6 max-w-2xl">
      <p className="label text-fg-subtle">{label}</p>
      <ul className="mt-3 space-y-2">
        {items.map((line, index) => (
          <li
            key={index}
            className={cn(
              "text-fg-muted relative pl-4 text-sm leading-relaxed",
              "before:absolute before:top-[0.6rem] before:left-0 before:h-1 before:w-1 before:rounded-full",
              accent ? "before:bg-accent" : "before:bg-border-strong",
            )}
          >
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExperienceSection({
  experiences,
  index,
}: {
  experiences: Experience[];
  index: string;
}) {
  return (
    <Section
      id="experience"
      index={index}
      eyebrow="Experience"
      title="Where I have worked"
      description="Internships across consulting, applied AI and automation."
    >
      {experiences.length === 0 ? (
        <EmptyState
          title="No experience added yet"
          description="Add internships and roles from the admin dashboard."
        />
      ) : (
        <ol className="relative">
          {experiences.map((item, index) => {
            const logo = safeUrl(item.logoUrl);
            const certificate = safeUrl(item.certificateUrl);
            const year = item.startDate?.slice(0, 4) ?? "";
            const previousYear = index > 0 ? experiences[index - 1].startDate?.slice(0, 4) : null;
            const showYear = year && year !== previousYear;

            return (
              <li key={item.id} className="reveal group relative">
                {/* Year marker, printed once per year in the gutter */}
                {showYear ? (
                  <p className="label text-fg-subtle/70 mb-4 tabular-nums lg:absolute lg:top-0 lg:-left-2 lg:mb-0 lg:w-16 lg:text-right">
                    {year}
                  </p>
                ) : null}

                <div className="border-border-hair relative border-l pb-14 pl-8 group-last:border-transparent group-last:pb-0 sm:pl-10 lg:ml-20">
                  {/* Timeline node */}
                  <span
                    aria-hidden
                    className="border-bg bg-border-strong group-hover:bg-accent absolute top-1.5 -left-[6.5px] h-3 w-3 rounded-full border-2 transition-colors duration-300"
                  />

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    {logo ? (
                      <Image
                        src={logo}
                        alt=""
                        width={32}
                        height={32}
                        sizes="32px"
                        loading="lazy"
                        className="border-border-base bg-bg-raised h-8 w-8 rounded-lg border object-contain p-0.5"
                      />
                    ) : null}
                    <h3 className="text-subtitle font-semibold">{item.role}</h3>
                  </div>

                  <p className="text-accent mt-2 text-[15px] font-medium">{item.company}</p>

                  <p className="text-fg-subtle mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[12px]">
                    <span>{formatDateRange(item.startDate, item.endDate)}</span>
                    {item.location ? (
                      <>
                        <span className="bg-border-strong h-3 w-px" aria-hidden />
                        <span>{item.location}</span>
                      </>
                    ) : null}
                    <span className="bg-border-strong h-3 w-px" aria-hidden />
                    <span>{item.employmentType}</span>
                  </p>

                  {item.description ? (
                    <p className="text-fg-muted mt-5 max-w-2xl text-sm leading-relaxed">
                      {item.description}
                    </p>
                  ) : null}

                  <BulletGroup label="Responsibilities" items={item.responsibilities} />
                  <BulletGroup label="Highlights" items={item.achievements} accent />

                  {item.technologies.length > 0 ? (
                    <ul className="mt-6 flex flex-wrap gap-1.5">
                      {item.technologies.map((tech) => (
                        <li key={tech}>
                          <TechChip>{tech}</TechChip>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {certificate ? (
                    <a
                      href={certificate}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent link-underline mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium"
                    >
                      <DocumentIcon width={13} height={13} />
                      View certificate
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Section>
  );
}

/* ========================================================================== */
/* Projects                                                                    */
/* ========================================================================== */

/**
 * A large, alternating project block.
 *
 * Odd-indexed blocks flip the columns so the eye zig-zags down the page instead
 * of tracking a single edge — the rhythm that stops a project list feeling like
 * a table of records.
 */
function FeatureBlock({ project, index }: { project: Project; index: number }) {
  const github = safeUrl(project.githubUrl);
  const live = safeUrl(project.liveUrl);
  const flipped = index % 2 === 1;

  return (
    <article className="reveal group grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <Link
        href={`/projects/${project.slug}`}
        aria-label={`${project.title} — read more`}
        className={cn("block focus-visible:outline-none", flipped ? "lg:order-2" : "lg:order-1")}
        tabIndex={-1}
      >
        <ProjectVisual
          project={project}
          priority={index === 0}
          className="group-hover:border-border-strong aspect-[16/10] transition-colors duration-300"
          sizes="(max-width: 1024px) 100vw, 560px"
        />
      </Link>

      <div className={flipped ? "lg:order-1" : "lg:order-2"}>
        <p className="label text-fg-subtle flex items-center gap-2">
          <span className="tabular-nums">{String(index + 1).padStart(2, "0")}</span>
          <span className="bg-border-strong h-px w-5" aria-hidden />
          {project.category}
        </p>

        <h3 className="text-title mt-4 font-semibold">
          <Link
            href={`/projects/${project.slug}`}
            className="group-hover:text-accent transition-colors duration-200"
          >
            {project.title}
          </Link>
        </h3>

        {project.summary ? (
          <p className="text-fg-muted text-lead mt-4 max-w-xl">{project.summary}</p>
        ) : null}

        {project.technologies.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 8).map((tech) => (
              <li key={tech}>
                <TechChip>{tech}</TechChip>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={`/projects/${project.slug}`}
            className="group/cta border-border-base bg-bg-raised text-fg hover:border-border-strong hover:bg-bg-subtle inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors duration-200"
          >
            Case study
            <ArrowRightIcon
              width={14}
              height={14}
              className="transition-transform duration-200 group-hover/cta:translate-x-1"
            />
          </Link>

          {live ? (
            <TrackedLink
              event="project_live"
              detail={project.slug}
              href={live}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg-muted hover:text-fg inline-flex h-11 items-center gap-2 px-2 text-sm font-medium transition-colors duration-200"
            >
              <ExternalLinkIcon width={15} height={15} />
              Live
            </TrackedLink>
          ) : null}

          {github ? (
            <TrackedLink
              event="project_github"
              detail={project.slug}
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg-muted hover:text-fg inline-flex h-11 items-center gap-2 px-2 text-sm font-medium transition-colors duration-200"
            >
              <GitHubIcon width={15} height={15} />
              Source
            </TrackedLink>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/** Compact row used for projects beyond the featured set. */
export function ProjectRow({ project }: { project: Project }) {
  const github = safeUrl(project.githubUrl);
  const live = safeUrl(project.liveUrl);

  return (
    <li className="group hover:bg-bg-subtle/60 relative grid gap-3 py-6 transition-colors duration-200 sm:grid-cols-[minmax(0,1fr)_minmax(0,auto)] sm:items-center sm:gap-8 sm:px-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-[17px] font-semibold">
            <Link
              href={`/projects/${project.slug}`}
              className="group-hover:text-accent transition-colors duration-200 after:absolute after:inset-0"
            >
              {project.title}
            </Link>
          </h3>
          <span className="label text-fg-subtle/70">{project.category}</span>
        </div>

        {project.summary ? (
          <p className="text-fg-muted mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed">
            {project.summary}
          </p>
        ) : null}

        {project.technologies.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 6).map((tech) => (
              <li key={tech}>
                <TechChip>{tech}</TechChip>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="text-fg-subtle relative z-10 flex items-center gap-1">
        {live ? (
          <TrackedLink
            event="project_live"
            detail={project.slug}
            href={live}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.title} live demo`}
            className="hover:bg-bg-raised hover:text-fg grid h-9 w-9 place-items-center rounded-lg transition-colors duration-200"
          >
            <ExternalLinkIcon width={15} height={15} />
          </TrackedLink>
        ) : null}
        {github ? (
          <TrackedLink
            event="project_github"
            detail={project.slug}
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.title} source on GitHub`}
            className="hover:bg-bg-raised hover:text-fg grid h-9 w-9 place-items-center rounded-lg transition-colors duration-200"
          >
            <GitHubIcon width={15} height={15} />
          </TrackedLink>
        ) : null}
        <ArrowRightIcon
          width={16}
          height={16}
          className="ml-1 transition-transform duration-200 group-hover:translate-x-1"
        />
      </div>
    </li>
  );
}

/** Card used on the /projects index, where every project gets equal weight. */
export function ProjectCard({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  const github = safeUrl(project.githubUrl);
  const live = safeUrl(project.liveUrl);

  return (
    <article className="group border-border-base bg-bg-raised rounded-card hover:border-border-strong hover:shadow-raised relative flex flex-col overflow-hidden border transition-all duration-300">
      <ProjectVisual
        project={project}
        priority={priority}
        className="aspect-[16/10] rounded-none border-0 border-b"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
      />

      <div className="flex flex-1 flex-col p-5">
        <p className="label text-fg-subtle/70">{project.category}</p>

        <h3 className="mt-3 text-[17px] font-semibold">
          <Link
            href={`/projects/${project.slug}`}
            className="group-hover:text-accent transition-colors duration-200 after:absolute after:inset-0"
          >
            {project.title}
          </Link>
        </h3>

        {project.summary ? (
          <p className="text-fg-muted mt-2 line-clamp-3 text-sm leading-relaxed">
            {project.summary}
          </p>
        ) : null}

        {project.technologies.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 4).map((tech) => (
              <li key={tech}>
                <TechChip>{tech}</TechChip>
              </li>
            ))}
            {project.technologies.length > 4 ? (
              <li>
                <TechChip>+{project.technologies.length - 4}</TechChip>
              </li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-5 flex items-center gap-1 pt-1">
          <span className="text-accent inline-flex items-center gap-1.5 text-[13px] font-medium">
            Case study
            <ArrowRightIcon
              width={13}
              height={13}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </span>

          <span className="text-fg-subtle relative z-10 ml-auto flex items-center gap-1">
            {github ? (
              <TrackedLink
                event="project_github"
                detail={project.slug}
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.title} source on GitHub`}
                className="hover:bg-bg-subtle hover:text-fg grid h-8 w-8 place-items-center rounded-md"
              >
                <GitHubIcon width={15} height={15} />
              </TrackedLink>
            ) : null}
            {live ? (
              <TrackedLink
                event="project_live"
                detail={project.slug}
                href={live}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.title} live demo`}
                className="hover:bg-bg-subtle hover:text-fg grid h-8 w-8 place-items-center rounded-md"
              >
                <ExternalLinkIcon width={15} height={15} />
              </TrackedLink>
            ) : null}
          </span>
        </div>
      </div>
    </article>
  );
}

export function ProjectsSection({
  featured,
  rest,
  totalCount,
  index,
}: {
  featured: Project[];
  rest: Project[];
  totalCount: number;
  index: string;
}) {
  return (
    <Section
      id="projects"
      index={index}
      eyebrow="Projects"
      title="Things I have built"
      description="Full-stack products, applied AI, and systems work. Each one has a write-up."
    >
      {featured.length === 0 && rest.length === 0 ? (
        <EmptyState
          title="No projects published yet"
          description="Publish a project from the admin dashboard to show it here."
        />
      ) : (
        <>
          {featured.length > 0 ? (
            <div className="space-y-20 sm:space-y-28">
              {featured.map((project, index) => (
                <FeatureBlock key={project.id} project={project} index={index} />
              ))}
            </div>
          ) : null}

          {rest.length > 0 ? (
            <div className={featured.length > 0 ? "mt-24" : ""}>
              {featured.length > 0 ? <Eyebrow className="mb-2">More work</Eyebrow> : null}
              <ul className="border-border-hair divide-border-hair divide-y border-y">
                {rest.map((project) => (
                  <ProjectRow key={project.id} project={project} />
                ))}
              </ul>
            </div>
          ) : null}

          {totalCount > featured.length + rest.length ? (
            <div className="mt-10">
              <Link
                href="/projects"
                className="group text-accent link-underline inline-flex items-center gap-2 text-sm font-medium"
              >
                See all {totalCount} projects
                <ArrowRightIcon
                  width={14}
                  height={14}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
            </div>
          ) : null}
        </>
      )}
    </Section>
  );
}

/* ========================================================================== */
/* Education                                                                   */
/* ========================================================================== */

/**
 * Compact editorial rows. With only a handful of entries a card grid would
 * leave more border than content, so the dates sit in a mono gutter and the
 * detail flows beside them.
 */
export function EducationSection({
  education,
  index,
}: {
  education: Education[];
  index: string;
}) {
  return (
    <Section id="education" index={index} eyebrow="Education" title="Academic background">
      {education.length === 0 ? (
        <EmptyState
          title="No education added yet"
          description="Add your degrees from the admin dashboard."
        />
      ) : (
        <ul className="reveal border-border-hair divide-border-hair divide-y border-y">
          {education.map((item) => (
            <li
              key={item.id}
              className="hover:bg-bg-subtle/60 grid gap-4 py-7 transition-colors duration-200 sm:grid-cols-[minmax(0,150px)_minmax(0,1fr)] sm:gap-8 sm:px-2"
            >
              <div>
                <p className="text-fg-subtle font-mono text-[12px] tabular-nums">
                  {formatDateRange(item.startDate, item.endDate)}
                </p>
                {item.grade ? (
                  <p className="text-accent mt-2 font-mono text-[12px] font-medium">{item.grade}</p>
                ) : null}
              </div>

              <div className="min-w-0">
                <h3 className="text-[17px] font-semibold">{item.institution}</h3>
                <p className="text-fg-muted mt-1.5 text-sm">
                  {item.degree}
                  {item.field ? ` · ${item.field}` : ""}
                </p>

                {item.description ? (
                  <p className="text-fg-muted mt-4 max-w-2xl text-sm leading-relaxed">
                    {item.description}
                  </p>
                ) : null}

                {item.achievements.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {item.achievements.map((line, index) => (
                      <li
                        key={index}
                        className="text-fg-muted before:bg-accent relative pl-4 text-sm leading-relaxed before:absolute before:top-[0.6rem] before:left-0 before:h-1 before:w-1 before:rounded-full"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/* ========================================================================== */
/* Certifications                                                              */
/* ========================================================================== */

/**
 * A credential index. Rows rather than cards, because a certification is
 * essentially three short facts and a link — a card would be mostly padding.
 */
export function CertificationsSection({
  certifications,
  index,
}: {
  certifications: Certification[];
  index: string;
}) {
  if (certifications.length === 0) return null;

  return (
    <Section id="certifications" index={index} eyebrow="Certifications" title="Verified credentials">
      <ul className="reveal border-border-hair divide-border-hair divide-y border-y">
        {certifications.map((item) => {
          const credential = safeUrl(item.credentialUrl);
          const file = safeUrl(item.fileUrl);
          const link = credential ?? file;

          return (
            <li
              key={item.id}
              className="group hover:bg-bg-subtle/60 relative grid gap-2 py-5 transition-colors duration-200 sm:grid-cols-[minmax(0,1fr)_minmax(0,220px)_auto] sm:items-center sm:gap-6 sm:px-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <CertificateIcon
                  width={16}
                  height={16}
                  className="text-fg-subtle group-hover:text-accent shrink-0 transition-colors duration-200"
                />
                <h3 className="truncate text-[15px] font-medium">
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group-hover:text-accent transition-colors duration-200 after:absolute after:inset-0"
                    >
                      {item.name}
                    </a>
                  ) : (
                    item.name
                  )}
                </h3>
              </div>

              <p className="text-fg-muted truncate text-sm">{item.issuer}</p>

              <p className="text-fg-subtle flex items-center gap-3 font-mono text-[12px] tabular-nums">
                {item.issueDate ? formatMonthYear(item.issueDate) : ""}
                {link ? (
                  <ExternalLinkIcon
                    width={13}
                    height={13}
                    className="group-hover:text-accent transition-colors duration-200"
                  />
                ) : null}
              </p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/* ========================================================================== */
/* Achievements                                                                */
/* ========================================================================== */

export function AchievementsSection({
  achievements,
  index,
}: {
  achievements: Achievement[];
  index: string;
}) {
  if (achievements.length === 0) return null;

  return (
    <Section id="achievements" index={index} eyebrow="Achievements" title="Recognition">
      <ul className="reveal grid gap-4 sm:grid-cols-2">
        {achievements.map((item) => {
          const url = safeUrl(item.url);
          const file = safeUrl(item.fileUrl);
          const link = url ?? file;

          return (
            <li
              key={item.id}
              className="group border-border-base bg-bg-raised rounded-card hover:border-border-strong relative border p-5 transition-colors duration-200"
            >
              <div className="flex items-start gap-3">
                <TrophyIcon width={16} height={16} className="text-accent mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold">
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group-hover:text-accent transition-colors duration-200 after:absolute after:inset-0"
                      >
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </h3>
                  <p className="text-fg-subtle mt-1 font-mono text-[12px]">
                    {[item.organization, item.date ? formatFullDate(item.date) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>

              {item.description ? (
                <p className="text-fg-muted mt-4 text-sm leading-relaxed">{item.description}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/* ========================================================================== */
/* Section divider                                                             */
/* ========================================================================== */

/** A thin transition band between the hero and the first section. */
export function MarqueeStrip({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="border-border-hair no-print border-y py-4">
      <Container>
        <ul className="text-fg-subtle/70 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] tracking-wider uppercase">
          {items.map((item, index) => (
            <li key={item} className="flex items-center gap-6">
              {index > 0 ? (
                <span className="bg-border-strong h-1 w-1 rounded-full" aria-hidden />
              ) : null}
              {item}
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}

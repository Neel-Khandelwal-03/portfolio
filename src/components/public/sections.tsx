import Image from "next/image";
import Link from "next/link";

import { TrackedLink } from "@/components/public/tracked-link";
import { Card, EmptyState, Prose, Section, TechChip } from "@/components/ui";
import {
  AcademicIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  CertificateIcon,
  CodeIcon,
  DocumentIcon,
  ExternalLinkIcon,
  GitHubIcon,
  LocationIcon,
  SparkIcon,
  TrophyIcon,
} from "@/components/ui/icons";
import { formatDateRange, formatFullDate, formatMonthYear, safeUrl } from "@/lib/utils";
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

export function AboutSection({ profile }: { profile: Profile }) {
  const cards = [
    { title: "Career interests", body: profile.careerInterests, Icon: BriefcaseIcon },
    { title: "Technical interests", body: profile.technicalInterests, Icon: CodeIcon },
    { title: "Current focus", body: profile.currentFocus, Icon: SparkIcon },
  ].filter((card) => card.body.trim().length > 0);

  return (
    <Section id="about" eyebrow="01 / About" title="About me">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
        {profile.summary ? (
          <Prose text={profile.summary} className="reveal text-base" />
        ) : (
          <EmptyState title="No summary yet" description="Add one from the admin dashboard." />
        )}

        {cards.length > 0 ? (
          <ul className="reveal space-y-3">
            {cards.map(({ title, body, Icon }) => (
              <li
                key={title}
                className="rounded-xl border border-border-base bg-bg-subtle p-4"
              >
                <p className="flex items-center gap-2 text-[13px] font-semibold text-fg">
                  <Icon width={14} height={14} className="text-accent" />
                  {title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{body}</p>
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

export function SkillsSection({ groups }: { groups: SkillGroup[] }) {
  const populated = groups.filter((group) => group.skills.length > 0);

  return (
    <Section
      id="skills"
      eyebrow="02 / Skills"
      title="Technical skills"
      description="Languages, frameworks and tools I work with day to day."
    >
      {populated.length === 0 ? (
        <EmptyState
          title="No skills added yet"
          description="Add categories and skills from the admin dashboard."
        />
      ) : (
        <div className="reveal grid gap-4 sm:grid-cols-2">
          {populated.map((group) => (
            <Card key={group.id} className="p-5">
              <h3 className="font-mono text-[11px] font-semibold tracking-[0.14em] text-fg-subtle uppercase">
                {group.name}
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <li key={skill.id}>
                    <span className="inline-block rounded-md border border-border-base bg-bg-subtle px-2.5 py-1.5 text-[13px] font-medium text-fg-muted">
                      {skill.name}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ========================================================================== */
/* Experience                                                                  */
/* ========================================================================== */

export function ExperienceSection({ experiences }: { experiences: Experience[] }) {
  return (
    <Section
      id="experience"
      eyebrow="03 / Experience"
      title="Experience & internships"
      description="Where I have worked and what I built there."
    >
      {experiences.length === 0 ? (
        <EmptyState
          title="No experience added yet"
          description="Add internships and roles from the admin dashboard."
        />
      ) : (
        <ol className="relative space-y-8 border-l border-border-base pl-6 sm:pl-8">
          {experiences.map((item) => {
            const logo = safeUrl(item.logoUrl);
            const certificate = safeUrl(item.certificateUrl);

            return (
              <li key={item.id} className="reveal relative">
                <span
                  aria-hidden
                  className="absolute top-1.5 -left-[1.6rem] h-2.5 w-2.5 rounded-full border-2 border-bg bg-accent sm:-left-[2.1rem]"
                />

                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-base font-semibold">{item.role}</h3>
                  <span className="text-fg-subtle" aria-hidden>
                    ·
                  </span>
                  <p className="flex items-center gap-2 text-[15px] font-medium text-accent">
                    {logo ? (
                      <Image
                        src={logo}
                        alt=""
                        width={20}
                        height={20}
                        sizes="20px"
                        loading="lazy"
                        className="h-5 w-5 rounded border border-border-base object-contain"
                      />
                    ) : null}
                    {item.company}
                  </p>
                </div>

                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-fg-subtle">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon width={13} height={13} />
                    {formatDateRange(item.startDate, item.endDate)}
                  </span>
                  {item.location ? (
                    <span className="inline-flex items-center gap-1.5">
                      <LocationIcon width={13} height={13} />
                      {item.location}
                    </span>
                  ) : null}
                  <span className="rounded border border-border-base px-1.5 py-0.5 text-[11px] font-medium">
                    {item.employmentType}
                  </span>
                </p>

                {item.description ? (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">
                    {item.description}
                  </p>
                ) : null}

                {item.responsibilities.length > 0 ? (
                  <ul className="mt-3 max-w-2xl space-y-1.5">
                    {item.responsibilities.map((line, index) => (
                      <li
                        key={index}
                        className="relative pl-4 text-sm leading-relaxed text-fg-muted before:absolute before:top-[0.6rem] before:left-0 before:h-1 before:w-1 before:rounded-full before:bg-border-strong"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {item.achievements.length > 0 ? (
                  <ul className="mt-3 max-w-2xl space-y-1.5">
                    {item.achievements.map((line, index) => (
                      <li
                        key={index}
                        className="flex gap-2 text-sm leading-relaxed text-fg-muted"
                      >
                        <TrophyIcon
                          width={13}
                          height={13}
                          className="mt-1 shrink-0 text-accent"
                        />
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {item.technologies.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-1.5">
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
                    className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline"
                  >
                    <DocumentIcon width={13} height={13} />
                    View certificate
                  </a>
                ) : null}
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

export function ProjectCard({ project, priority = false }: { project: Project; priority?: boolean }) {
  const cover = safeUrl(project.coverImageUrl);
  const github = safeUrl(project.githubUrl);
  const live = safeUrl(project.liveUrl);

  return (
    <Card className="group flex flex-col overflow-hidden transition-colors duration-150 hover:border-border-strong">
      {cover ? (
        <div className="relative aspect-[16/9] overflow-hidden border-b border-border-base bg-bg-subtle">
          <Image
            src={cover}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold">
            {/* The whole card is clickable via this stretched link, so there is
                one tab stop per card rather than three. */}
            <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">
              {project.title}
            </Link>
          </h3>
          <span className="shrink-0 rounded border border-border-base px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-fg-subtle uppercase">
            {project.category}
          </span>
        </div>

        {project.summary ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-fg-muted">
            {project.summary}
          </p>
        ) : null}

        {project.technologies.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 5).map((tech) => (
              <li key={tech}>
                <TechChip>{tech}</TechChip>
              </li>
            ))}
            {project.technologies.length > 5 ? (
              <li>
                <TechChip>+{project.technologies.length - 5}</TechChip>
              </li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-5 flex items-center gap-3 pt-1">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent">
            Details
            <ArrowRightIcon
              width={13}
              height={13}
              className="transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </span>

          <span className="ml-auto flex items-center gap-1">
            {github ? (
              <TrackedLink
                event="project_github"
                detail={project.slug}
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.title} source on GitHub`}
                className="relative z-10 grid h-8 w-8 place-items-center rounded-md text-fg-subtle hover:bg-bg-subtle hover:text-fg"
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
                className="relative z-10 grid h-8 w-8 place-items-center rounded-md text-fg-subtle hover:bg-bg-subtle hover:text-fg"
              >
                <ExternalLinkIcon width={15} height={15} />
              </TrackedLink>
            ) : null}
          </span>
        </div>
      </div>
    </Card>
  );
}

export function ProjectsSection({
  featured,
  totalCount,
}: {
  featured: Project[];
  totalCount: number;
}) {
  return (
    <Section
      id="projects"
      eyebrow="04 / Projects"
      title="Featured projects"
      description="Selected work. Each project has a detail page with the full write-up."
    >
      {featured.length === 0 ? (
        <EmptyState
          title="No featured projects yet"
          description="Mark a project as featured in the admin dashboard to show it here."
        />
      ) : (
        <>
          <div className="reveal grid gap-5 sm:grid-cols-2">
            {featured.map((project, index) => (
              <div key={project.id} className="relative">
                <ProjectCard project={project} priority={index === 0} />
              </div>
            ))}
          </div>

          {totalCount > featured.length ? (
            <div className="mt-8">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
              >
                See all {totalCount} projects
                <ArrowRightIcon width={14} height={14} />
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

export function EducationSection({ education }: { education: Education[] }) {
  return (
    <Section id="education" eyebrow="05 / Education" title="Education">
      {education.length === 0 ? (
        <EmptyState
          title="No education added yet"
          description="Add your degrees from the admin dashboard."
        />
      ) : (
        <ul className="reveal space-y-4">
          {education.map((item) => (
            <li key={item.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="flex items-center gap-2 text-base font-semibold">
                      <AcademicIcon width={16} height={16} className="shrink-0 text-accent" />
                      {item.institution}
                    </h3>
                    <p className="mt-1.5 text-sm font-medium text-fg-muted">
                      {item.degree}
                      {item.field ? ` · ${item.field}` : ""}
                    </p>
                  </div>

                  <div className="text-right text-[13px] text-fg-subtle">
                    <p>{formatDateRange(item.startDate, item.endDate)}</p>
                    {item.grade ? (
                      <p className="mt-0.5 font-medium text-fg-muted">{item.grade}</p>
                    ) : null}
                  </div>
                </div>

                {item.description ? (
                  <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                    {item.description}
                  </p>
                ) : null}

                {item.achievements.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {item.achievements.map((line, index) => (
                      <li
                        key={index}
                        className="relative pl-4 text-sm leading-relaxed text-fg-muted before:absolute before:top-[0.6rem] before:left-0 before:h-1 before:w-1 before:rounded-full before:bg-border-strong"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
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

export function CertificationsSection({
  certifications,
}: {
  certifications: Certification[];
}) {
  return (
    <Section id="certifications" eyebrow="06 / Certifications" title="Certifications">
      {certifications.length === 0 ? (
        <EmptyState
          title="No certifications added yet"
          description="Add them from the admin dashboard."
        />
      ) : (
        <ul className="reveal grid gap-4 sm:grid-cols-2">
          {certifications.map((item) => {
            const credential = safeUrl(item.credentialUrl);
            const file = safeUrl(item.fileUrl);

            return (
              <li key={item.id}>
                <Card className="flex h-full flex-col p-5">
                  <div className="flex items-start gap-3">
                    <CertificateIcon
                      width={18}
                      height={18}
                      className="mt-0.5 shrink-0 text-accent"
                    />
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold">{item.name}</h3>
                      <p className="mt-1 text-sm text-fg-muted">{item.issuer}</p>
                    </div>
                  </div>

                  <dl className="mt-4 space-y-1 text-[13px] text-fg-subtle">
                    {item.issueDate ? (
                      <div className="flex gap-2">
                        <dt className="font-medium">Issued</dt>
                        <dd>{formatMonthYear(item.issueDate)}</dd>
                      </div>
                    ) : null}
                    {item.credentialId ? (
                      <div className="flex gap-2">
                        <dt className="font-medium">ID</dt>
                        <dd className="truncate font-mono text-[12px]">{item.credentialId}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {credential || file ? (
                    <div className="mt-4 flex flex-wrap gap-4 pt-1">
                      {credential ? (
                        <a
                          href={credential}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline"
                        >
                          <ExternalLinkIcon width={13} height={13} />
                          Verify
                        </a>
                      ) : null}
                      {file ? (
                        <a
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline"
                        >
                          <DocumentIcon width={13} height={13} />
                          Certificate
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

/* ========================================================================== */
/* Achievements                                                                */
/* ========================================================================== */

export function AchievementsSection({ achievements }: { achievements: Achievement[] }) {
  return (
    <Section id="achievements" eyebrow="07 / Achievements" title="Achievements">
      {achievements.length === 0 ? (
        <EmptyState
          title="No achievements added yet"
          description="Add them from the admin dashboard."
        />
      ) : (
        <ul className="reveal space-y-3">
          {achievements.map((item) => {
            const url = safeUrl(item.url);
            const file = safeUrl(item.fileUrl);

            return (
              <li
                key={item.id}
                className="flex gap-4 rounded-xl border border-border-base bg-bg-raised p-5"
              >
                <TrophyIcon width={18} height={18} className="mt-0.5 shrink-0 text-accent" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h3 className="text-[15px] font-semibold">{item.title}</h3>
                    {item.date ? (
                      <span className="text-[13px] text-fg-subtle">
                        {formatFullDate(item.date)}
                      </span>
                    ) : null}
                  </div>

                  {item.organization ? (
                    <p className="mt-1 text-[13px] font-medium text-fg-muted">
                      {item.organization}
                    </p>
                  ) : null}

                  {item.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                      {item.description}
                    </p>
                  ) : null}

                  {url || file ? (
                    <div className="mt-3 flex flex-wrap gap-4">
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline"
                        >
                          <ExternalLinkIcon width={13} height={13} />
                          Link
                        </a>
                      ) : null}
                      {file ? (
                        <a
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline"
                        >
                          <DocumentIcon width={13} height={13} />
                          Document
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

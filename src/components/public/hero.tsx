import Image from "next/image";

import { TrackedLink } from "@/components/public/tracked-link";
import { Container } from "@/components/ui";
import { ArrowRightIcon, DocumentIcon, SocialIcon } from "@/components/ui/icons";
import { initials, safeUrl } from "@/lib/utils";
import type { Profile, SocialLink } from "@/db/schema";

/**
 * The only section rendered eagerly above the fold.
 *
 * A Server Component with no client JavaScript of its own beyond outbound-link
 * tracking. The decorative field behind it is painted with CSS gradients, so it
 * costs no request and nothing animates.
 */
export function Hero({
  profile,
  socialLinks,
  focusAreas,
}: {
  profile: Profile;
  socialLinks: SocialLink[];
  /** Derived from the skill categories already in the database. */
  focusAreas: string[];
}) {
  const resumeUrl = safeUrl(profile.resumeUrl);
  const avatar = safeUrl(profile.avatarUrl);

  return (
    <section
      id="home"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28"
    >
      {/* Decorative field. Two stacked gradients, masked so they never draw a
          hard seam where the hero meets the next section. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid mask-fade absolute inset-0" />
        <div className="bg-accent/[0.07] absolute -top-32 left-1/2 h-[32rem] w-[52rem] -translate-x-1/2 rounded-full blur-3xl" />
      </div>

      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:items-start lg:gap-16">
          {/* ---------------------------------------------------------- copy */}
          <div>
            {profile.availableForWork ? (
              <p className="border-border-base bg-bg-raised/70 text-fg-muted mb-8 inline-flex items-center gap-2.5 rounded-full border py-1.5 pr-4 pl-2.5 text-[13px] font-medium backdrop-blur-sm">
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
                  <span className="bg-success relative inline-flex h-2 w-2 rounded-full" />
                </span>
                Open to internships and new grad roles
              </p>
            ) : null}

            <h1 id="hero-heading" className="text-display font-semibold">
              {profile.fullName}
            </h1>

            {profile.headline ? (
              <p className="text-subtitle text-fg-muted mt-6 max-w-3xl font-medium text-pretty">
                {profile.headline}
              </p>
            ) : null}

            {profile.introduction ? (
              <p className="text-fg-subtle text-lead mt-5 max-w-xl">{profile.introduction}</p>
            ) : null}

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a
                href="#projects"
                className="group bg-accent text-accent-fg hover:bg-accent-hover shadow-card hover:shadow-raised inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-medium transition-all duration-200"
              >
                View projects
                <ArrowRightIcon
                  width={15}
                  height={15}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </a>

              {resumeUrl ? (
                <TrackedLink
                  event="resume_view"
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group border-border-base bg-bg-raised text-fg hover:border-border-strong hover:bg-bg-subtle inline-flex h-12 items-center gap-2 rounded-full border px-6 text-[15px] font-medium transition-colors duration-200"
                >
                  <DocumentIcon width={15} height={15} />
                  Resume
                  <ArrowRightIcon
                    width={14}
                    height={14}
                    className="-rotate-45 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </TrackedLink>
              ) : null}
            </div>

            {socialLinks.length > 0 ? (
              <ul className="border-border-hair mt-10 flex flex-wrap items-center gap-1 border-t pt-6">
                {socialLinks.map((link) => {
                  const href = safeUrl(link.url);
                  if (!href) return null;
                  const external = href.startsWith("http");

                  return (
                    <li key={link.id}>
                      <TrackedLink
                        event={`social_${link.platform}`}
                        detail={link.label}
                        href={href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener noreferrer" : undefined}
                        className="text-fg-subtle hover:text-fg hover:bg-bg-subtle inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-200"
                      >
                        <SocialIcon platform={link.platform} width={15} height={15} />
                        {link.label}
                      </TrackedLink>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          {/* ------------------------------------------------- identity panel */}
          <IdentityPanel profile={profile} avatar={avatar} focusAreas={focusAreas} />
        </div>
      </Container>
    </section>
  );
}

/**
 * A structured summary of who is behind the site.
 *
 * Laid out as labelled rows rather than a paragraph, so it reads like a spec
 * sheet — the densest way to answer "who is this, where, and what are they
 * doing right now" at a glance.
 */
function IdentityPanel({
  profile,
  avatar,
  focusAreas,
}: {
  profile: Profile;
  avatar: string | null;
  focusAreas: string[];
}) {
  return (
    <aside className="border-border-base bg-bg-raised/60 rounded-panel shadow-card relative overflow-hidden border backdrop-blur-sm">
      <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-60" />

      <div className="relative">
        {/* Identity */}
        <div className="border-border-hair flex items-center gap-4 border-b p-6">
          {avatar ? (
            <Image
              src={avatar}
              alt=""
              width={52}
              height={52}
              priority
              sizes="52px"
              className="border-border-base h-13 w-13 rounded-full border object-cover"
            />
          ) : (
            <div
              aria-hidden
              className="border-border-base bg-bg-subtle text-fg-muted grid h-13 w-13 shrink-0 place-items-center rounded-full border text-base font-semibold tracking-tight"
              style={{ width: "3.25rem", height: "3.25rem" }}
            >
              {initials(profile.fullName)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-tight">{profile.fullName}</p>
            <p className="text-fg-subtle mt-0.5 truncate font-mono text-[12px]">
              {profile.location || "Software Engineer"}
            </p>
          </div>
        </div>

        <PanelRow label="Currently">
          <p className="text-fg-muted text-[13px] leading-relaxed">
            {profile.currentFocus || profile.headline}
          </p>
        </PanelRow>

        {focusAreas.length > 0 ? (
          <PanelRow label="Focus">
            <ul className="flex flex-wrap gap-1.5">
              {focusAreas.map((area) => (
                <li
                  key={area}
                  className="border-border-base bg-bg text-fg-muted rounded-md border px-2 py-1 font-mono text-[11px] leading-none"
                >
                  {area}
                </li>
              ))}
            </ul>
          </PanelRow>
        ) : null}

        <PanelRow label="Status" last>
          <p className="flex items-center gap-2 text-[13px] font-medium">
            <span
              className={
                profile.availableForWork
                  ? "bg-success h-2 w-2 rounded-full"
                  : "bg-fg-subtle h-2 w-2 rounded-full"
              }
              aria-hidden
            />
            {profile.availableForWork ? "Open to opportunities" : "Not currently looking"}
          </p>
        </PanelRow>
      </div>
    </aside>
  );
}

function PanelRow({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={last ? "p-6" : "border-border-hair border-b p-6"}>
      <p className="label text-fg-subtle mb-2.5">{label}</p>
      {children}
    </div>
  );
}

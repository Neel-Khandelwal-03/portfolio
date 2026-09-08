import Image from "next/image";

import { TrackedLink } from "@/components/public/tracked-link";
import { ButtonLink, Container } from "@/components/ui";
import {
  ArrowRightIcon,
  DocumentIcon,
  LocationIcon,
  SocialIcon,
} from "@/components/ui/icons";
import { initials, safeUrl } from "@/lib/utils";
import type { Profile, SocialLink } from "@/db/schema";

/**
 * The only section rendered eagerly above the fold.
 *
 * It is a Server Component with no client JavaScript of its own beyond the
 * outbound-link tracking, and the avatar is the single `priority` image on the
 * page so it does not compete with anything for bandwidth.
 */
export function Hero({
  profile,
  socialLinks,
}: {
  profile: Profile;
  socialLinks: SocialLink[];
}) {
  const resumeUrl = safeUrl(profile.resumeUrl);
  const avatar = safeUrl(profile.avatarUrl);

  return (
    <section id="home" aria-labelledby="hero-heading" className="pt-14 pb-16 sm:pt-20 sm:pb-24">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start lg:gap-16">
          <div>
            {profile.availableForWork ? (
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-base bg-bg-subtle py-1 pr-3 pl-2 text-xs font-medium text-fg-muted">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-full bg-success"
                />
                Open to internships and new grad roles
              </p>
            ) : null}

            <h1
              id="hero-heading"
              className="text-4xl font-semibold tracking-tight sm:text-5xl"
            >
              {profile.fullName}
            </h1>

            {profile.headline ? (
              <p className="mt-3 text-lg font-medium text-accent sm:text-xl">
                {profile.headline}
              </p>
            ) : null}

            {profile.introduction ? (
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
                {profile.introduction}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="#projects" size="lg">
                View projects
                <ArrowRightIcon width={15} height={15} />
              </ButtonLink>

              {resumeUrl ? (
                <TrackedLink
                  event="resume_view"
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border-base bg-bg-raised px-5 text-[15px] font-medium text-fg transition-colors duration-150 hover:border-border-strong hover:bg-bg-subtle"
                >
                  <DocumentIcon width={15} height={15} />
                  Resume
                </TrackedLink>
              ) : null}

              <ButtonLink href="#contact" variant="ghost" size="lg">
                Get in touch
              </ButtonLink>
            </div>

            {socialLinks.length > 0 ? (
              <ul className="mt-8 flex flex-wrap items-center gap-2">
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
                        className="inline-flex items-center gap-2 rounded-lg border border-border-base px-3 py-2 text-[13px] font-medium text-fg-muted transition-colors duration-150 hover:border-border-strong hover:text-fg"
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

          {/* Compact identity panel — avatar plus the two facts a recruiter
              scans for first. Hidden on small screens where it would only push
              the introduction below the fold. */}
          <aside className="hidden rounded-xl border border-border-base bg-bg-subtle p-5 lg:block">
            <div className="flex items-center gap-4">
              {avatar ? (
                <Image
                  src={avatar}
                  alt=""
                  width={56}
                  height={56}
                  priority
                  sizes="56px"
                  className="h-14 w-14 rounded-full border border-border-base object-cover"
                />
              ) : (
                <div
                  aria-hidden
                  className="grid h-14 w-14 place-items-center rounded-full border border-border-base bg-bg-raised text-base font-semibold text-fg-muted"
                >
                  {initials(profile.fullName)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{profile.fullName}</p>
                {profile.location ? (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-fg-subtle">
                    <LocationIcon width={12} height={12} />
                    {profile.location}
                  </p>
                ) : null}
              </div>
            </div>

            {profile.currentFocus ? (
              <div className="mt-5 border-t border-border-base pt-4">
                <p className="font-mono text-[10px] font-medium tracking-[0.14em] text-fg-subtle uppercase">
                  Currently
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
                  {profile.currentFocus}
                </p>
              </div>
            ) : null}
          </aside>
        </div>
      </Container>
    </section>
  );
}

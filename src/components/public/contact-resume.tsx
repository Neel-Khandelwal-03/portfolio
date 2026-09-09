import Link from "next/link";

import { ContactForm } from "@/components/public/contact-form";
import { TrackedLink } from "@/components/public/tracked-link";
import { Container, Eyebrow } from "@/components/ui";
import {
  ArrowRightIcon,
  DocumentIcon,
  DownloadIcon,
  MailIcon,
  SocialIcon,
} from "@/components/ui/icons";
import { formatTimestamp, safeUrl } from "@/lib/utils";
import type { Profile, SiteSettings, SocialLink } from "@/db/schema";

/* ========================================================================== */
/* Contact — the closing CTA                                                   */
/* ========================================================================== */

/**
 * The page's strongest block after the hero.
 *
 * Inverted against the rest of the page so the ending reads as a deliberate
 * close rather than one more section, and the resume lives here too — by the
 * time someone reaches the bottom, downloading it is the next thing they want.
 */
export function ContactSection({
  profile,
  socialLinks,
  settings,
  index,
}: {
  profile: Profile;
  socialLinks: SocialLink[];
  settings: SiteSettings;
  index: string;
}) {
  const email = profile.email;
  const resumeUrl = safeUrl(profile.resumeUrl);

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="content-auto scroll-mt-28 py-20 sm:py-28"
    >
      <Container>
        <div className="bg-bg-invert text-fg-invert rounded-panel relative overflow-hidden">
          <div aria-hidden className="bg-grid absolute inset-0 opacity-[0.35]" />
          <div
            aria-hidden
            className="bg-accent/20 absolute -top-24 -right-16 h-72 w-72 rounded-full blur-3xl"
          />

          <div className="relative grid gap-12 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:p-16">
            {/* ------------------------------------------------------- pitch */}
            <div>
              <Eyebrow index={index} className="[&>span:last-child]:text-current/60">
                Contact
              </Eyebrow>

              <h2 id="contact-heading" className="text-title mt-5 font-semibold">
                Let&rsquo;s build something
              </h2>

              <p className="text-lead mt-5 max-w-md text-current/70">
                I&rsquo;m open to internships, new grad roles, and interesting engineering problems.
                The fastest way to reach me is email.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {email ? (
                  <TrackedLink
                    event="contact_email"
                    href={`mailto:${email}`}
                    className="group bg-bg-invert text-fg-invert inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-medium mix-blend-difference transition-transform duration-200"
                    style={{ background: "var(--fg-invert)", color: "var(--bg-invert)" }}
                  >
                    <MailIcon width={16} height={16} />
                    {email}
                    <ArrowRightIcon
                      width={14}
                      height={14}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </TrackedLink>
                ) : null}
              </div>

              {/* Links */}
              <ul className="mt-8 flex flex-wrap gap-2 border-t border-current/15 pt-6">
                {socialLinks.map((link) => {
                  const href = safeUrl(link.url);
                  if (!href || link.platform === "email") return null;

                  return (
                    <li key={link.id}>
                      <TrackedLink
                        event={`social_${link.platform}`}
                        detail={link.label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-current/20 px-3.5 py-2 text-[13px] font-medium text-current/80 transition-colors duration-200 hover:border-current/40 hover:text-current"
                      >
                        <SocialIcon platform={link.platform} width={15} height={15} />
                        {link.label}
                      </TrackedLink>
                    </li>
                  );
                })}

                {resumeUrl ? (
                  <li>
                    <TrackedLink
                      event="resume_download"
                      href={resumeUrl}
                      download
                      className="inline-flex items-center gap-2 rounded-lg border border-current/20 px-3.5 py-2 text-[13px] font-medium text-current/80 transition-colors duration-200 hover:border-current/40 hover:text-current"
                    >
                      <DownloadIcon width={15} height={15} />
                      Resume
                    </TrackedLink>
                  </li>
                ) : null}
              </ul>
            </div>

            {/* -------------------------------------------------------- form */}
            {settings.contactFormEnabled ? (
              <div className="bg-bg text-fg rounded-card p-6 sm:p-8">
                <p className="label text-fg-subtle mb-5">Send a message</p>
                <ContactForm recipient={email || "your email address"} />
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ========================================================================== */
/* Resume                                                                      */
/* ========================================================================== */

/**
 * A slim resume band rather than a full section — the resume is also reachable
 * from the nav, the hero and the contact block, so it does not need to occupy
 * a full screen of its own.
 */
export function ResumeStrip({ profile }: { profile: Profile }) {
  const resumeUrl = safeUrl(profile.resumeUrl);
  if (!resumeUrl) return null;

  return (
    <section id="resume" aria-labelledby="resume-heading" className="content-auto scroll-mt-28">
      <Container>
        <div className="border-border-base bg-bg-subtle rounded-card flex flex-col items-start gap-5 border p-6 sm:flex-row sm:items-center sm:p-7">
          <div className="border-border-base bg-bg-raised grid h-12 w-12 shrink-0 place-items-center rounded-xl border">
            <DocumentIcon width={20} height={20} className="text-accent" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 id="resume-heading" className="text-[15px] font-semibold">
              {profile.fullName} — Resume
            </h2>
            <p className="text-fg-subtle mt-1 font-mono text-[12px]">
              PDF · updated {formatTimestamp(profile.resumeUpdatedAt)}
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <TrackedLink
              event="resume_view"
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent text-accent-fg hover:bg-accent-hover inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors duration-200 sm:flex-none"
            >
              View
              <ArrowRightIcon width={14} height={14} className="-rotate-45" />
            </TrackedLink>
            <TrackedLink
              event="resume_download"
              href={resumeUrl}
              download
              className="border-border-base bg-bg-raised text-fg hover:border-border-strong inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors duration-200 sm:flex-none"
            >
              <DownloadIcon width={15} height={15} />
              Download
            </TrackedLink>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ========================================================================== */
/* Footer                                                                      */
/* ========================================================================== */

export function SiteFooter({
  profile,
  socialLinks,
  settings,
}: {
  profile: Profile;
  socialLinks: SocialLink[];
  settings: SiteSettings;
}) {
  const resumeUrl = safeUrl(profile.resumeUrl);

  return (
    <footer className="no-print border-border-hair border-t py-12">
      <Container>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              {profile.fullName}
              <span className="bg-accent inline-block h-1.5 w-1.5 rounded-full" aria-hidden />
            </p>
            {profile.headline ? (
              <p className="text-fg-subtle mt-2 max-w-sm text-[13px] leading-relaxed">
                {profile.headline}
              </p>
            ) : null}
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            {socialLinks.map((link) => {
              const href = safeUrl(link.url);
              if (!href) return null;
              const external = href.startsWith("http");

              return (
                <TrackedLink
                  key={link.id}
                  event={`social_${link.platform}`}
                  detail="footer"
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="text-fg-muted hover:text-fg link-underline text-[13px] font-medium transition-colors duration-200"
                >
                  {link.label}
                </TrackedLink>
              );
            })}
            {resumeUrl ? (
              <TrackedLink
                event="resume_view"
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg-muted hover:text-fg link-underline text-[13px] font-medium transition-colors duration-200"
              >
                Resume
              </TrackedLink>
            ) : null}
            <Link
              href="/projects"
              className="text-fg-muted hover:text-fg link-underline text-[13px] font-medium transition-colors duration-200"
            >
              All projects
            </Link>
          </nav>
        </div>

        <div className="border-border-hair text-fg-subtle mt-10 flex flex-col gap-2 border-t pt-6 font-mono text-[11px] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {profile.fullName}
          </p>
          {settings.footerText ? <p>{settings.footerText}</p> : null}
        </div>
      </Container>
    </footer>
  );
}

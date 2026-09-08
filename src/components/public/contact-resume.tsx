import { ContactForm } from "@/components/public/contact-form";
import { TrackedLink } from "@/components/public/tracked-link";
import { Card, Container, Section } from "@/components/ui";
import {
  DocumentIcon,
  DownloadIcon,
  LocationIcon,
  MailIcon,
  SocialIcon,
} from "@/components/ui/icons";
import { formatTimestamp, safeUrl } from "@/lib/utils";
import type { Profile, SiteSettings, SocialLink } from "@/db/schema";

/* ========================================================================== */
/* Resume                                                                      */
/* ========================================================================== */

export function ResumeSection({ profile }: { profile: Profile }) {
  const resumeUrl = safeUrl(profile.resumeUrl);

  return (
    <Section
      id="resume"
      eyebrow="08 / Resume"
      title="Resume"
      description="The full document, kept up to date."
    >
      <Card className="reveal flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
        <div className="border-border-base bg-bg-subtle grid h-12 w-12 shrink-0 place-items-center rounded-lg border">
          <DocumentIcon width={20} height={20} className="text-accent" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">{profile.fullName} — Resume</p>
          <p className="text-fg-muted mt-1 text-sm">
            {resumeUrl
              ? `PDF · last updated ${formatTimestamp(profile.resumeUpdatedAt)}`
              : "No resume uploaded yet. Upload one from the admin dashboard."}
          </p>
        </div>

        {resumeUrl ? (
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <TrackedLink
              event="resume_view"
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent text-accent-fg hover:bg-accent-hover inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors duration-150 sm:flex-none"
            >
              <DocumentIcon width={15} height={15} />
              View
            </TrackedLink>
            <TrackedLink
              event="resume_download"
              href={resumeUrl}
              download
              className="border-border-base bg-bg-raised text-fg hover:border-border-strong hover:bg-bg-subtle inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors duration-150 sm:flex-none"
            >
              <DownloadIcon width={15} height={15} />
              Download
            </TrackedLink>
          </div>
        ) : null}
      </Card>
    </Section>
  );
}

/* ========================================================================== */
/* Contact                                                                     */
/* ========================================================================== */

export function ContactSection({
  profile,
  socialLinks,
  settings,
}: {
  profile: Profile;
  socialLinks: SocialLink[];
  settings: SiteSettings;
}) {
  const email = profile.email;

  return (
    <Section
      id="contact"
      eyebrow="09 / Contact"
      title="Get in touch"
      description="Open to internships, new grad roles and interesting problems."
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
        <div className="reveal space-y-3">
          {email ? (
            <a
              href={`mailto:${email}`}
              className="border-border-base bg-bg-raised hover:border-border-strong flex items-center gap-3 rounded-xl border p-4 transition-colors duration-150"
            >
              <MailIcon width={16} height={16} className="text-accent shrink-0" />
              <span className="min-w-0">
                <span className="text-fg-subtle block text-[13px] font-medium">Email</span>
                <span className="block truncate text-sm font-medium">{email}</span>
              </span>
            </a>
          ) : null}

          {profile.location ? (
            <div className="border-border-base bg-bg-raised flex items-center gap-3 rounded-xl border p-4">
              <LocationIcon width={16} height={16} className="text-accent shrink-0" />
              <span>
                <span className="text-fg-subtle block text-[13px] font-medium">Location</span>
                <span className="block text-sm font-medium">{profile.location}</span>
              </span>
            </div>
          ) : null}

          {socialLinks.map((link) => {
            const href = safeUrl(link.url);
            if (!href || link.platform === "email") return null;

            return (
              <TrackedLink
                key={link.id}
                event={`social_${link.platform}`}
                detail={link.label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border-base bg-bg-raised hover:border-border-strong flex items-center gap-3 rounded-xl border p-4 transition-colors duration-150"
              >
                <SocialIcon
                  platform={link.platform}
                  width={16}
                  height={16}
                  className="text-accent shrink-0"
                />
                <span className="min-w-0">
                  <span className="text-fg-subtle block text-[13px] font-medium">{link.label}</span>
                  <span className="block truncate text-sm font-medium">
                    {href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                  </span>
                </span>
              </TrackedLink>
            );
          })}
        </div>

        {settings.contactFormEnabled ? (
          <div className="reveal">
            <ContactForm recipient={email || "your email address"} />
          </div>
        ) : null}
      </div>
    </Section>
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
  return (
    <footer className="no-print border-border-base border-t py-10">
      <Container className="flex flex-col items-center justify-between gap-5 sm:flex-row">
        <div className="text-center sm:text-left">
          <p className="text-sm font-medium">
            © {new Date().getFullYear()} {profile.fullName}
          </p>
          {settings.footerText ? (
            <p className="text-fg-subtle mt-1 text-[13px]">{settings.footerText}</p>
          ) : null}
        </div>

        <ul className="flex items-center gap-1">
          {socialLinks.map((link) => {
            const href = safeUrl(link.url);
            if (!href) return null;
            const external = href.startsWith("http");

            return (
              <li key={link.id}>
                <TrackedLink
                  event={`social_${link.platform}`}
                  detail="footer"
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  aria-label={link.label}
                  className="text-fg-subtle hover:bg-bg-subtle hover:text-fg grid h-9 w-9 place-items-center rounded-lg transition-colors duration-150"
                >
                  <SocialIcon platform={link.platform} width={16} height={16} />
                </TrackedLink>
              </li>
            );
          })}
        </ul>
      </Container>
    </footer>
  );
}

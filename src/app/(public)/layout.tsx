import type { ReactNode } from "react";

import { SiteNav, type NavItem } from "@/components/public/site-nav";
import { SiteFooter } from "@/components/public/contact-resume";
import { getSectionIndex, type SectionId } from "@/lib/sections";
import { safeUrl } from "@/lib/utils";
import { getProfile, getSiteSettings, getSocialLinks } from "@/services/portfolio";

/**
 * Labels for the sections that earn a nav slot.
 *
 * Achievements is deliberately absent: it is a short section and the pill nav
 * stays readable at six or seven items. Anything listed here is filtered
 * against the sections that actually render, so a link can never point at an
 * anchor that is not on the page.
 */
const NAV_LABELS: Partial<Record<SectionId, string>> = {
  about: "About",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
  contact: "Contact",
};

export default async function PublicLayout({ children }: { children: ReactNode }) {
  // Tag-cached reads. They run concurrently and, once the page is static, never
  // touch the database on a visitor request at all.
  const [profile, socialLinks, settings, sections] = await Promise.all([
    getProfile(),
    getSocialLinks(),
    getSiteSettings(),
    getSectionIndex(),
  ]);

  // Same source of truth as the section numbering, so the two cannot drift.
  const items: NavItem[] = sections.ids
    .filter((id) => NAV_LABELS[id])
    .map((id) => ({ id, label: NAV_LABELS[id]! }));

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="focus:bg-accent focus:text-accent-fg sr-only z-[60] focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      <SiteNav
        items={items}
        name={profile.fullName.split(" ")[0] || "Portfolio"}
        resumeUrl={safeUrl(profile.resumeUrl)}
      />

      <main id="main" className="flex-1">
        {children}
      </main>

      <SiteFooter profile={profile} socialLinks={socialLinks} settings={settings} />
    </div>
  );
}

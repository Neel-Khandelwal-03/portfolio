import type { ReactNode } from "react";

import { SiteNav, type NavItem } from "@/components/public/site-nav";
import { SiteFooter } from "@/components/public/contact-resume";
import { safeUrl } from "@/lib/utils";
import {
  getCertifications,
  getProfile,
  getSiteSettings,
  getSocialLinks,
} from "@/services/portfolio";

const BASE_NAV: NavItem[] = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];

export default async function PublicLayout({ children }: { children: ReactNode }) {
  // Tag-cached reads. They run concurrently and, once the page is static, never
  // touch the database on a visitor request at all.
  const [profile, socialLinks, settings, certifications] = await Promise.all([
    getProfile(),
    getSocialLinks(),
    getSiteSettings(),
    getCertifications(),
  ]);

  // Sections with no content render nothing, so their nav entries would scroll
  // to a missing anchor. Build the menu from what actually exists.
  const items =
    certifications.length > 0
      ? [
          ...BASE_NAV.slice(0, 5),
          { id: "certifications", label: "Certifications" },
          ...BASE_NAV.slice(5),
        ]
      : BASE_NAV;

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

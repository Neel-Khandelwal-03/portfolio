import type { ReactNode } from "react";

import { SiteNav, type NavItem } from "@/components/public/site-nav";
import { SiteFooter } from "@/components/public/contact-resume";
import { getProfile, getSiteSettings, getSocialLinks } from "@/services/portfolio";

const NAV_ITEMS: NavItem[] = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "education", label: "Education" },
  { id: "certifications", label: "Certifications" },
  { id: "contact", label: "Contact" },
];

export default async function PublicLayout({ children }: { children: ReactNode }) {
  // Three tag-cached reads. They run concurrently and, once the page is static,
  // never touch the database on a visitor request at all.
  const [profile, socialLinks, settings] = await Promise.all([
    getProfile(),
    getSocialLinks(),
    getSiteSettings(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-[60] focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-fg"
      >
        Skip to content
      </a>

      <SiteNav items={NAV_ITEMS} name={profile.fullName.split(" ")[0] || "Portfolio"} />

      <main id="main" className="flex-1">
        {children}
      </main>

      <SiteFooter profile={profile} socialLinks={socialLinks} settings={settings} />
    </div>
  );
}
